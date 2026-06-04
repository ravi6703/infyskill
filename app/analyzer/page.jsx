"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import skills from "../../data/skills.json";
import courses from "../../data/courses.json";
import journeys from "../../data/journeys.json";
import modules from "../../data/modules.json";
import { analyzeJD, extractSkillsDetailed } from "../../lib/match";
import { buildWeekPlan } from "../../lib/engine";
import WeekPlan from "../../components/WeekPlan";
import { ScoreRing } from "../../components/PlanCharts";
import { sbInsert } from "../../lib/supabase";

const SAMPLE = `We are hiring a GenAI Engineer to build production LLM applications.
Requirements: Python, LangChain or LangGraph, RAG pipelines, vector databases (Pinecone),
prompt engineering, fine-tuning with Hugging Face, FastAPI, Docker, CI/CD, AWS or GCP.
Experience with agents, MLOps and model evaluation is a plus.`;

export default function Analyzer() {
  const [persona, setPersona] = useState("learner");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [detailed, setDetailed] = useState([]);
  const [plan, setPlan] = useState(null);
  const [hpw, setHpw] = useState(10);
  const [activeJourney, setActiveJourney] = useState(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const jd = localStorage.getItem("pf_jd");
      if (jd) { setText(jd); localStorage.removeItem("pf_jd"); }
      const a = JSON.parse(localStorage.getItem("pf_active_plan") || "null");
      if (a) setActiveJourney(journeys.find((j) => a.key.includes(j.slug)) || null);
    } catch {}
  }, []);

  function run() {
    if (text.trim().length < 30) return;
    const r = analyzeJD(text, skills, courses, journeys);
    setResult(r); setPlan(null);
    setDetailed(extractSkillsDetailed(text, skills));
    sbInsert("pf_analyses", { kind: "jd", input_title: text.slice(0, 80), input_text: text.slice(0, 5000), result: { coverage: r.coverage, skills: r.skills } }).catch(() => {});
  }
  function makePlan(h = hpw) {
    setHpw(h);
    setPlan(buildWeekPlan(result.skills, modules, { hoursPerWeek: h, roleName: "this role" }));
  }
  function lead() {
    if (!email.includes("@")) return;
    sbInsert("pf_analyses", { kind: "lead", input_title: "Hire-train-deploy inquiry", input_text: email, result: { jd: text.slice(0, 300) } }).then(() => setSent(true)).catch(() => setSent(true));
  }

  const must = detailed.filter((d) => d.must && result?.covered.includes(d.name));
  const nice = detailed.filter((d) => !d.must && result?.covered.includes(d.name));
  const gapsD = detailed.filter((d) => result?.gaps.includes(d.name));

  // "you vs this JD" if learner has an active journey
  const youVsJD = useMemo(() => {
    if (!result || !activeJourney) return null;
    const mine = new Set(activeJourney.skills.map((s) => s.toLowerCase()));
    const have = result.skills.filter((s) => mine.has(s.toLowerCase()));
    return { pct: Math.round((have.length / result.skills.length) * 100), have, missing: result.skills.filter((s) => !mine.has(s.toLowerCase())) };
  }, [result, activeJourney]);

  const topJourney = result?.journeys?.[0] && journeys.find((j) => j.slug === result.journeys[0].slug);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">JD → Journey Analyzer</h1>
      <p className="mt-2 max-w-3xl text-slate-400">Paste any job description. The engine reads it like a recruiter, then builds the path to it like a mentor.</p>

      <div className="mt-5 flex gap-2">
        {[["learner", "🎯 I'm a learner — can I get this job?"], ["employer", "🏢 I'm an employer — train talent for this JD"]].map(([v, l]) => (
          <button key={v} onClick={() => setPersona(v)} className={`btn text-sm ${persona === v ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>{l}</button>
        ))}
      </div>

      <textarea className="input mt-4 h-44 font-mono text-xs" placeholder="Paste a job description here…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-3 flex gap-3">
        <button onClick={run} className="btn-primary">Analyze JD</button>
        <button onClick={() => setText(SAMPLE)} className="btn-ghost">Load sample JD</button>
      </div>

      {result && (
        <div className="mt-10 space-y-8">
          <div className="card flex flex-wrap items-center gap-6 border-brand-700 bg-gradient-to-br from-brand-950 to-slate-900 p-5">
            <ScoreRing value={result.coverage} label="teachable from our library" size={120} />
            <div className="flex-1">
              <h2 className="text-xl font-extrabold text-white">
                {persona === "learner" ? "Yes — this job is learnable." : "Yes — we can train talent to this JD."}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {result.skills.length} skills detected · <span className="text-emerald-300">{result.covered.length} teachable today</span>
                {result.gaps.length > 0 && <> · <span className="text-amber-300">{result.gaps.length} flagged for new content</span></>}
                {topJourney?.salary && <> · typical pay for this profile: <span className="text-emerald-300">{topJourney.salary.india}</span></>}
              </p>
              {youVsJD && persona === "learner" && (
                <p className="mt-2 rounded-lg bg-slate-950/50 px-3 py-2 text-sm">
                  <span className="font-semibold text-white">You vs this JD:</span>{" "}
                  your <span className="text-brand-300">{activeJourney.role}</span> journey covers <span className="font-bold text-emerald-300">{youVsJD.pct}%</span> of it.
                  {youVsJD.missing.length > 0 && <span className="text-slate-400"> Remaining: {youVsJD.missing.slice(0, 5).join(", ")}</span>}
                </p>
              )}
            </div>
          </div>

          <section>
            <h2 className="text-lg font-bold text-white">What this JD actually demands</h2>
            <p className="mt-1 text-xs text-slate-500">Hover any skill to see the exact JD line that triggered it.</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Must-have ({must.length})</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {must.map((d) => <span key={d.name} title={`JD: "${d.evidence}"`} className="chip cursor-help bg-emerald-900/60 text-emerald-300">{d.name}</span>)}
                </div>
              </div>
              {nice.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">Nice-to-have ({nice.length})</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {nice.map((d) => <span key={d.name} title={`JD: "${d.evidence}"`} className="chip cursor-help bg-sky-900/60 text-sky-300">{d.name}</span>)}
                  </div>
                </div>
              )}
              {gapsD.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Not yet in our library ({gapsD.length}) — honest gaps</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {gapsD.map((d) => <span key={d.name} title={`JD: "${d.evidence}"`} className="chip cursor-help bg-amber-900/60 text-amber-300">{d.name}</span>)}
                  </div>
                </div>
              )}
            </div>
          </section>

          {result.journeys.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white">Closest standard journeys</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {result.journeys.map((jm) => {
                  const j = journeys.find((x) => x.slug === jm.slug);
                  return (
                    <Link key={jm.slug} href={`/journeys/${jm.slug}`} className="card group p-4 transition hover:border-brand-500">
                      <h3 className="font-bold text-white group-hover:text-brand-300">{jm.role}</h3>
                      <p className="mt-1 text-xs text-slate-400">{jm.hits.length} skill overlaps · {j?.weeks} weeks</p>
                      {j?.salary && <p className="mt-1 text-xs text-emerald-300">{j.salary.india}</p>}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section className="card border-brand-700 p-5">
            <h2 className="text-lg font-bold text-white">
              {persona === "learner" ? "Your week-by-week path to this job" : "Cohort training plan for this JD"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {persona === "learner"
                ? "Module-level plan from the tagged library — live labs, hackathon and a coached capstone included."
                : "Hire-train-deploy: the exact blended programme a cohort would follow to reach this JD."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {[5, 10, 15].map((h) => (
                <button key={h} onClick={() => makePlan(h)} className={`btn text-sm ${plan && hpw === h ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>{h} hrs/week</button>
              ))}
              {plan && <span className="text-sm text-slate-400">→ {plan.totalWeeks} weeks · {plan.totalHours}h · {plan.moduleCount} modules</span>}
            </div>
          </section>

          {plan && <WeekPlan plan={plan} planKey={`jd-${result.skills.slice(0, 3).join("-")}`} />}

          {persona === "employer" && (
            <section className="card border-emerald-900/60 p-5">
              <h2 className="text-lg font-bold text-white">🏢 Hire-train-deploy with Board Infinity</h2>
              <p className="mt-1 text-sm text-slate-400">
                We train your selected candidates (or our talent pool) to this exact JD{plan ? ` in ~${plan.totalWeeks} weeks` : ""} — you assess at the capstone, hire who clears your bar.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {sent ? <p className="text-emerald-400">✓ We&apos;ll reach out with a cohort proposal.</p> : (
                  <>
                    <input className="input max-w-xs" placeholder="work email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <button onClick={lead} className="btn-primary text-sm">Get a cohort proposal →</button>
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
