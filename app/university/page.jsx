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
  // structured intake
  const [degName, setDegName] = useState("");
  const [scope, setScope] = useState("full");      // full | partial
  const [sems, setSems] = useState("");
  const [batch, setBatch] = useState("");
  const [fileName, setFileName] = useState("");

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (/\.(txt|csv|md)$/i.test(f.name)) {
      const r = new FileReader();
      r.onload = () => setText(String(r.result || "").slice(0, 20000));
      r.readAsText(f);
    } else {
      setText("");
    }
  }

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
    // benchmark degrees: convert pre-analyzed subjects, split into 3 journey stages
    const subjects = d.subjects.map((s) => ({
      subject: s.subject, status: s.coverage, skills: [],
      mapped: s.mapped && s.mapped !== "-" ? s.mapped.split(";")[0].trim() : null,
      mappedSlug: (courseByTitle[(s.mapped || "").split(";")[0].trim()] || {}).slug || null,
    }));
    const third = Math.ceil(subjects.length / 3);
    const groups = [
      { name: "Year 1–2 · Foundation semesters", analysis: { subjects: subjects.slice(0, third) } },
      { name: "Year 2–3 · Core semesters", analysis: { subjects: subjects.slice(third, third * 2) } },
      { name: "Final year · Specialization semesters", analysis: { subjects: subjects.slice(third * 2) } },
    ].filter((g) => g.analysis.subjects.length);
    const full = subjects.filter((s) => s.status === "Full").length;
    const partial = subjects.filter((s) => s.status === "Partial").length;
    setResult({ groups, coverage: d.coverage_pct, full, partial, gaps: subjects.length - full - partial, total: subjects.length, degreeName: d.name });
    setOverlay({});
  }

  // cumulative role readiness after each stage (the job-role milestones)
  function milestoneAfter(gi) {
    if (!result) return null;
    const mapped = result.groups.slice(0, gi + 1).flatMap((g) => g.analysis.subjects.map((s) => s.mapped)).filter(Boolean);
    const pool = new Set(mapped.flatMap((t) => (courseByTitle[t]?.skills || [])).map((s) => s.toLowerCase()));
    if (!pool.size) return null;
    let best = null;
    for (const j of journeys) {
      const hits = j.skills.filter((s) => pool.has(s.toLowerCase())).length;
      const pct = Math.min(95, Math.round((hits / Math.min(j.skills.length, 25)) * 100));
      if (!best || pct > best.pct) best = { slug: j.slug, role: j.role, pct, salary: j.salary };
    }
    return best && best.pct >= 20 ? best : null;
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
          Turn your degree into a <span className="bg-gradient-to-r from-brand-400 to-accent-500 bg-clip-text text-transparent">job-ready journey</span> — in 60 seconds
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Pick a program or upload your syllabus. See your degree&apos;s journey with the Board Infinity layer woven into each semester —
          and the AI-era roles your graduates walk out prepared to land. Your faculty keeps the academic core; we add the industry layer.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["NEP 40%", "online-credit allowance leveraged"], ["3,778h", "deliverable recorded content"], ["26", "AI-era role journeys mapped"], ["80+", "institutions already partnered"]].map(([v, l]) => (
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
          <summary className="cursor-pointer text-sm font-semibold text-slate-200">…or analyze your exact curriculum — answer 4 quick questions & attach the syllabus</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-300">1 · Degree / program name
              <input className="input mt-1" placeholder="e.g. BCA, B.Tech CSE, MBA (Finance)" value={degName} onChange={(e) => setDegName(e.target.value)} />
            </label>
            <div className="text-sm text-slate-300">2 · Coverage you&apos;re exploring
              <div className="mt-1 flex gap-2">
                <button onClick={() => setScope("full")} className={`btn flex-1 justify-center text-sm ${scope === "full" ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>Full degree</button>
                <button onClick={() => setScope("partial")} className={`btn flex-1 justify-center text-sm ${scope === "partial" ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>Specific semesters</button>
              </div>
            </div>
            {scope === "partial" && (
              <label className="text-sm text-slate-300">3 · Which semesters?
                <input className="input mt-1" placeholder="e.g. 3, 4, 5" value={sems} onChange={(e) => setSems(e.target.value)} />
              </label>
            )}
            <label className="text-sm text-slate-300">{scope === "partial" ? "4" : "3"} · Approx. batch size (optional)
              <input className="input mt-1" placeholder="e.g. 240 students" value={batch} onChange={(e) => setBatch(e.target.value)} />
            </label>
            <label className="text-sm text-slate-300 sm:col-span-2">{scope === "partial" ? "5" : "4"} · Attach the syllabus / subject list
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <label className="btn-ghost cursor-pointer text-sm">
                  📎 Choose file (.txt / .csv / .md)
                  <input type="file" accept=".txt,.csv,.md,.pdf,.doc,.docx" className="hidden" onChange={onFile} />
                </label>
                {fileName && <span className="text-xs text-emerald-400">✓ {fileName}</span>}
                {fileName && !/\.(txt|csv|md)$/i.test(fileName) && (
                  <span className="text-xs text-amber-400">PDF/DOC parsing lands with the full pilot — paste the subject list below for now.</span>
                )}
              </div>
            </label>
          </div>
          <textarea className="input mt-3 h-36 font-mono text-xs" placeholder={"…or paste here (one subject per line, semester headers supported):\nSemester 3\nDatabase Management Systems\nMachine Learning"} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={() => text.trim().length > 10 && runText(text, `${degName || "Your program"}${scope === "partial" && sems ? ` — Semesters ${sems}` : " — full degree"}${batch ? ` · ~${batch} students` : ""}`)}
              className="btn-primary text-sm">Generate degree journey →</button>
            <button onClick={() => { setText(SAMPLE); setDegName("BCA"); setScope("partial"); setSems("3, 4, 5"); }} className="btn-ghost text-sm">Load sample (BCA sem 3-5)</button>
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

          <div>
            <h3 className="text-xl font-extrabold text-white">🗺 The {result.degreeName} journey — with the Board Infinity layer woven in</h3>
            <p className="mt-1 text-sm text-slate-400">Click any stage to see subjects and delivery. Between stages: the job-role readiness your students accumulate.</p>
            <div className="relative mt-5 space-y-0 border-l-2 border-slate-800 pl-6">
              {result.groups.map((g, gi) => {
                const ms = milestoneAfter(gi);
                const covered = g.analysis.subjects.filter((s) => s.status !== "Gap");
                const retained = g.analysis.subjects.filter((s) => s.status === "Gap");
                const isLast = gi === result.groups.length - 1;
                return (
                  <div key={gi} className="relative pb-6">
                    <span className="absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{gi + 1}</span>
                    <details className="card p-4" open={gi === 0}>
                      <summary className="cursor-pointer">
                        <span className="font-bold text-white">{g.name}</span>
                        <span className="ml-3 text-xs text-slate-500">{covered.length} subjects with BI delivery · {retained.length} faculty-retained</span>
                      </summary>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {g.analysis.subjects.map((s, i) => {
                          const key = `${gi}-${i}`;
                          return (
                            <div key={key} className="rounded-lg bg-slate-950/60 px-3 py-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`chip ${STATUS_CLS[s.status]}`}>{s.status === "Gap" ? "Faculty" : s.status}</span>
                                <span className="flex-1 text-sm text-slate-200">{s.subject}</span>
                                {s.status !== "Gap" && (
                                  <button onClick={() => buildOverlay(key, s)} className="text-[11px] text-brand-400 hover:underline">{overlay[key] ? "↻" : "modules"}</button>
                                )}
                              </div>
                              {s.status !== "Gap" && <p className="mt-1 text-[10px] text-slate-500">▶ async modules + 🎙 weekly live tutorial{s.mapped ? ` · from “${s.mapped}”` : ""}</p>}
                              {overlay[key] && (
                                <ul className="mt-2 space-y-1 border-t border-slate-800 pt-2">
                                  {overlay[key].length === 0 && <li className="text-xs text-amber-300">Flagged for content production.</li>}
                                  {overlay[key].map((m) => (
                                    <li key={m.id} className="text-xs text-slate-300">▶ {m.title} <span className="text-slate-500">({m.hours}h · {m.videos} videos)</span></li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3 text-[11px]">
                        <span className="chip bg-fuchsia-900/50 text-fuchsia-300">★ Industry masterclass each unit</span>
                        <span className="chip bg-orange-900/50 text-orange-300">🏆 Semester hackathon — practical learning</span>
                        {isLast && <span className="chip bg-rose-900/50 text-rose-300">🎓 Final-year capstone — job-role aligned, coached</span>}
                        <span className="chip bg-slate-800 text-slate-400">✦ Skill checkpoints → verified evidence</span>
                      </div>
                    </details>
                    {ms && (
                      <Link href={`/journeys/${ms.slug}?view=university`}
                        className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 transition hover:border-emerald-500">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-900/70 text-sm font-extrabold text-emerald-300">{ms.pct}%</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">🎯 Milestone: {isLast ? "at graduation" : `after this stage`}, students hold {ms.pct}% of the skill foundation for <span className="text-emerald-300">{ms.role}</span></p>
                          {ms.salary && <p className="text-[11px] text-slate-400">{ms.salary.india} (India) · {ms.salary.growth}</p>}
                        </div>
                        <span className="text-xs text-emerald-400">view role journey →</span>
                      </Link>
                    )}
                  </div>
                );
              })}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-[10px] text-white">🎓</span>
                <div className="card border-emerald-700 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-5">
                  <h4 className="text-lg font-extrabold text-white">End goal — graduation day</h4>
                  <p className="mt-1 text-sm text-slate-300">
                    Every graduate leaves with: a degree <span className="text-slate-500">(yours)</span> + verified skill evidence, hackathon demos, a coached capstone and a portfolio <span className="text-slate-500">(ours)</span> — prepared to land the roles below.
                  </p>
                </div>
              </div>
            </div>
          </div>

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
