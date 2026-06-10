// Server-side AI diagnostic — the Anthropic key lives ONLY in process.env.ANTHROPIC_API_KEY
// (set in Vercel → Project → Settings → Environment Variables). Never sent to the browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.DIAGNOSTIC_MODEL || "claude-sonnet-4-6";

function extractJSON(text) {
  if (!text) return null;
  // strip code fences and grab the first {...} or [...] block
  const cleaned = text.replace(/```json|```/g, "").trim();
  const m = cleaned.match(/[[{][\s\S]*[\]}]/);
  try { return JSON.parse(m ? m[0] : cleaned); } catch { return null; }
}

async function callClaude(key, prompt, maxTokens = 1600) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error("anthropic_" + r.status);
  const j = await r.json();
  return j?.content?.[0]?.text || "";
}

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ ok: false, reason: "no_key" });

  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false, reason: "bad_request" }); }
  const { action } = body;

  try {
    if (action === "assess") {
      const { role, clusters = [], profile = {} } = body;
      const level = profile.exp === "0" ? "absolute fundamentals (fresher / no experience)"
        : profile.exp === "1-3" ? "early-career applied" : "experienced / advanced applied";
      const prompt = `You are a senior technical interviewer designing a SHORT diagnostic to gauge a candidate's REAL capability for the role of "${role}".
Candidate profile: background=${profile.background||"unknown"}, experience=${profile.exp||"unknown"}, education=${profile.edu||"unknown"}, current role="${profile.currentRole||"n/a"}".
Calibrate difficulty to: ${level}.
Skill areas to probe (use these as the "cluster" values): ${clusters.join(", ") || "core skills for the role"}.

Generate exactly 6 multiple-choice questions that TEST real understanding (mix of conceptual + practical scenario), NOT self-rating. Spread them across the skill areas. Adapt wording and difficulty to the candidate's profile (a fresher gets foundational checks; an experienced candidate gets applied/edge-case scenarios).

Return ONLY valid JSON, an array of 6 objects, each:
{"q":"question text","options":["a","b","c","d"],"correct":<0-3>,"cluster":"<one of the skill areas>","why":"one-line explanation of the correct answer"}
No prose, no markdown — JSON array only.`;
      const text = await callClaude(key, prompt, 1800);
      const qs = extractJSON(text);
      if (!Array.isArray(qs) || !qs.length) return Response.json({ ok: false, reason: "parse" });
      const clean = qs.filter((x) => x && x.q && Array.isArray(x.options) && x.options.length >= 2 && Number.isInteger(x.correct))
        .slice(0, 6).map((x) => ({ q: String(x.q), options: x.options.slice(0, 4).map(String), correct: Math.max(0, Math.min(3, x.correct)), cluster: String(x.cluster || clusters[0] || "Core"), why: String(x.why || "") }));
      return Response.json({ ok: true, questions: clean });
    }

    if (action === "analyze") {
      const { role, profile = {}, scored = [], overall = 0 } = body;
      const lines = scored.map((s) => `- ${s.cluster}: ${s.correct}/${s.total} correct`).join("\n");
      const prompt = `A candidate took a diagnostic for the role "${role}". Profile: background=${profile.background}, experience=${profile.exp}, education=${profile.edu}.
Per-skill results:\n${lines}\nOverall correct: ${overall}%.

Write a crisp, honest capability assessment. Return ONLY valid JSON:
{"verdict":"one-sentence honest read of where they stand for this role","strengths":["..."],"gaps":["the 2-4 specific skill areas to prioritise, most important first"],"focus":"one sentence on what their learning plan should emphasise first"}
No prose outside JSON.`;
      const text = await callClaude(key, prompt, 700);
      const a = extractJSON(text);
      if (!a) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, analysis: a });
    }

    return Response.json({ ok: false, reason: "unknown_action" });
  } catch (e) {
    return Response.json({ ok: false, reason: String(e.message || e) });
  }
}
