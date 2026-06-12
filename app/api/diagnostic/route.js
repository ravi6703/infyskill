// Server-side AI diagnostic. The OpenAI key lives ONLY in process.env.OPENAI_API_KEY (Vercel env). Never sent to the browser.
// Actions: ladder (offline pool gen) · assess (flat fallback) · followup · extract (résumé→profile) · analyze · recommend
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.DIAGNOSTIC_MODEL || "gpt-4o-mini";

async function callOpenAI(key, prompt, maxTokens = 1800, system = "You respond with ONLY valid JSON, no markdown, no prose.") {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
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
const cleanQ = (qs, n, fallbackCluster) => (Array.isArray(qs) ? qs : [])
  .filter((x) => x && x.q && Array.isArray(x.options) && x.options.length >= 2 && Number.isInteger(x.correct))
  .slice(0, n)
  .map((x) => ({ q: String(x.q), options: x.options.slice(0, 4).map(String), correct: Math.max(0, Math.min(3, x.correct)), cluster: String(x.cluster || fallbackCluster || "Core"), level: Math.max(1, Math.min(3, Number(x.level) || 1)) }));

const LEVEL_DESC = {
  1: "FOUNDATIONAL recall — a key definition or core idea; answerable by anyone who learned the basics",
  2: "APPLIED — a short realistic scenario where they must choose the right approach/tool",
  3: "JUDGEMENT — trade-offs, edge cases, debugging or design decisions an experienced practitioner faces",
};

export async function POST(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ ok: false, reason: "no_key" });
  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false, reason: "bad_request" }); }
  const { action } = body;

  try {
    // ---- LADDER: difficulty-laddered pool (used offline to pre-build the bank) ----
    if (action === "ladder") {
      const { role, clusters = [], level = 1 } = body;
      const probe = (clusters.length ? clusters : ["core skills for this role"]).slice(0, 7);
      const count = probe.length * 2;
      const prompt = `For the role "${role}", write multiple-choice questions at ONE difficulty level.
Difficulty level ${level} = ${LEVEL_DESC[level] || LEVEL_DESC[1]}.
Write EXACTLY 2 questions for EACH of these skill areas (use the EXACT string as the "cluster" field, set "level":${level}): ${probe.join(" | ")}.
Distractors must be plausible (not obviously wrong). Keep each question and option concise.
Return JSON: {"questions":[{"q":"...","options":["a","b","c","d"],"correct":0,"cluster":"<one area>","level":${level}}]}
Exactly ${count} questions, 2 per area. correct is the 0-based index.`;
      const data = parse(await callOpenAI(key, prompt, 2000));
      const clean = cleanQ(data?.questions, count, probe[0]).map((q) => ({ ...q, level }));
      if (clean.length < 2) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, questions: clean });
    }

    // ---- ASSESS: flat set (fallback when pool is missing) ----
    if (action === "assess") {
      const { role, clusters = [], profile = {} } = body;
      const level = profile.exp === "0" ? "fundamentals" : profile.exp === "1-3" ? "early-career applied" : "experienced/advanced";
      const probe = (clusters.length ? clusters : ["core skills"]).slice(0, 6);
      const count = probe.length * 2;
      const prompt = `Rigorous diagnostic for "${role}" (calibrate to: ${level}). Skill areas (use EXACTLY as "cluster"): ${probe.join(" | ")}.
Write EXACTLY ${count} MCQs — 2 per area (one conceptual + one applied scenario). Plausible distractors, concise.
Return JSON {"questions":[{"q":"...","options":["a","b","c","d"],"correct":0,"cluster":"<area>"}]}. ${count} questions.`;
      const clean = cleanQ(parse(await callOpenAI(key, prompt, 2000))?.questions, count, probe[0]);
      if (clean.length < 4) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, questions: clean });
    }

    // ---- FOLLOWUP: harder questions on specific weak areas (live) ----
    if (action === "followup") {
      const { role, profile = {}, weak = [] } = body;
      const n = Math.min(Math.max(weak.length, 2), 4);
      const prompt = `Candidate targeting "${role}" (exp=${profile.exp || "?"}) was uncertain on: ${weak.join(" | ")}.
Write ${n} HARDER, applied multiple-choice questions ONLY on those areas to confirm whether the gap is real. Concise.
Return JSON {"questions":[{"q":"...","options":["a","b","c","d"],"correct":0,"cluster":"<weak area>","level":3}]}. ${n} questions.`;
      const clean = cleanQ(parse(await callOpenAI(key, prompt, 1100))?.questions, n, weak[0]).map((q) => ({ ...q, level: 3 }));
      if (!clean.length) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, questions: clean });
    }

    // ---- EXTRACT: résumé / pasted experience text → structured, evidence-based profile ----
    if (action === "extract") {
      const { role, clusters = [], text = "" } = body;
      const t = String(text).slice(0, 9000); // cap input; PII handled transiently, never persisted by this route
      if (t.trim().length < 40) return Response.json({ ok: false, reason: "too_short" });
      const probe = (clusters.length ? clusters : ["core skills"]).slice(0, 7);
      const prompt = `Read this candidate's résumé / experience text and extract an EVIDENCE-BASED profile for someone targeting the role "${role}".
For EACH of these skill areas, rate the evidence shown in the text as exactly one of: "none" | "basic" | "intermediate" | "advanced". Rate ONLY from what the text actually evidences — do not assume.
Skill areas: ${probe.join(" | ")}.
Also infer overall seniority ("student"|"entry"|"mid"|"senior") and total years of relevant experience (integer, 0 if unclear).
TEXT:
"""${t}"""
Return JSON: {"seniority":"...","years":0,"areas":{"<area>":"none|basic|intermediate|advanced"},"evidenced_skills":["..."],"summary":"one neutral sentence on where they stand vs the role"}`;
      const a = parse(await callOpenAI(key, prompt, 700, "You are a precise résumé analyst. Output ONLY valid JSON. Never invent experience the text does not support."));
      if (!a || !a.areas) return Response.json({ ok: false, reason: "parse" });
      const LV = { none: "none", basic: "basic", intermediate: "intermediate", advanced: "advanced" };
      const areas = {};
      for (const k of probe) { const v = String(a.areas[k] || "none").toLowerCase(); areas[k] = LV[v] || "none"; }
      return Response.json({ ok: true, profile: {
        seniority: String(a.seniority || "entry"), years: Math.max(0, Math.min(40, Number(a.years) || 0)),
        areas, evidenced: Array.isArray(a.evidenced_skills) ? a.evidenced_skills.slice(0, 20).map(String) : [],
        summary: String(a.summary || ""),
      }});
    }

    // ---- ANALYZE: capability synthesis from per-cluster LEVELS (1-4) ----
    if (action === "analyze") {
      const { role, profile = {}, scored = [], readiness = 0 } = body;
      const lines = scored.map((s) => `- ${s.cluster}: ${s.label}${s.confidence ? ` (confidence ${s.confidence})` : ""}`).join("\n");
      const prompt = `A candidate took an ADAPTIVE skill assessment for "${role}". Profile: background=${profile.background}, experience=${profile.exp}, goal=${profile.goal || "?"}.
Measured level per skill area (Novice<Developing<Proficient<Advanced):
${lines}
Overall readiness: ${readiness}%.
Give an honest capability read. Return JSON:
{"verdict":"one honest sentence on where they stand for this role","strengths":["areas they're genuinely ready in"],"gaps":["2-4 areas to prioritise, most important first"],"focus":"one sentence on what their journey should emphasise first given their goal"}`;
      const a = parse(await callOpenAI(key, prompt, 650));
      if (!a) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, analysis: a });
    }

    // ---- RECOMMEND: best-fit roles from interests ----
    if (action === "recommend") {
      const { profile = {}, prefs = {}, roles = [] } = body;
      const roleList = roles.map((r) => `${r.role} [${r.bucket}]`).join("\n");
      const prompt = `Recommend the best-fit AI-era roles for this person, ONLY from the list.
Profile: background=${profile.background || "?"}, experience=${profile.exp || "?"}, current="${profile.currentRole || "n/a"}".
Excites: ${prefs.excites || "?"}. Aptitude: ${prefs.aptitude || "?"}. Impact: ${prefs.impact || "?"}.
Roles:\n${roleList}
Return JSON {"recommendations":[{"role":"<exact name>","why":"one specific sentence","fit":<55-95>}]} — top 3.`;
      const data = parse(await callOpenAI(key, prompt, 600));
      const valid = (Array.isArray(data?.recommendations) ? data.recommendations : [])
        .filter((r) => r && r.role).slice(0, 3)
        .map((r) => ({ role: String(r.role), why: String(r.why || ""), fit: Math.max(40, Math.min(99, Number(r.fit) || 70)) }));
      if (!valid.length) return Response.json({ ok: false, reason: "parse" });
      return Response.json({ ok: true, recommendations: valid });
    }

    return Response.json({ ok: false, reason: "unknown_action" });
  } catch (e) {
    return Response.json({ ok: false, reason: String(e.message || e) });
  }
}
