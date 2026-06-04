"use client";
import { useState } from "react";
import Link from "next/link";
import skills from "../../data/skills.json";
import courses from "../../data/courses.json";
import degrees from "../../data/degrees.json";
import modules from "../../data/modules.json";
import { analyzeCurriculum, extractSkills } from "../../lib/match";
import { selectModules } from "../../lib/engine";
import { sbInsert } from "../../lib/supabase";

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

export default function University() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [overlay, setOverlay] = useState({});

  function run() {
    if (text.trim().length < 10) return;
    const r = analyzeCurriculum(text, skills, courses);
    setResult(r); setOverlay({});
    sbInsert("pf_analyses", { kind: "curriculum", input_title: text.split("\n")[0].slice(0, 80), input_text: text.slice(0, 5000), result: { coverage: r.coverage, full: r.full, partial: r.partial, gaps: r.gaps } }).catch(() => {});
  }

  function buildOverlay(i, subject) {
    const subjectSkills = extractSkills(subject.subject + " " + subject.skills.join(" "), skills);
    const mods = selectModules(subjectSkills.length ? subjectSkills : [subject.subject], modules, { maxHours: 12 }).slice(0, 4);
    setOverlay((o) => ({ ...o, [i]: mods }));
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">University Curriculum Mapping</h1>
      <p className="mt-2 max-w-3xl text-slate-400">
        Paste a degree or semester curriculum (one subject per line; semester headers allowed). Get subject-by-subject coverage,
        then expand any subject into a <span className="text-brand-300">module-level embed plan</span> — the overlay universities deliver
        under NEP 2020&apos;s 40% online-credit allowance, blended with live tutorials, masterclasses, semester hackathons and a final-year capstone.
      </p>

      <textarea className="input mt-6 h-52 font-mono text-xs" placeholder={"Semester 3\nDatabase Management Systems\nMachine Learning\n…"} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-3 flex gap-3">
        <button onClick={run} className="btn-primary">Map Curriculum</button>
        <button onClick={() => setText(SAMPLE)} className="btn-ghost">Load sample (BCA semesters 3-5)</button>
      </div>

      {result && (
        <div className="mt-10 space-y-8">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="card p-5 text-center"><div className="text-4xl font-extrabold text-white">{result.coverage}%</div><div className="mt-1 text-sm text-slate-400">overall coverage</div></div>
            <div className="card p-5 text-center"><div className="text-4xl font-extrabold text-emerald-400">{result.full}</div><div className="mt-1 text-sm text-slate-400">fully covered</div></div>
            <div className="card p-5 text-center"><div className="text-4xl font-extrabold text-sky-400">{result.partial}</div><div className="mt-1 text-sm text-slate-400">partially covered</div></div>
            <div className="card p-5 text-center"><div className="text-4xl font-extrabold text-amber-400">{result.gaps}</div><div className="mt-1 text-sm text-slate-400">gaps</div></div>
          </div>
          <div className="space-y-2">
            {result.subjects.map((s, i) => (
              <div key={i} className="card px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`chip ${STATUS_CLS[s.status]}`}>{s.status}</span>
                  <span className="flex-1 text-sm text-slate-200">{s.subject}</span>
                  {s.mapped && (s.mappedSlug
                    ? <Link href={`/course/${s.mappedSlug}`} className="text-xs text-brand-400 hover:underline">{s.mapped}</Link>
                    : <span className="text-xs text-slate-500">{s.mapped}</span>)}
                  <button onClick={() => buildOverlay(i, s)} className="chip border border-slate-600 text-slate-300 hover:border-brand-500">
                    {overlay[i] ? "↻" : "Module-level embed plan"}
                  </button>
                </div>
                {overlay[i] && (
                  <ul className="mt-3 space-y-1.5 border-t border-slate-800 pt-3">
                    {overlay[i].length === 0 && <li className="text-xs text-amber-300">No matching modules — flagged for content production or university-retained delivery.</li>}
                    {overlay[i].map((m) => (
                      <li key={m.id} className="rounded-lg bg-slate-950/60 px-3 py-2 text-sm">
                        <span className="text-slate-200">Module {m.num}: {m.title}</span>
                        <span className="ml-2 text-xs text-slate-500">{m.hours}h · {m.videos} videos · from “{m.course}”</span>
                      </li>
                    ))}
                    {overlay[i].length > 0 && (
                      <li className="text-xs text-slate-500">+ weekly live tutorial · masterclass each unit · semester-end hackathon · assessed deliverable</li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="mt-14">
        <h2 className="text-xl font-bold text-white">Pre-analyzed degree benchmarks</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {degrees.map((d) => (
            <div key={d.name} className="card p-4">
              <h3 className="text-sm font-bold text-white">{d.name}</h3>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${d.coverage_pct}%` }} />
                </div>
                <span className="text-sm font-bold text-white">{d.coverage_pct}%</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{d.mapped} of {d.total} subjects mapped</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
