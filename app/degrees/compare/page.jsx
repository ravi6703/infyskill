"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import refs from "../../../data/reference_curricula.json";
import courses from "../../../data/courses.json";
import specs from "../../../data/journeys.json";
import skillMeta from "../../../data/skills.json";

const clean = (t) => t.replace(/^[:\s]+/, "");
const CLUSTER_OF = Object.fromEntries(skillMeta.map((s) => [s.name.toLowerCase(), s.cluster]));

// generic academic/marketing connector words that must NOT drive a match
const STOP = new Set("management systems system design introduction intro advanced advance advances fundamentals foundation foundations applied techniques technique application applications principles principle concepts concept methods method modern professional practical essentials mastering master overview using core tools tool models model basics basic prep preparation complete decoding roadmap insights with for and the from your into key".split(" "));
// unambiguous single-word tech subjects we can safely recover (token -> preferred title substrings in priority order)
const RECOVER = {
  programming: ["python", "java programming", "programming"],
  database: ["managing databases", "sql", "database"],
  dbms: ["managing databases", "sql", "database"],
  algorithms: ["data structures", "algorithm"],
  python: ["python"], java: ["java"], cryptography: ["cryptography"], networking: ["network"],
};

function mean(s) {
  const seen = new Set(), out = [];
  for (const w of s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)) {
    if (w.length > 3 && !STOP.has(w) && !seen.has(w)) { seen.add(w); out.push(w); }
  }
  return out;
}
const courseIdx = courses.map((c) => {
  const tt = new Set(mean(c.title));
  const skills = (c.skills || []).map((s) => new Set(mean(s)));
  return { c, tt, skills };
});

// Conservative matcher: only attaches a course on a genuine multi-token skill/title match.
// Weak/single-generic-token subjects fall to Gap (honest) rather than a misleading course.
function matchSubject(subject) {
  const Sarr = mean(subject), S = new Set(Sarr);
  if (S.size === 0) return { subject, status: "Gap", course: null };
  let best = null, bp = 0, bs = 0, bestLen = 999;
  for (const { c, tt, skills } of courseIdx) {
    let skillBest = 0, ms = 0;
    for (const k of skills) {
      let inter = 0; for (const t of S) if (k.has(t)) inter++;
      if (inter >= 2) { const uni = new Set([...S, ...k]).size; skillBest = Math.max(skillBest, Math.max(inter / S.size, inter / uni)); ms++; }
    }
    let ti = 0; for (const t of S) if (tt.has(t)) ti++;
    const tcont = ti >= 2 ? ti / S.size : 0;
    const primary = Math.max(skillBest, 0.7 * tcont), secondary = ti + 0.01 * ms;
    if (primary > bp || (primary === bp && (secondary > bs || (secondary === bs && c.title.length < bestLen)))) {
      bp = primary; bs = secondary; best = c; bestLen = c.title.length;
    }
  }
  // single-token tech recovery -> Partial
  if (bp < 0.4 && S.size === 1 && RECOVER[Sarr[0]]) {
    for (const sub of RECOVER[Sarr[0]]) {
      const hit = courses.find((c) => c.title.toLowerCase().includes(sub));
      if (hit) return { subject, status: "Partial", course: hit };
    }
  }
  const status = bp >= 0.6 ? "Full" : bp >= 0.4 ? "Partial" : "Gap";
  return { subject, status, course: status === "Gap" ? null : best };
}

const FACULTY_KEEP = /operating system|computer network|discrete|theory of computation|linear algebra|micro ?econom|macro ?econom|business law|organi[sz]ational behaviour|probability|calculus|differential|metric space|matrix|numerical|signal|physics|ethics|entrepreneur|accounting|research method|thesis|economics|mathematics|statistics|english|language l/i;

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
}
async function extractPdf(file) {
  const pdfjs = await import(/* webpackIgnore: true */ "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs";
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const c = await page.getTextContent();
    const lines = {};
    c.items.forEach((it) => { const y = Math.round(it.transform[5]); lines[y] = (lines[y] || "") + it.str + " "; });
    out += Object.keys(lines).sort((a, b) => b - a).map((k) => lines[k].trim()).join("\n") + "\n";
  }
  return out;
}
async function extractDocx(file) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
  const buf = await file.arrayBuffer();
  const r = await window.mammoth.extractRawText({ arrayBuffer: buf });
  return r.value;
}

export default function DegreeCompare() {
  const [refId, setRefId] = useState(refs[0].id);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [parsing, setParsing] = useState("");
  const [fileName, setFileName] = useState("");

  function analyze(subjects, name) {
    const names = subjects.map((s) => (typeof s === "string" ? s : s.name));
    const rows = names.map(matchSubject);
    const full = rows.filter((r) => r.status === "Full").length;
    const partial = rows.filter((r) => r.status === "Partial").length;
    const gaps = rows.filter((r) => r.status === "Gap");
    const facultyGaps = gaps.filter((g) => FACULTY_KEEP.test(g.subject)).length;
    const buildGaps = gaps.length - facultyGaps;
    const coverage = Math.round(((full + partial * 0.5) / rows.length) * 100);
    // roles this curriculum (covered courses' skills) prepares for
    const pool = new Set(rows.filter((r) => r.course).flatMap((r) => r.course.skills.map((s) => s.toLowerCase())));
    const roles = specs.map((sp) => ({ sp, hits: sp.skills.filter((s) => pool.has(s.toLowerCase())).length }))
      .filter((r) => r.hits >= 3).sort((a, b) => b.hits - a.hits).slice(0, 4);
    setResult({ name, rows, full, partial, gaps, facultyGaps, buildGaps, coverage, roles });
  }
  function runRef() { const r = refs.find((x) => x.id === refId); analyze(r.subjects, r.name); }
  function cleanLines(raw) {
    return raw.split(/\n+/)
      .map((l) => l.replace(/^[\d.\-*•)\s|]+/, "")        // leading bullets/numbers
                   .replace(/\b[A-Z]{2,4}\s?\d{3,4}[A-Z]?\b/g, "") // course codes (CS101, BSCS2001)
                   .replace(/\b\d+\s*(credits?|cr|hours?|hrs|L-T-P)\b/gi, "") // credit/hour noise
                   .replace(/\s{2,}/g, " ").trim())
      .filter((l) => l.length > 4 && /[a-z]/i.test(l) && !/^(semester|year|term|total|sl\.?\s?no|course code|sub code|table of)/i.test(l));
  }
  function runPaste() {
    const subs = cleanLines(text);
    if (subs.length) analyze(subs, fileName || "Your uploaded curriculum");
  }
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsing("Reading " + file.name + " …");
    try {
      let raw = "";
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".pdf")) raw = await extractPdf(file);
      else if (lower.endsWith(".docx")) raw = await extractDocx(file);
      else raw = await file.text(); // txt / csv / md
      setText(raw);
      const subs = cleanLines(raw);
      if (subs.length) { analyze(subs, file.name); setParsing(`Parsed ${subs.length} subject lines from ${file.name}.`); }
      else setParsing("Couldn't detect subject lines — paste the curriculum text below instead.");
    } catch (err) {
      setParsing("Couldn't read that file. Try a .txt export or paste the text below.");
    }
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
          <summary className="cursor-pointer text-sm font-bold text-ink-800">…or upload / paste your own curriculum</summary>

          {/* file upload */}
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-6 text-center transition hover:border-brand-400 hover:bg-brand-50">
            <span className="text-2xl">📄</span>
            <span className="text-sm font-bold text-brand-700">Upload your syllabus</span>
            <span className="text-[11px] text-ink-500">PDF, Word (.docx), .txt or .csv — we parse & tag it automatically</span>
            <input type="file" accept=".pdf,.docx,.txt,.csv,.md" className="hidden" onChange={handleFile} />
          </label>
          {parsing && <p className="mt-2 text-xs font-bold text-brand-600">{parsing}</p>}

          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">or paste subjects (one per line)</p>
          <textarea className="input mt-1 h-32 font-mono text-xs" placeholder={"Database Management Systems\nMachine Learning\nOperating Systems\n…"} value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={runPaste} className="btn-primary mt-2 text-sm">Analyze my curriculum →</button>
        </details>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          {/* coverage summary */}
          <div className="card border-brand-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-ink-900">{result.name}</h2>
              <span className="text-3xl font-black text-brand-600">{result.coverage}%<span className="ml-1 text-sm font-bold text-ink-500">AI-era layer by BI</span></span>
            </div>
            <p className="mt-1 text-sm text-ink-600">Board Infinity delivers the <b className="text-ink-800">applied AI, data &amp; industry layer</b>. The academic core (math, theory, economics, law) stays with faculty by design — this isn&apos;t a gap to fill, it&apos;s the right division of labour.</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="text-teal-600 font-bold">{result.full} BI-delivered</span>
              <span className="text-brand-600 font-bold">{result.partial} partial / overlay</span>
              <span className="text-ink-500 font-bold">{result.facultyGaps} faculty core</span>
              <span className="text-peel-700 font-bold">{result.buildGaps} to build</span>
            </div>
          </div>

          {/* subject-by-subject */}
          <div className="card p-5">
            <h3 className="font-black text-ink-900">Subject-by-subject mapping</h3>
            <p className="mt-1 text-xs text-ink-400">Matches are generated automatically by skill tagging and are <b className="text-ink-500">indicative, pending academic review</b> — not a final accreditation mapping.</p>
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
