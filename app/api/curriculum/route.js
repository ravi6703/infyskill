// Server-side AI deep-analysis for the university curriculum comparison.
// The OpenAI key lives ONLY in process.env.OPENAI_API_KEY (set in Vercel env). Never sent to the browser.
// Runs on top of the deterministic two-lens result — opt-in, so the base tool stays instant & free.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.DIAGNOSTIC_MODEL || "gpt-4o-mini";

async function callOpenAI(key, prompt, maxTokens = 1300) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an expert higher-education curriculum strategist who advises universities on how AI is reshaping graduate employability. You are specific, credible and honest. You reason ONLY from the data provided and never invent subjects or facts the data does not support. You respond with ONLY valid JSON, no markdown, no prose." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: maxTokens,
    }),
  });
  if (!r.ok) throw new Error("openai_" + r.status);
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || "";
}

function parse(text) { try { return JSON.parse(text); } catch { return null; } }
const cap = (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []);

export async function POST(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ ok: false, reason: "no_key" });

  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false, reason: "bad_request" }); }

  const {
    name = "this curriculum", idealName = "an ideal AI-era program",
    syllabusPct = 0, aiReady = 0,
    syllabusGaps = [], missing = [], present = [], bridges = [], roles = [],
  } = body || {};

  const bridgeLines = cap(bridges, 12)
    .map((b) => (b && b.skill ? `- ${b.skill}${b.course ? ` → Board Infinity: "${b.course}"` : ""}` : null))
    .filter(Boolean).join("\n");

  const prompt = `Analyse this university curriculum's AI-era readiness for a Dean / academic decision-maker.

CURRICULUM: "${name}"
Benchmarked against the ideal program "${idealName}" — subject-level syllabus match: ${syllabusPct}%.
Subjects present in the ideal program but MISSING here: ${cap(syllabusGaps, 25).join("; ") || "none detected"}.

AI-era employability score: ${aiReady}% (the curriculum covers these in-demand skills: ${cap(present, 20).join(", ") || "few"}).
In-demand AI-era skills the curriculum is MISSING: ${cap(missing, 15).join(", ") || "none detected"}.

Board Infinity content that maps to the missing skills:
${bridgeLines || "- (general blended catalogue)"}

Roles graduates could target once gaps close: ${cap(roles, 8).join(", ") || "AI-era roles"}.

Write a tailored, honest, decision-maker-ready analysis grounded ONLY in the data above. Return ONLY JSON of this exact shape:
{
  "headline": "one punchy sentence verdict on how AI-ready this curriculum is",
  "verdict": "2-3 sentences: the honest strategic read of where this curriculum stands as AI reshapes hiring in this field",
  "strengths": ["2-3 things the curriculum already does well, reasonably inferred from the match score and covered skills"],
  "criticalGaps": [{"area":"the missing capability (use the missing items above)","why":"why it specifically matters in the AI era","impact":"the concrete employability / placement risk of leaving it out"}],
  "industryShift": "one sentence on what employers in this field now expect that they did not 3 years ago",
  "priorityActions": ["3-4 items, ordered, what to add FIRST — most urgent first"],
  "bridge": "1-2 sentences on how Board Infinity's content + blended model closes these gaps without rebuilding the degree"
}
criticalGaps: 3-4 items, most consequential first. Be specific to the missing items; do not invent gaps the data does not show.`;

  try {
    const a = parse(await callOpenAI(key, prompt, 1300));
    if (!a || !a.headline) return Response.json({ ok: false, reason: "parse" });
    // normalise shapes defensively
    const out = {
      headline: String(a.headline || ""),
      verdict: String(a.verdict || ""),
      strengths: cap(a.strengths, 4).map(String),
      criticalGaps: cap(a.criticalGaps, 4).map((g) => ({
        area: String(g?.area || ""), why: String(g?.why || ""), impact: String(g?.impact || ""),
      })).filter((g) => g.area),
      industryShift: String(a.industryShift || ""),
      priorityActions: cap(a.priorityActions, 5).map(String),
      bridge: String(a.bridge || ""),
    };
    return Response.json({ ok: true, analysis: out });
  } catch (e) {
    return Response.json({ ok: false, reason: String(e.message || e) });
  }
}
