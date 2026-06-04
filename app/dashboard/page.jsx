"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import journeys from "../../data/journeys.json";
import { placementScore } from "../../lib/engine";
import { ScoreRing } from "../../components/PlanCharts";

export default function Dashboard() {
  const [active, setActive] = useState(null);
  const [progressPct, setProgressPct] = useState(0);
  const [doneWeeks, setDoneWeeks] = useState(0);
  const [streak, setStreak] = useState(0);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("pf_active_plan") || "null");
      setActive(a);
      setStreak(JSON.parse(localStorage.getItem("pf_streak") || "{}").count || 0);
      setName(localStorage.getItem("pf_name") || "");
      if (a) {
        const prog = JSON.parse(localStorage.getItem(`pf_progress_${a.key}`) || "{}");
        const dc = Object.values(prog).filter(Boolean).length;
        setDoneWeeks(dc);
        setProgressPct(Math.round((dc / a.totalWeeks) * 100));
      }
    } catch {}
  }, []);

  const journey = useMemo(() => active && journeys.find((j) => active.key.includes(j.slug)), [active]);
  const score = placementScore({ progressPct, startReadiness: 30, hackathonDone: progressPct > 65, capstoneDone: progressPct >= 95 });
  const badges = useMemo(() => {
    const earned = [];
    const milestones = [[10, "🔥 Ignition", "First week completed"], [25, "🧱 Foundation", "25% of journey done"], [50, "⚙️ Builder", "Halfway there"], [70, "🏆 Hacker", "Hackathon zone cleared"], [90, "🚀 Finisher", "Capstone zone"], [100, "🎓 Graduate", "Journey complete"]];
    for (const [pct, icon, label] of milestones) earned.push({ pct, icon, label, got: progressPct >= pct });
    return earned;
  }, [progressPct]);

  function saveName(v) { setName(v); try { localStorage.setItem("pf_name", v); } catch {} }

  if (!active) return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-3xl font-extrabold text-white">My Dashboard</h1>
      <p className="mt-3 text-slate-400">No active journey yet. Take the diagnostic to generate your personalized plan — your progress, streaks, badges and certificate will live here.</p>
      <Link href="/diagnostic" className="btn-primary mt-6">Start the 60-second diagnostic →</Link>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">My Dashboard</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <div className="card flex flex-col items-center justify-center p-5">
          <ScoreRing value={score} label="Placement readiness" />
          <p className="mt-2 text-center text-[11px] text-slate-500">Grows with weeks completed, hackathon & capstone evidence</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Active journey</p>
          <p className="mt-1 font-bold text-white">{journey ? journey.role : active.key}</p>
          <p className="mt-2 text-sm text-slate-400">{doneWeeks} / {active.totalWeeks} weeks · {progressPct}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-800">
            <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${progressPct}%` }} />
          </div>
          {journey && <Link href={`/journeys/${journey.slug}`} className="btn-primary mt-4 text-xs">Continue journey →</Link>}
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-500">Learning streak</p>
          <p className="mt-2 text-5xl font-black text-orange-400">{streak}🔥</p>
          <p className="mt-1 text-xs text-slate-500">consecutive active days</p>
          <p className="mt-3 text-xs text-slate-400">Weekly goal: {active.hoursPerWeek} hrs</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Quick actions</p>
          <div className="mt-2 space-y-2 text-sm">
            <Link href="/portfolio" className="block text-brand-400 hover:underline">📁 My portfolio ({(active.deliverables || []).length} deliverables)</Link>
            <Link href="/jobs" className="block text-brand-400 hover:underline">💼 Jobs matching my journey</Link>
            <Link href="/mentors" className="block text-brand-400 hover:underline">🧑‍🏫 Book a coach session</Link>
            <Link href="/calendar" className="block text-brand-400 hover:underline">📅 Upcoming cohorts & masterclasses</Link>
          </div>
        </div>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold text-white">Badges</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {badges.map((b) => (
            <div key={b.pct} className={`rounded-xl border p-3 text-center ${b.got ? "border-amber-600/60 bg-amber-950/30" : "border-slate-800 opacity-40"}`}>
              <div className="text-2xl">{b.icon}</div>
              <p className="mt-1 text-xs font-semibold text-white">{b.label.split(" ")[0]}</p>
              <p className="text-[10px] text-slate-500">{b.pct}%</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold text-white">Certificate {progressPct < 100 && <span className="text-xs font-normal text-slate-500">(preview — unlocks at 100%)</span>}</h2>
        <input className="input mt-3 max-w-xs" placeholder="Your name as it should appear" value={name} onChange={(e) => saveName(e.target.value)} />
        <div className={`mx-auto mt-4 max-w-2xl ${progressPct < 100 ? "opacity-60" : ""}`}>
          <svg viewBox="0 0 800 520" className="w-full rounded-xl border border-slate-700">
            <rect width="800" height="520" fill="#0f172a" />
            <rect x="20" y="20" width="760" height="480" fill="none" stroke="#4f46e5" strokeWidth="2" />
            <rect x="28" y="28" width="744" height="464" fill="none" stroke="#334155" strokeWidth="1" />
            <text x="400" y="95" textAnchor="middle" fill="#818cf8" fontSize="16" letterSpacing="6">PATHFINDER AI · BOARD INFINITY</text>
            <text x="400" y="150" textAnchor="middle" fill="#f8fafc" fontSize="34" fontWeight="bold">Certificate of Completion</text>
            <text x="400" y="205" textAnchor="middle" fill="#94a3b8" fontSize="15">This certifies that</text>
            <text x="400" y="255" textAnchor="middle" fill="#fbbf24" fontSize="30" fontStyle="italic">{name || "Your Name"}</text>
            <text x="400" y="305" textAnchor="middle" fill="#94a3b8" fontSize="15">has successfully completed the blended career journey</text>
            <text x="400" y="345" textAnchor="middle" fill="#e2e8f0" fontSize="20" fontWeight="bold">{journey ? journey.role : "AI-Era Career Journey"}</text>
            <text x="400" y="385" textAnchor="middle" fill="#64748b" fontSize="12">{active.totalWeeks} weeks · async + live labs + masterclasses + hackathon + coached capstone</text>
            <text x="180" y="455" textAnchor="middle" fill="#64748b" fontSize="11">Verified skill evidence</text>
            <text x="620" y="455" textAnchor="middle" fill="#64748b" fontSize="11">boardinfinity.com</text>
          </svg>
        </div>
      </section>
    </div>
  );
}
