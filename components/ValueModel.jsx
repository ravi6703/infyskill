"use client";
import { useState } from "react";

// The InfyAI delivery model — the USP, segregated by component,
// framed by audience: what problem each layer solves.
const PILLARS = {
  university: {
    title: "The InfyAI delivery model — what each layer solves for your institution",
    sub: "One blended model per course/semester. You keep academic governance; we supply the industry layer.",
    items: [
      { icon: "▶", name: "Async Content", color: "border-brand-500", head: "Reduces faculty load",
        text: "High-engagement recorded modules from our tagged library. One-time effort, reusable every semester, credit-eligible under NEP 2020's 40% online allowance." },
      { icon: "🎙", name: "Sync Sessions", color: "border-violet-500", head: "Your faculty or our SME",
        text: "Weekly live tutorials reinforcing the async content — delivered by your faculty, or by an SME Board Infinity provides. No new hiring needed." },
      { icon: "★", name: "Masterclass", color: "border-fuchsia-500", head: "Industry expertise on campus",
        text: "Practitioners every 2–3 weeks bring current industry reality your classroom can't — without guest-faculty procurement effort." },
      { icon: "🏆", name: "Hackathon", color: "border-orange-500", head: "Practical learning, visible outcomes",
        text: "Semester hackathon with industry judges. Students build under pressure; your placement cell gets demo-day evidence." },
      { icon: "🎓", name: "Capstone Project", color: "border-rose-500", head: "Hands-on, job-role aligned",
        text: "Final-year project mapped to a specific AI-era role journey — assessed, portfolio-grade, and the bridge from degree to placement." },
    ],
  },
  learner: {
    title: "What's inside your journey — and what each layer does for your career",
    sub: "Not just videos. A blended system designed to end in a job.",
    items: [
      { icon: "▶", name: "Async Content", color: "border-brand-500", head: "Learn from Board Infinity SMEs",
        text: "High-engagement recorded modules, skill-tagged to your target role. Watch at your pace — only what you don't already know." },
      { icon: "🎙", name: "Sync Sessions", color: "border-violet-500", head: "Live labs with SMEs",
        text: "Weekly live sessions with Board Infinity subject-matter experts — doubts solved, concepts applied to real cases." },
      { icon: "★", name: "Masterclass", color: "border-fuchsia-500", head: "10+ years of industry experience",
        text: "Every 2–3 weeks, an expert who's actually shipped it shows you how it works in production." },
      { icon: "🏆", name: "Hackathon", color: "border-orange-500", head: "Practical learning",
        text: "A 48-hour build sprint with industry judges — your first portfolio asset and proof you can deliver under pressure." },
      { icon: "🎓", name: "Capstone Project", color: "border-rose-500", head: "Hands-on, coached",
        text: "A production-grade project with 1:1 coach guidance — the centerpiece of your portfolio and interviews." },
    ],
  },
};

export default function ValueModel({ audience = "learner", counts = null, toggle = false }) {
  const [aud, setAud] = useState(audience);
  const m = PILLARS[aud];
  const countFor = (name) => {
    if (!counts) return null;
    if (name === "Async Content") return `${counts.modules} modules · ${counts.asyncPct}% of time`;
    if (name === "Sync Sessions") return `${counts.sync} live sessions`;
    if (name === "Masterclass") return `${counts.masterclasses} sessions`;
    if (name === "Hackathon") return "1 sprint week";
    if (name === "Capstone Project") return `${counts.capstoneWeeks} weeks, coached`;
    return null;
  };
  return (
    <section className="card border-brand-800 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">{m.title}</h2>
          <p className="mt-1 text-xs text-slate-400">{m.sub}</p>
        </div>
        {toggle && (
          <div className="flex gap-1 rounded-lg border border-slate-700 p-1 text-xs">
            {[["learner", "Learner view"], ["university", "University view"]].map(([v, l]) => (
              <button key={v} onClick={() => setAud(v)} className={`rounded px-2.5 py-1 transition ${aud === v ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {m.items.map((p, i) => (
          <div key={p.name} className={`relative rounded-xl border-t-2 ${p.color} bg-slate-950/60 p-4`}>
            <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-600">{i + 1}</span>
            <p className="text-xl">{p.icon}</p>
            <p className="mt-1 text-sm font-bold text-white">{p.name}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-emerald-300">{p.head}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{p.text}</p>
            {countFor(p.name) && <p className="mt-2 rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-brand-300">{countFor(p.name)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
