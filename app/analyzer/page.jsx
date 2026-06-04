"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import skills from "../../data/skills.json";
import courses from "../../data/courses.json";
import journeys from "../../data/journeys.json";
import modules from "../../data/modules.json";
import { analyzeJD } from "../../lib/match";
import { buildWeekPlan } from "../../lib/engine";
import WeekPlan from "../../components/WeekPlan";
import { sbInsert } from "../../lib/supabase";

const SAMPLE = `We are hiring a GenAI Engineer to build production LLM applications.
Requirements: Python, LangChain or LangGraph, RAG pipelines, vector databases (Pinecone),
prompt engineering, fine-tuning with Hugging Face, FastAPI, Docker, CI/CD, AWS or GCP.
Experience with agents, MLOps and model evaluation is a plus.`;

export default function Analyzer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [plan, setPlan] = useState(null);
  const [hpw, setHpw] = useState(10);

  useEffect(() => {
    try {
      const jd = localStorage.getItem("pf_jd");
      if (jd) { setText(jd); localStorage.removeItem("pf_jd"); }
    } catch {}
  }, []);

  function run() {
    if (text.trim().length < 30) return;
    const r = analyzeJD(text, skills, courses, journeys);
    setResult(r); setPlan(null);
    sbInsert("pf_analyses", { kind: "jd", input_title: text.slice(0, 80), input_text: text.slice(0, 5000), result: { coverage: r.coverage, skills: r.skills } }).catch(() => {});
  }
  function makePlan(h = hpw) {
    setHpw(h);
    setPlan(buildWeekPlan(result.skills, modules, { hoursPerWeek: h, roleName: "this role" }));
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">JD → Journey Analyzer</h1>
      <p className="mt-2 max-w-3xl text-slate-400">
        Paste any job description. The engine extracts skills, then composes a <span className="text-brand-300">module-level, week-by-week journey</span> —
        the same engine behind NEXUS auto-journeys and the learner diagnostic.
      </p>
      <textarea className="input mt-6 h-52 font-mono text-xs" placeholder="Paste a job description here…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-3 flex gap-3">
        <button onClick={run} className="btn-primary">Analyze JD</button>
        <button onClick={() => setText(SAMPLE)} className="btn-ghost">Load sample JD</button>
      </div>

      {result && (
        <div className="mt-10 space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5 text-center"><div className="text-4xl font-extrabold text-white">{result.coverage}%</div><div className="mt-1 text-sm text-slate-400">skill coverage by the library</div></div>
            <div className="card p-5 text-center"><div className="text-4xl font-extrabold text-white">{result.skills.length}</div><div className="mt-1 text-sm text-slate-400">skills extracted</div></div>
            <div className="card p-5 text-center"><div className="text-4xl font-extrabold text-white">{result.journeys.length}</div><div className="mt-1 text-sm text-slate-400">closest standard journeys</div></div>
          </div>

          <section>
            <h2 className="text-lg font-bold text-white">Extracted skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.covered.map((s) => <span key={s} className="chip bg-emerald-900/60 text-emerald-300">{s}</span>)}
              {result.gaps.map((s) => <span key={s} className="chip bg-amber-900/60 text-amber-300">{s} (gap)</span>)}
            </div>
          </section>

          {result.journeys.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white">Closest standard journeys</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {result.journeys.map((j) => (
                  <Link key={j.slug} href={`/journeys/${j.slug}`} className="card group p-4 transition hover:border-brand-500">
                    <h3 className="font-bold text-white group-hover:text-brand-300">{j.role}</h3>
                    <p className="mt-1 text-xs text-slate-400">{j.hits.length} skill overlaps</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="card border-brand-700 p-5">
            <h2 className="text-lg font-bold text-white">Generate the custom week-by-week journey for this JD</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {[5, 10, 15].map((h) => (
                <button key={h} onClick={() => makePlan(h)} className={`btn text-sm ${plan && hpw === h ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>{h} hrs/week</button>
              ))}
            </div>
          </section>

          {plan && <WeekPlan plan={plan} planKey={`jd-${result.skills.slice(0, 3).join("-")}`} />}
        </div>
      )}
    </div>
  );
}
