"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import skills from "../../data/skills.json";
import courses from "../../data/courses.json";
import degrees from "../../data/degrees.json";
import journeys from "../../data/journeys.json";
import modules from "../../data/modules.json";
import { analyzeCurriculum, extractSkills } from "../../lib/match";
import { selectModules } from "../../lib/engine";
import { ScoreRing } from "../../components/PlanCharts";
import { sbInsert } from "../../lib/supabase";
import ValueModel from "../../components/ValueModel";

const SAMPLE = `Semester 3
Programming Fundamentals with Python
Database Management Systems
Web Technologies (HTML, CSS, JavaScript)
Operating Systems
Semester 4
Object Oriented Programming using Java
Machine Learning
Computer Networks
Software Engineering
Semester 5
Cloud Computing
Mobile Application Development
Statistics and Probability
Major Project`;

const STATUS_CLS = { Full: "bg-emerald-900/60 text-emerald-300", Partial: "bg-sky-900/60 text-sky-300", Gap: "bg-amber-900/60 text-amber-300" };
const courseByTitle = Object.fromEntries(courses.map((c) => [c.title, c]));

function groupBySemester(text) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const groups = [];
  let cur = { name: "Curriculum", lines: [] };
  for (const l of lines) {
    if (/^sem(ester)?\s*[\divxIVX]+/i.test(l) || /^year\s*\d/i.test(l)) {
      if (cur.lines.length) groups.push(cur);
      cur = { name: l, lines: [] };
    } else cur.lines.push(l);
  }
  if (cur.lines.length) groups.push(cur);
  return groups;
}

export default function University() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);     // {groups:[{name, analysis}], coverage, full, partial, gaps, degreeName}
  const [overlay, setOverlay] = useState({});
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function runText(t, degreeName) {
    const groups = groupBySemester(t).map((g) => ({ name: g.name, analysis: analyzeCurriculum(g.lines.join("\n"), skills, courses) }));
    const all = groups.flatMap((g) => g.analysis.subjects);
    const full = all.filter((s) => s.status === "Full").length;
    const partial = all.filter((s) => s.status === "Partial").length;
    const coverage = all.length ? Math.round(((full + partial * 0.5) / all.length) * 100) : 0;
    setResult({ groups, coverage, full, partial, gaps: all.length - full - partial, total: all.length, degreeName: degreeName || "Your curriculum" });
    setOverlay({});
    sbInsert("pf_analyses", { kind: "curriculum", input_title: degreeName || t.split("\n")[0].slice(0, 80), input_text: t.slice(0, 5000), result: { coverage, full, partial } }).catch(() => {});
  }

  function runBenchmark(d) {
    // benchmark degrees: convert pre-analyzed subjects directly
    const subjects = d.subjects.map((s) => ({
      subject: s.subject, status: s.coverage, skills: [],
      mapped: s.mapped && s.mapped !== "-" ? s.mapped.split(";")[0].trim() : null,
      mappedSlug: (courseByTitle[(s.mapped || "").split(";")[0].trim()] || {}).slug || null,
    }));
    const full = subjects.filter((s) => s.status === "Full").length;
    const partial = subjects.filter((s) => s.status === "Partial").length;
    setResult({
      groups: [{ name: "Core subjects (typical syllabus)", analysis: { subjects } }],
      coverage: d.coverage_pct, full, partial, gaps: subjects.length - full - partial, total: subjects.length, degreeName: d.name,
    });
    setOverlay({});
  }

  // employability mapping: which role journeys do the mapped courses feed?
  const roleMap = useMemo(() => {
    if (!result) return [];
    const mappedTitles = result.groups.flatMap((g) => g.analysis.subjects.map((s) => s.mapped)).filter(Boolean);
    const skillPool = [...new Set(mappedTitles.flatMap((t) => (courseByTitle[t]?.skills || [])))];
    if (!skillPool.length) return [];
    const set = new Set(skillPool.map((s) => s.toLowerCase()));
    return journeys.map((j) => {
      const hits = j.skills.filter((s) => set.has(s.toLowerCase())).length;
      return { slug: j.slug, role: j.role, pct: Math.min(95, Math.round((hits / Math.min(j.skills.length, 25)) * 100)) };
    }).filter((x) => x.pct >= 25).sort((a, b) => b.pct - a.pct).slice(0, 5);
  }, [result]);

  function buildOverlay(key, subject) {
    const subjectSkills = extractSkills(subject.subject + " " + (subject.skills || []).join(" "), skills);
    const mods = selectModules(subjectSkills.length ? subjectSkills : [subject.subject], modules, { maxHours: 12 }).slice(0, 4);
    setOverlay((o) => ({ ...o, [key]: mods }));
  }

  function lead() {
    if (!email.includes("@")) return;
    sbInsert("pf_analyses", { kind: "lead", input_title: `University proposal: ${result?.degreeName}`, input_text: email, result: { coverage: result?.coverage } }).then(() => setSent(true)).catch(() => setSent(true));
  }

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">For universities & institutions</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">
          See how much of your degree we can deliver — <span className="bg-gradient-to-r from-brand-400 to-accent-500 bg-clip-text text-transparent">in 60 seconds</span>
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Click a degree below for an instant analysis, or paste your own curriculum. Coverage becomes a blended overlay —
          async credits under NEP 2020&apos;s 40% allowance + live tutorials + masterclasses + semester hackathons + a final-year capstone — while your faculty keeps the academic core.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["68%", "avg. coverage across 9 degrees"], ["3,778h", "deliverable recorded content"], ["26", "AI-era role journeys mapped"], ["80+", "institutions already partnered"]].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-slate-950/50 p-3 text-center">
              <div className="text-2xl font-extrabold text-white">{v}</div>
              <div className="text-[11px] text-slate-400">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <ValueModel audience="university" />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-white">⚡ One-click analysis — pick your degree</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {degrees.map((d) => (
            <button key={d.name} onClick={() => { runBenchmark(d); }} className={`chip border px-3 py-1.5 transition ${result?.degreeName === d.name ? "border-brand-500 bg-brand-900/60 text-brand-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-brand-500"}`}>
              {d.name.replace(/\s*\(.*\)/, "")} · {d.coverage_pct}%
            </button>
          ))}
        </div>
        <details className="card mt-4 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-200">…or paste your exact curriculum (semester headers supported)</summary>
          <textarea className="input mt-3 h-44 font-mono text-xs" placeholder={"Semester 3\nDatabase Management Systems\nMachine Learning\n…"} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-3 flex gap-3">
            <button onClick={() => text.trim().length > 10 && runText(text)} className="btn-primary text-sm">Analyze my curriculum</button>
            <button onClick={() => setText(SAMPLE)} className="btn-ghost text-sm">Load sample (BCA sem 3-5)</button>
          </div>
        </details>
      </section>

      {result && (
        <div className="mt-10 space-y-6">
          <div className="card border-brand-700 bg-gradient-to-br from-brand-950 to-slate-900 p-5">
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing value={result.coverage} label="deliverable today" size={130} />
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-white">{result.degreeName}</h2>
                <p className="mt-1 text-sm text-slate-300">
                  <span className="text-emerald-300">{result.full} subjects fully deliverable</span> · <span className="text-sky-300">{result.partial} partially</span> · <span className="text-amber-300">{result.gaps} stay with faculty</span> (of {result.total})
                </p>
                <p className="mt-2 text-xs text-slate-400">Fully/partially covered subjects ship as async modules + weekly live tutorials, credit-eligible under UGC&apos;s 40% online allowance. Gaps (theory, math, law, labs) deliberately remain with your faculty.</p>
              </div>
            </div>
          </div>

          {roleMap.length > 0 && (
            <div className="card p-5">
              <h3 className="text-lg font-bold text-white">🎯 Employability mapping — what your graduates become</h3>
              <p className="mt-1 text-xs text-slate-400">With the overlay + final-year capstone, this degree feeds directly into these AI-era roles:</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {roleMap.map((r) => (
                  <Link key={r.slug} href={`/journeys/${r.slug}?view=university`} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 transition hover:border-brand-500">
                    <p className="text-sm font-semibold text-white">{r.role}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-slate-800">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${r.pct}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{r.pct}% skill foundation from this degree</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {result.groups.map((g, gi) => (
            <div key={gi} className="card p-5">
              <h3 className="font-bold text-white">{g.name}</h3>
              <div className="mt-3 space-y-2">
                {g.analysis.subjects.map((s, i) => {
                  const key = `${gi}-${i}`;
                  return (
                    <div key={key} className="rounded-lg bg-slate-950/60 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`chip ${STATUS_CLS[s.status]}`}>{s.status}</span>
                        <span className="flex-1 text-sm text-slate-200">{s.subject}</span>
                        {s.mapped && (s.mappedSlug
                          ? <Link href={`/course/${s.mappedSlug}`} className="text-xs text-brand-400 hover:underline">{s.mapped}</Link>
                          : <span className="text-xs text-slate-500">{s.mapped}</span>)}
                        {s.status !== "Gap"
                          ? <button onClick={() => buildOverlay(key, s)} className="chip border border-slate-600 text-slate-300 hover:border-brand-500">{overlay[key] ? "↻" : "Module-level embed plan"}</button>
                          : <span className="text-[11px] text-slate-600">faculty-retained</span>}
                      </div>
                      {overlay[key] && (
                        <ul className="mt-3 space-y-1.5 border-t border-slate-800 pt-3">
                          {overlay[key].length === 0 && <li className="text-xs text-amber-300">No matching modules — flagged for content production.</li>}
                          {overlay[key].map((m) => (
                            <li key={m.id} className="text-sm text-slate-300">▶ Module {m.num}: {m.title} <span className="text-xs text-slate-500">({m.hours}h · {m.videos} videos · from “{m.course}”)</span></li>
                          ))}
                          {overlay[key].length > 0 && <li className="text-xs text-slate-500">+ weekly live tutorial · unit masterclass · semester hackathon · assessed deliverable</li>}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="card border-emerald-900/60 p-6">
            <h3 className="text-lg font-bold text-white">📋 Your partnership blueprint</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-lg bg-slate-950/60 p-4">
                <p className="font-semibold text-brand-300">Board Infinity delivers</p>
                <p className="mt-1 text-xs text-slate-400">{result.full + result.partial} industry-aligned subjects as async modules + live tutorials, semester hackathons, final-year capstone tied to a role journey, employability dashboard.</p>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-4">
                <p className="font-semibold text-emerald-300">Your faculty keeps</p>
                <p className="mt-1 text-xs text-slate-400">{result.gaps} core academic subjects (theory, mathematics, law, labs) — plus full academic governance and assessment authority.</p>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-4">
                <p className="font-semibold text-amber-300">Regulatory frame</p>
                <p className="mt-1 text-xs text-slate-400">Within UGC&apos;s 40% online-credit allowance (NEP 2020); credits portable via NCrF / Academic Bank of Credits.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {sent ? <p className="text-emerald-400">✓ We&apos;ll send the full proposal for {result.degreeName}.</p> : (
                <>
                  <input className="input max-w-xs" placeholder="work email (registrar / dean's office)" value={email} onChange={(e) => setEmail(e.target.value)} />
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
