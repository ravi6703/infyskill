"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import journeys from "../../data/journeys.json";

// Demo job feed (production: fed by NEXUS scraper)
const JOBS = [
  { title: "GenAI Application Developer", co: "Fintech unicorn · Bengaluru", lpa: "₹18–26 LPA", skills: ["Python", "LangChain", "RAG Pipelines", "FastAPI", "Docker"] },
  { title: "Junior Agentic AI Engineer", co: "GCC · Hyderabad", lpa: "₹14–20 LPA", skills: ["LangGraph", "Prompt Engineering", "Vector Databases", "Python"] },
  { title: "Data Engineer", co: "Retail major · Remote", lpa: "₹12–18 LPA", skills: ["SQL", "Snowflake", "Data Pipelines", "Python"] },
  { title: "AI Marketing Analyst", co: "D2C brand · Mumbai", lpa: "₹8–12 LPA", skills: ["Google Analytics 4", "Generative AI", "Email Marketing", "Data Visualization"] },
  { title: "MLOps Engineer", co: "AI startup · Pune", lpa: "₹16–24 LPA", skills: ["Docker", "Kubernetes", "MLflow", "CI/CD"] },
  { title: "AI Business Analyst", co: "Consulting · Gurugram", lpa: "₹9–14 LPA", skills: ["Microsoft Excel", "Power BI", "Data Analysis", "Generative AI"] },
  { title: "Conversation Designer", co: "CX platform · Remote", lpa: "₹10–15 LPA", skills: ["Conversation Design", "Prompt Engineering", "Usability Testing"] },
  { title: "AI Finance Associate", co: "NBFC · Mumbai", lpa: "₹10–16 LPA", skills: ["Financial Modeling", "Generative AI", "Forecasting", "Microsoft Excel"] },
];

export default function Jobs() {
  const [activeRole, setActiveRole] = useState(null);
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("pf_active_plan") || "null");
      if (a) setActiveRole(journeys.find((j) => a.key.includes(j.slug)) || null);
    } catch {}
  }, []);

  const scored = useMemo(() => {
    const mySkills = new Set((activeRole?.skills || []).map((s) => s.toLowerCase()));
    return JOBS.map((j) => {
      const hits = j.skills.filter((s) => mySkills.has(s.toLowerCase()));
      return { ...j, match: activeRole ? Math.round((hits.length / j.skills.length) * 100) : null, hits };
    }).sort((a, b) => (b.match || 0) - (a.match || 0));
  }, [activeRole]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Job Matches</h1>
      <p className="mt-2 max-w-2xl text-slate-400">
        Live roles matched against your journey skills. {activeRole
          ? <>Matching against your <span className="text-brand-300">{activeRole.role}</span> journey.</>
          : <>Start a journey to see your match % — <Link href="/diagnostic" className="text-brand-400">take the diagnostic</Link>.</>}
        <span className="text-xs"> (Demo feed — NEXUS integration live-feeds this in production.)</span>
      </p>
      <div className="mt-8 space-y-3">
        {scored.map((j) => (
          <div key={j.title + j.co} className="card flex flex-wrap items-center gap-4 p-4">
            {j.match !== null && (
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-extrabold ${j.match >= 60 ? "bg-emerald-900/70 text-emerald-300" : j.match >= 30 ? "bg-amber-900/70 text-amber-300" : "bg-slate-800 text-slate-400"}`}>{j.match}%</span>
            )}
            <div className="flex-1">
              <p className="font-bold text-white">{j.title}</p>
              <p className="text-xs text-slate-500">{j.co} · <span className="text-emerald-300">{j.lpa}</span></p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {j.skills.map((s) => (
                  <span key={s} className={`chip ${j.hits.includes(s) ? "bg-emerald-900/60 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>{s}</span>
                ))}
              </div>
            </div>
            <button className="btn-ghost text-xs">Apply via InfyTalent →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
