// Server-side AI diagnostic — the OpenAI key lives ONLY in process.env.OPENAI_API_KEY
// (set in Vercel → Project → Settings → Environment Variables). Never sent to the browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.DIAGNOSTIC_MODEL || "gpt-4o-mini";

async function callOpenAI(key, prompt, maxTokens = 1800) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a senior technical interviewer. You respond with ONLY valid JSON, no markdown, no prose." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });
  if (!r.ok) throw new Error("openai_" + r.status);
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || "";
}

function parse(text) { try { return JSON.parse(text); } catch { return null; } }

export async function POST(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ ok: false, reason: "no_key" });

  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false, reason: "bad_request" }); }
  const { action } = body;

  try {
    if (action === "assess") {
      const { role, clusters = [], profile = {} } = body;
      const level = profile.exp === "0" ? "absolute fundamentals (fresher / no experience) — test foundational understanding"
        : profile.exp === "1-3" ? "early-career applied — test ability to apply concepts on the job"
        : "experienced / advanced — test applied judgement, trade-offs and edge cases";
      const prompt = `Design a SHORT diagnostic that measures a candidate's REAL capability for the role "${role}".
Candidate: background=${profile.background || "?"}, experience=${profile.exp || "?"}, education=${profile.edu || "?"}, current="${profile.currentRole || "n/a"}".
Calibrate difficulty to: ${level}.
Skill areas to probe (use EXACTLY these strings as the "cluster" field): ${clusters.join(" | ") || "core skills for this role"}.
Write 5 concise multiple-choice questions that TEST understanding (mix conceptual + practical scenario), spread across the skill areas, adapted to the candidate's profile. Keep each question and option short.
Return JSON of the shape:
{"questions":[{"q":"short question","options":["a","b","c","d"],"correct":0,"cluster":"<one of the skill areas>"}]}
Exactly 5 questions. correct is the 0-based index of the right option. No explanations.`;
      const data = parse(await callOpenAI(key, prompt, 1100));
      const qs = Array.isArray(data?.questions) ? data.questions : [];
      const clean = qs.filter((x) => x && x.q && Array.isArray(x.options) && x.options.length >= 2 && Number.isInteger(x.correct))
        .slice(0, 5).map((x) => ({ q: String(x.q), options: x.options.slice(0, 4).map(String), correct: Math.max(0, Math.min(3, x.correct)), cluster: String(x.cluster || clusters[0] || "Core") }));
      if (!clean.length) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, questions: clean });
    }

    if (action === "followup") {
      const { role, profile = {}, weak = [] } = body;
      const n = Math.min(Math.max(weak.length, 2), 4);
      const prompt = `A candidate targeting "${role}" (background=${profile.background || "?"}, experience=${profile.exp || "?"}) scored LOW on these skill areas in a first check: ${weak.join(" | ")}.
Write ${n} HARDER, more specific multiple-choice questions ONLY on those areas, to confirm whether the gap is real (deeper/applied, not repeats). Keep concise.
Return JSON: {"questions":[{"q":"short question","options":["a","b","c","d"],"correct":0,"cluster":"<one of the weak areas>"}]}
Exactly ${n} questions. correct is the 0-based index.`;
      const data = parse(await callOpenAI(key, prompt, 900));
      const qs = Array.isArray(data?.questions) ? data.questions : [];
      const clean = qs.filter((x) => x && x.q && Array.isArray(x.options) && x.options.length >= 2 && Number.isInteger(x.correct))
        .slice(0, n).map((x) => ({ q: String(x.q), options: x.options.slice(0, 4).map(String), correct: Math.max(0, Math.min(3, x.correct)), cluster: String(x.cluster || weak[0] || "Core") }));
      if (!clean.length) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, questions: clean });
    }

    if (action === "analyze") {
      const { role, profile = {}, scored = [], overall = 0 } = body;
      const lines = scored.map((s) => `- ${s.cluster}: ${s.correct}/${s.total} correct`).join("\n");
      const prompt = `A candidate took a diagnostic for the role "${role}". Profile: background=${profile.background}, experience=${profile.exp}, education=${profile.edu}.
Per-skill results:\n${lines}\nOverall: ${overall}% correct.
Give an honest capability read. Return JSON:
{"verdict":"one honest sentence on where they stand for this role","strengths":["..."],"gaps":["2-4 specific skill areas to prioritise, most important first"],"focus":"one sentence on what their plan should emphasise first"}`;
      const a = parse(await callOpenAI(key, prompt, 600));
      if (!a) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, analysis: a });
    }

    if (action === "recommend") {
      const { profile = {}, prefs = {}, roles = [] } = body;
      const roleList = roles.map((r) => `${r.role} [${r.bucket}]`).join("\n");
      const prompt = `Recommend the best-fit AI-era career roles for this person, choosing ONLY from the exact list below.
Profile: background=${profile.background || "?"}, experience=${profile.exp || "?"}, education=${profile.edu || "?"}, current="${profile.currentRole || "n/a"}".
What excites them: ${prefs.excites || "?"}. Strongest aptitude: ${prefs.aptitude || "?"}. Desired impact area: ${prefs.impact || "?"}.
Roles (use EXACT names):\n${roleList}
Return JSON: {"recommendations":[{"role":"<exact name from the list>","why":"one specific sentence on why it fits them","fit":<55-95>}]} — top 3, best first.`;
      const data = parse(await callOpenAI(key, prompt, 600));
      const recs = Array.isArray(data?.recommendations) ? data.recommendations : [];
      const valid = recs.filter((r) => r && r.role).slice(0, 3).map((r) => ({ role: String(r.role), why: String(r.why || ""), fit: Math.max(40, Math.min(99, Number(r.fit) || 70)) }));
      if (!valid.length) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, recommendations: valid });
    }

    return Response.json({ ok: false, reason: "unknown_action" });
  } catch (e) {
    return Response.json({ ok: false, reason: String(e.message || e) });
  }
}
