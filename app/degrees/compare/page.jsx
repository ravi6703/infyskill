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

// The AI-era skill benchmark: the skills most in demand across our tracked roles.
const AI_DEMAND = (() => {
  const c = {};
  specs.forEach((sp) => (sp.skills || []).forEach((s) => { c[s] = (c[s] || 0) + 1; }));
  return Object.entries(c).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 28).map(([skill, roles]) => ({ skill, roles }));
})();
// first BI course that teaches a given skill (for gap suggestions)
function courseForSkill(s) {
  const sl = s.toLowerCase();
  return courses.find((c) => (c.skills || []).some((x) => x.toLowerCase() === sl));
}

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

const STEPS = [
  "Extracting subjects & topics from your document",
  "Tagging each subject against the InfyAI skill taxonomy",
  "Lens A · matching subject-by-subject vs the ideal AI-era program",
  "Lens B · scoring job-orientation vs employer-demanded skills",
  "Compiling the gaps + the Board Infinity content that closes them",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function DegreeCompare() {
  const [refId, setRefId] = useState(refs[0].id);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [parsing, setParsing] = useState("");
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);

  // staged, visible analysis so the user sees real work happening (the matching itself is instant & local)
  async function runAnalysis(subjects, name) {
    setResult(null); setAnalyzing(true); setStage(0);
    for (let i = 0; i < STEPS.length; i++) { setStage(i); await sleep(560); }
    analyze(subjects, name);
    setAnalyzing(false);
  }

  function analyze(subjects, name) {
    const names = subjects.map((s) => (typeof s === "string" ? s : s.name));
    const rows = names.map(matchSubject);
    const full = rows.filter((r) => r.status === "Full").length;
    const partial = rows.filter((r) => r.status === "Partial").length;

    // skills the curriculum already covers = matched BI courses' skills + skill names appearing in subject titles
    const lcNames = names.map((n) => n.toLowerCase());
    const coveredSkills = new Set(rows.filter((r) => r.course).flatMap((r) => r.course.skills.map((s) => s.toLowerCase())));
    const present = AI_DEMAND.filter(({ skill }) => {
      const sl = skill.toLowerCase();
      return coveredSkills.has(sl) || lcNames.some((n) => n.includes(sl));
    }).map((d) => d.skill);
    const presentSet = new Set(present);
    // GAPS = the in-demand AI-era skills this curriculum is MISSING → with the BI content that adds each
    const aiGaps = AI_DEMAND.filter((d) => !presentSet.has(d.skill)).slice(0, 10).map((d) => ({ ...d, course: courseForSkill(d.skill) }));
    const aiReady = Math.round((present.length / AI_DEMAND.length) * 100);

    // roles unlocked once the gaps are filled (their covered skills + BI overlay)
    const pool = new Set([...coveredSkills, ...aiGaps.filter((g) => g.course).flatMap((g) => g.course.skills.map((s) => s.toLowerCase()))]);
    const roles = specs.map((sp) => ({ sp, hits: sp.skills.filter((s) => pool.has(s.toLowerCase())).length }))
      .filter((r) => r.hits >= 3).sort((a, b) => b.hits - a.hits).slice(0, 4);

    // full coverage grid for the visual matrix
    const aiGrid = AI_DEMAND.map((d) => ({ skill: d.skill, roles: d.roles, present: presentSet.has(d.skill), course: presentSet.has(d.skill) ? null : courseForSkill(d.skill) }));

    // ---- LENS A: syllabus gap vs the best-fit ideal program ----
    const upTok = names.map((n) => new Set(mean(n)));
    const coveredByUpload = (ideal) => {
      const it = mean(ideal); if (!it.length) return false;
      return upTok.some((ut) => { let inter = 0; for (const t of it) if (ut.has(t)) inter++; return inter >= 2 || (inter >= 1 && inter / it.length >= 0.5); });
    };
    const refScored = refs.map((r) => {
      const subs = r.subjects.map((s) => (typeof s === "string" ? s : s.name));
      return { ref: r, subs, matched: subs.filter(coveredByUpload).length };
    }).sort((a, b) => b.matched - a.matched);
    const best = refScored[0];
    const syllabusGaps = best.subs.filter((s) => !coveredByUpload(s));
    const syllabusTotal = best.subs.length;
    const syllabusPct = Math.round(((syllabusTotal - syllabusGaps.length) / syllabusTotal) * 100);

    setResult({ name, rows, full, partial, present, aiGaps, aiGrid, aiReady, aiTotal: AI_DEMAND.length, roles,
      idealName: best.ref.name, idealRef: best.ref.ref, syllabusGaps, syllabusTotal, syllabusPct });
  }
  function loadSample() {
    const r = refs[0];
    const subs = r.subjects.map((s) => (typeof s === "string" ? s : s.name));
    setText(subs.join("\n"));
    runAnalysis(r.subjects, "Sample curriculum");
  }
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
    if (subs.length) runAnalysis(subs, fileName || "Your uploaded curriculum");
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
      if (subs.length) { setParsing(`Parsed ${subs.length} subject lines from ${file.name}.`); runAnalysis(subs, file.name); }
      else setParsing("Couldn't detect subject lines — paste the curriculum text below instead.");
    } catch (err) {
      setParsing("Couldn't read that file. Try a .txt export or paste the text below.");
    }
  }
  function lead() {
    if (!email.includes("@")) return;
    import("../../../lib/supabase").then(({ sbInsert }) =>
      sbInsert("pf_analyses", { kind: "lead", input_title: `Univ comparison: ${result?.name}`, input_text: email, result: { aiReady: result?.aiReady } }).then(() => setSent(true)).catch(() => setSent(true))
    );
  }

  const STATUS = { Full: "chip-green", Partial: "chip-blue", Gap: "chip-peel" };

  // circular readiness gauge
  function Gauge({ value }) {
    const r = 52, c = 2 * Math.PI * r, off = c * (1 - value / 100);
    const col = value >= 60 ? "#05C170" : value >= 35 ? "#FCA106" : "#D13845";
    return (
      <svg viewBox="0 0 130 130" className="h-32 w-32 shrink-0">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#E2E8F0" strokeWidth="11" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={col} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }} />
        <text x="65" y="60" textAnchor="middle" className="fill-ink-900" style={{ fontSize: 26, fontWeight: 900 }}>{value}%</text>
        <text x="65" y="80" textAnchor="middle" className="fill-ink-500" style={{ fontSize: 9, fontWeight: 700 }}>AI-ERA READY</text>
      </svg>
    );
  }

  return (
    <div>
      <Link href="/degrees" className="text-sm font-bold text-brand-600">← Degree programs</Link>
      <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-100">For universities</p>
        <h1 className="mt-1 text-3xl font-black text-white">How future-ready is your curriculum?</h1>
        <p className="mt-2 max-w-2xl text-brand-50">Upload your syllabus. We run a two-lens gap analysis — <b>syllabus</b> (vs an ideal AI-era program) and <b>job-orientation</b> (vs what employers hire for) — and show exactly what&apos;s missing plus the Board Infinity content + roles that close the gap.</p>
      </div>

      <div className="card mt-6 p-5">
        {/* file upload — primary input */}
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/60 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50">
          <span className="text-3xl">📄</span>
          <span className="text-base font-black text-brand-700">Upload your syllabus</span>
          <span className="text-xs text-ink-500">PDF, Word (.docx), .txt or .csv — we parse &amp; tag it automatically</span>
          <input type="file" accept=".pdf,.docx,.txt,.csv,.md" className="hidden" onChange={handleFile} />
        </label>
        {parsing && <p className="mt-2 text-center text-xs font-bold text-brand-600">{parsing}</p>}

        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-ink-500">…or paste subjects manually (one per line)</summary>
          <textarea className="input mt-2 h-28 font-mono text-xs" placeholder={"Database Management Systems\nMachine Learning\nOperating Systems\n…"} value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={runPaste} className="btn-primary mt-2 text-sm">Analyze my curriculum →</button>
        </details>
        <button onClick={loadSample} className="mt-3 text-xs font-bold text-brand-600 hover:underline">No syllabus handy? Load a sample →</button>
      </div>

      {analyzing && (
        <div className="card mt-8 border-brand-200 p-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
            <p className="font-black text-ink-900">Analysing your curriculum…</p>
          </div>
          <p className="mt-1 text-xs text-ink-500">Two-lens gap analysis — runs entirely in your browser. Your syllabus is never uploaded to a server.</p>
          <ul className="mt-4 space-y-2.5">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition ${i < stage ? "bg-teal-500 text-white" : i === stage ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-400"}`}>
                  {i < stage ? "✓" : i + 1}
                </span>
                <span className={i <= stage ? "font-bold text-ink-800" : "text-ink-400"}>{s}</span>
                {i === stage && <span className="ml-auto text-[11px] font-bold text-brand-500">working…</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
            <p className="text-sm font-black text-ink-900">Two-lens gap report for <span className="text-brand-600">{result.name}</span></p>
            <p className="mt-0.5 text-xs text-ink-500">We assess your curriculum two ways: <b className="text-ink-700">A — syllabus</b> (vs an ideal program) and <b className="text-ink-700">B — job-orientation</b> (vs what employers hire for) — then show how Board Infinity closes both.</p>
          </div>

          {/* ===== LENS A — Syllabus gap vs ideal program ===== */}
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Lens A · Syllabus gap</p>
                <h3 className="mt-1 font-black text-ink-900">Vs the ideal program — <span className="text-ink-600">{result.idealName}</span></h3>
              </div>
              <span className={`text-2xl font-black ${result.syllabusPct >= 70 ? "text-teal-600" : result.syllabusPct >= 45 ? "text-peel-600" : "text-rose-600"}`}>{result.syllabusPct}%<span className="ml-1 text-xs font-bold text-ink-500">syllabus match</span></span>
            </div>
            <p className="mt-1 text-xs text-ink-400">Your curriculum is matched subject-by-subject against a benchmark AI-era program ({result.idealRef}). Subjects below appear in the ideal program but not in yours.</p>
            {result.syllabusGaps.length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-peel-700">Subjects/topics your curriculum is missing</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.syllabusGaps.map((s, i) => <span key={i} className="chip-peel">{s}</span>)}
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-teal-600 font-bold">✓ Your curriculum covers the ideal program's subjects.</p>}
          </div>

          {/* ===== LENS B — Job-orientation (AI-era skills) ===== */}
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Lens B · Job-orientation gap</p>
          <div className="card border-brand-200 p-5">
            <div className="flex flex-wrap items-center gap-5">
              <Gauge value={result.aiReady} />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black text-ink-900">{result.name}</h2>
                <p className="mt-1 text-sm text-ink-600">Scored against the <b className="text-ink-800">{result.aiTotal} most in-demand AI-era skills</b> across our tracked roles. Your curriculum covers <b className="text-teal-600">{result.present.length}</b>; <b className="text-peel-700">{result.aiTotal - result.present.length}</b> are missing — and each maps to a Board Infinity course below.</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <span className="font-black text-teal-600">{result.present.length} covered</span>
                  <span className="font-black text-peel-700">{result.aiTotal - result.present.length} to add</span>
                  <span className="font-black text-brand-600">{result.roles.length} roles unlock</span>
                </div>
              </div>
            </div>
          </div>

          {/* INNOVATIVE: AI-era skill coverage matrix — gaps light up */}
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-black text-ink-900">AI-era skill coverage map</h3>
              <div className="flex gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-teal-500" /> covered</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-peel-400" /> gap → BI fills</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-ink-400">Every tile is an in-demand skill. Green = your curriculum already teaches it. Amber = a gap — hover/click for the Board Infinity course that adds it.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {result.aiGrid.map((g) => (
                g.present ? (
                  <div key={g.skill} className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700">
                    <span>✓</span><span className="truncate" title={g.skill}>{g.skill}</span>
                  </div>
                ) : g.course ? (
                  <Link key={g.skill} href={`/course/${g.course.slug}`} title={`Add via: ${clean(g.course.title)}`}
                    className="group flex flex-col justify-between rounded-lg border border-peel-300 bg-peel-50 px-3 py-2 text-xs transition hover:border-peel-400 hover:shadow-card">
                    <span className="font-bold text-peel-800">{g.skill}</span>
                    <span className="mt-0.5 truncate text-[10px] text-brand-600 group-hover:underline">✚ {clean(g.course.title).slice(0, 26)}</span>
                  </Link>
                ) : (
                  <div key={g.skill} className="rounded-lg border border-peel-200 bg-peel-50/60 px-3 py-2 text-xs font-bold text-peel-700">{g.skill}<span className="mt-0.5 block text-[10px] font-normal text-ink-400">BI to produce</span></div>
                )
              ))}
            </div>
          </div>

          {/* THE GAP — AI-era skills the curriculum is missing, each with the BI content that adds it */}
          {result.aiGaps.length > 0 && (
            <div className="card border-peel-200 bg-peel-50 p-5">
              <h3 className="font-black text-ink-900">⚠ AI-era skills your curriculum is missing</h3>
              <p className="mt-1 text-sm text-ink-600">These are in-demand, employer-relevant skills not yet covered — and the Board Infinity course that adds each. This is the bridge from your current program to AI-era readiness.</p>
              <div className="mt-3 space-y-2">
                {result.aiGaps.map((g, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-3 py-2.5">
                    <span className="font-bold text-ink-900">{g.skill}</span>
                    <span className="chip-peel text-[11px]">needed by {g.roles} role{g.roles > 1 ? "s" : ""}</span>
                    <span className="ml-auto flex items-center gap-2 text-xs">
                      {g.course
                        ? <Link href={`/course/${g.course.slug}`} className="font-bold text-teal-600 hover:underline">✚ Add via: {clean(g.course.title).slice(0, 34)}</Link>
                        : <span className="font-bold text-peel-700">BI to produce</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* what BI already maps to from their subjects (positive coverage) */}
          <details className="card p-5">
            <summary className="cursor-pointer font-black text-ink-900">Subject-by-subject mapping ({result.full + result.partial} of {result.rows.length} map to BI content)</summary>
            <p className="mt-1 text-xs text-ink-400">Indicative skill-tag matches, pending academic review. Theory/math/language subjects stay with faculty by design.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {result.rows.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
                  <span className={r.status === "Gap" ? "chip-gray" : STATUS[r.status]}>{r.status === "Gap" ? (FACULTY_KEEP.test(r.subject) ? "Faculty" : "Core") : r.status}</span>
                  <span className="flex-1 text-sm text-ink-800">{r.subject}</span>
                  {r.course && <Link href={`/course/${r.course.slug}`} className="text-xs font-bold text-brand-600 hover:underline">→ {clean(r.course.title).slice(0, 32)}</Link>}
                </div>
              ))}
            </div>
          </details>

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
