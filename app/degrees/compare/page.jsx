"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import refs from "../../../data/reference_curricula.json";
import courses from "../../../data/courses.json";
import specs from "../../../data/journeys.json";
import skillMeta from "../../../data/skills.json";

const clean = (t) => t.replace(/^[:\s]+/, "");
const CLUSTER_OF = Object.fromEntries(skillMeta.map((s) => [s.name.toLowerCase(), s.cluster]));

function tokens(s) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
}
const courseTok = courses.map((c) => ({ c, tok: tokens(c.title), sk: c.skills }));

// match a subject line to a BI course (by title-token overlap or skill keyword)
function matchSubject(subject) {
  const st = tokens(subject);
  let best = null, score = 0;
  for (const { c, tok } of courseTok) {
    let inter = 0;
    for (const w of st) if (tok.has(w)) inter++;
    const sc = inter / Math.max(2, Math.min(st.size, tok.size));
    if (sc > score) { score = sc; best = c; }
  }
  // skill keyword fallback
  if (score < 0.34) {
    for (const { c, sk } of courseTok) {
      const hit = sk.some((s) => { const sl = s.toLowerCase(); return [...st].some((w) => sl.includes(w)); });
      if (hit) { best = best || c; score = Math.max(score, 0.34); break; }
    }
  }
  const status = score >= 0.5 ? "Full" : score >= 0.34 ? "Partial" : "Gap";
  return { subject, status, course: status === "Gap" ? null : best };
}

const FACULTY_KEEP = /operating system|computer network|discrete|theory of computation|linear algebra|microeconom|business law|organizational behaviour|probability|calculus|research method|thesis/i;

export default function DegreeCompare() {
  const [refId, setRefId] = useState(refs[0].id);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function analyze(subjects, name) {
    const names = subjects.map((s) => (typeof s === "string" ? s : s.name));
    const rows = names.map(matchSubject);
    const full = rows.filter((r) => r.status === "Full").length;
    const partial = rows.filter((r) => r.status === "Partial").length;
    const gaps = rows.filter((r) => r.status === "Gap");
    const coverage = Math.round(((full + partial * 0.5) / rows.length) * 100);
    // roles this curriculum (covered courses' skills) prepares for
    const pool = new Set(rows.filter((r) => r.course).flatMap((r) => r.course.skills.map((s) => s.toLowerCase())));
    const roles = specs.map((sp) => ({ sp, hits: sp.skills.filter((s) => pool.has(s.toLowerCase())).length }))
      .filter((r) => r.hits >= 3).sort((a, b) => b.hits - a.hits).slice(0, 4);
    setResult({ name, rows, full, partial, gaps, coverage, roles });
  }
  function runRef() { const r = refs.find((x) => x.id === refId); analyze(r.subjects, r.name); }
  function runPaste() {
    const subs = text.split(/\n+/).map((l) => l.replace(/^[\d.\-*•)\s]+/, "").trim()).filter((l) => l.length > 2);
    if (subs.length) analyze(subs, "Your uploaded curriculum");
  }
  function lead() {
    if (!email.includes("@")) return;
    import("../../../lib/supabase").then(({ sbInsert }) =>
      sbInsert("pf_analyses", { kind: "lead", input_title: `Univ comparison: ${result?.name}`, input_text: email, result: { coverage: result?.coverage } }).then(() => setSent(true)).catch(() => setSent(true))
    );
  }

  const STATUS = { Full: "chip-green", Partial: "chip-blue", Gap: "chip-peel" };

  return (
    <div>
      <Link href="/degrees" className="text-sm font-bold text-brand-600">← Degree programs</Link>
      <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-100">For universities</p>
        <h1 className="mt-1 text-3xl font-black text-white">Compare your degree with the AI-era benchmark</h1>
        <p className="mt-2 max-w-2xl text-brand-50">Pick a reference program or paste your own curriculum. See coverage, the exact gaps, the Board Infinity content that bridges them, and the bridged blended journey + roles your students would be ready for.</p>
      </div>

      <div className="card mt-6 p-5">
        <p className="text-sm font-bold text-ink-800">1 · Pick a reference program</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {refs.map((r) => (
            <button key={r.id} onClick={() => { setRefId(r.id); analyze(r.subjects, r.name); }}
              className={`chip border transition ${refId === r.id && result?.name === r.name ? "bg-brand-500 text-white" : "chip-gray hover:bg-brand-50"}`}>{r.name}</button>
          ))}
        </div>
        <p className="mt-1 text-xs text-ink-400">
          {refs.find((r) => r.id === refId)?.ref}
          {refs.find((r) => r.id === refId)?.source && (
            <> · <a href={refs.find((r) => r.id === refId).source} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">official source ↗</a></>
          )}
        </p>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-bold text-ink-800">…or paste your own curriculum (one subject per line)</summary>
          <textarea className="input mt-2 h-36 font-mono text-xs" placeholder={"Database Management Systems\nMachine Learning\nOperating Systems\n…"} value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={runPaste} className="btn-primary mt-2 text-sm">Analyze my curriculum →</button>
        </details>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          {/* coverage summary */}
          <div className="card border-brand-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-ink-900">{result.name}</h2>
              <span className="text-3xl font-black text-brand-600">{result.coverage}%<span className="ml-1 text-sm font-bold text-ink-500">deliverable by BI</span></span>
            </div>
            <div className="mt-2 flex gap-3 text-sm">
              <span className="text-teal-600 font-bold">{result.full} fully covered</span>
              <span className="text-brand-600 font-bold">{result.partial} partial</span>
              <span className="text-peel-700 font-bold">{result.gaps.length} gaps</span>
            </div>
          </div>

          {/* subject-by-subject */}
          <div className="card p-5">
            <h3 className="font-black text-ink-900">Subject-by-subject mapping</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {result.rows.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
                  <span className={STATUS[r.status]}>{r.status === "Gap" ? (FACULTY_KEEP.test(r.subject) ? "Faculty" : "Build") : r.status}</span>
                  <span className="flex-1 text-sm text-ink-800">{r.subject}</span>
                  {r.course && <Link href={`/course/${r.course.slug}`} className="text-xs font-bold text-brand-600 hover:underline">→ {clean(r.course.title).slice(0, 32)}</Link>}
                </div>
              ))}
            </div>
          </div>

          {/* gaps + bridge */}
          {result.gaps.length > 0 && (
            <div className="card border-peel-200 bg-peel-50 p-5">
              <h3 className="font-black text-ink-900">⚠ Gaps & how we bridge them</h3>
              <p className="mt-1 text-sm text-ink-600">Subjects with no current BI match. Theory/math/law stays with faculty (by design); the rest are flagged for content production or a blended overlay.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {result.gaps.map((g, i) => (
                  <div key={i} className="rounded-lg bg-white px-3 py-2 text-sm">
                    <span className="text-ink-800">{g.subject}</span>
                    <span className={`ml-2 text-xs font-bold ${FACULTY_KEEP.test(g.subject) ? "text-ink-500" : "text-peel-700"}`}>
                      {FACULTY_KEEP.test(g.subject) ? "→ faculty-retained" : "→ BI to produce / overlay"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* roles unlocked */}
          {result.roles.length > 0 && (
            <div className="card p-5">
              <h3 className="font-black text-ink-900">🎯 Roles your graduates would be ready for</h3>
              <p className="mt-1 text-sm text-ink-500">With the BI overlay + capstone, this curriculum prepares students for:</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {result.roles.map(({ sp, hits }) => (
                  <Link key={sp.slug} href={`/specializations/${sp.slug}`} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                    <p className="font-black text-ink-900">{sp.role}</p>
                    {sp.salary && <p className="mt-0.5 text-sm font-bold text-teal-600">{sp.salary.india}</p>}
                    <p className="mt-1 text-[11px] text-ink-500">{hits} role skills covered</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* bridged journey */}
          <div className="card border-brand-200 bg-brand-50 p-5">
            <h3 className="font-black text-ink-900">The bridged journey we propose</h3>
            <p className="mt-1 text-sm text-ink-600">Your covered subjects, delivered through the 5-part blended model — async credits (NEP 40%) + live tutorials + masterclasses + semester hackathon + final-year capstone aligned to the roles above. Faculty keeps the academic core.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="chip-blue">▶ Async modules</span><span className="chip-peel">🎙 Live tutorials</span><span className="chip-rose">★ Masterclasses</span><span className="chip-gray">🏆 Hackathon</span><span className="chip-green">🎓 Capstone → role</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {sent ? <p className="font-bold text-teal-600">✓ We&apos;ll send the full proposal & mapping report.</p> : (
                <>
                  <input className="input max-w-xs" placeholder="work email (dean / registrar)" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <button onClick={lead} className="btn-primary text-sm">Get the full proposal →</button>
                  <button onClick={() => window.print()} className="btn-ghost text-sm">🖨 Print this analysis</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
