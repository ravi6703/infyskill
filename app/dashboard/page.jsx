"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import journeys from "../../data/journeys.json";
import modules from "../../data/modules.json";
import { buildWeekPlan, clustersFor, placementScore } from "../../lib/engine";
import { ScoreRing, PhaseChart } from "../../components/PlanCharts";
import Radar from "../../components/Radar";

export default function Dashboard() {
  const [active, setActive] = useState(null);
  const [done, setDone] = useState({});
  const [streak, setStreak] = useState(0);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("pf_active_plan") || "null");
      setActive(a);
      setStreak(JSON.parse(localStorage.getItem("pf_streak") || "{}").count || 0);
      setName(localStorage.getItem("pf_name") || "");
      if (a) setDone(JSON.parse(localStorage.getItem(`pf_progress_${a.key}`) || "{}"));
    } catch {}
  }, []);

  const journey = useMemo(() => active && journeys.find((j) => active.key.includes(j.slug)), [active]);
  const plan = useMemo(() => journey && buildWeekPlan(journey.skills, modules, { hoursPerWeek: active?.hoursPerWeek || 10, roleName: journey.role }), [journey, active]);

  const stats = useMemo(() => {
    if (!plan) return null;
    const doneWeeks = plan.weeks.filter((w) => done[w.n]);
    const hoursDone = Math.round(doneWeeks.reduce((a, w) => a + w.asyncHours + (w.sync || []).reduce((x, s) => x + s.hours, 0) + (w.project?.hours || 0), 0));
    const videosDone = doneWeeks.reduce((a, w) => a + (w.async || []).reduce((x, m) => x + (m.videos || 0), 0), 0);
    const skillsAcquired = [...new Set(doneWeeks.flatMap((w) => (w.async || []).flatMap((m) => m.skills)))];
    const progressPct = Math.round((doneWeeks.length / plan.totalWeeks) * 100);
    const nextWeek = plan.weeks.find((w) => !done[w.n]);
    const projected = new Date(Date.now() + (plan.totalWeeks - doneWeeks.length) * 7 * 864e5);
    return { doneWeeks: doneWeeks.length, hoursDone, videosDone, skillsAcquired, progressPct, nextWeek, projected };
  }, [plan, done]);

  const radar = useMemo(() => {
    if (!journey || !stats) return [];
    const target = clustersFor(journey.skills).slice(0, 7);
    const acq = new Map(clustersFor(stats.skillsAcquired));
    return target.map(([cl, w]) => ({ cluster: cl, target: 100, plan: Math.min(100, Math.round(((acq.get(cl) || 0) / w) * 100)) }));
  }, [journey, stats]);

  const score = placementScore({ progressPct: stats?.progressPct || 0, startReadiness: 30, hackathonDone: (stats?.progressPct || 0) > 65, capstoneDone: (stats?.progressPct || 0) >= 95 });
  const badges = useMemo(() => {
    const p = stats?.progressPct || 0;
    return [[10, "🔥", "Ignition"], [25, "🧱", "Foundation"], [50, "⚙️", "Builder"], [70, "🏆", "Hacker"], [90, "🚀", "Finisher"], [100, "🎓", "Graduate"]].map(([pct, icon, label]) => ({ pct, icon, label, got: p >= pct }));
  }, [stats]);

  function saveName(v) { setName(v); try { localStorage.setItem("pf_name", v); } catch {} }

  if (!active || !journey) return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-3xl font-extrabold text-white">My Dashboard</h1>
      <p className="mt-3 text-slate-400">No active journey yet. Take the diagnostic — your progress, graphs, streaks, badges and certificate will live here.</p>
      <Link href="/diagnostic" className="btn-primary mt-6">Start the 60-second diagnostic →</Link>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-white">{name ? `${name.split(" ")[0]}'s` : "My"} Dashboard</h1>
        <p className="text-sm text-slate-400">🎯 {journey.role} · projected done <span className="text-slate-200">{stats?.projected.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <div className="card flex flex-col items-center justify-center p-5">
          <ScoreRing value={score} label="Placement readiness" />
          <p className="mt-2 text-center text-[11px] text-slate-500">+ hackathon evidence at 70% · + capstone at 95%</p>
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-500">Journey progress — week map (click any week in your plan)</p>
            <span className="text-sm font-bold text-white">{stats?.progressPct}%</span>
          </div>
          <Link href={`/journeys/${journey.slug}`} className="mt-3 flex flex-wrap gap-1.5">
            {plan.weeks.map((w) => {
              const isNext = stats?.nextWeek?.n === w.n;
              return (
                <span key={w.n} title={`Week ${w.n}: ${w.theme}`}
                  className={`grid h-7 w-7 place-items-center rounded text-[10px] font-bold transition ${done[w.n] ? "bg-emerald-600 text-white" : isNext ? "animate-pulse bg-brand-600 text-white" : w.type === "hackathon" ? "bg-orange-950 text-orange-400" : w.type === "capstone" ? "bg-rose-950 text-rose-400" : "bg-slate-800 text-slate-500"}`}>
                  {done[w.n] ? "✓" : w.n}
                </span>
              );
            })}
          </Link>
          <div className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-800 pt-3 text-center">
            {[[stats?.doneWeeks, "weeks done"], [`${stats?.hoursDone}h`, "hours logged"], [stats?.videosDone, "videos watched"], [stats?.skillsAcquired.length, "skills acquired"]].map(([v, l]) => (
              <div key={l}><p className="text-lg font-bold text-white">{v}</p><p className="text-[10px] text-slate-500">{l}</p></div>
            ))}
          </div>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-500">Learning streak</p>
          <p className="mt-2 text-5xl font-black text-orange-400">{streak}🔥</p>
          <p className="mt-1 text-xs text-slate-500">consecutive active days</p>
          <p className="mt-3 text-xs text-slate-400">Weekly goal: {active.hoursPerWeek} hrs</p>
        </div>
      </div>

      {stats?.nextWeek && (
        <div className="card mt-4 border-brand-700 bg-gradient-to-r from-brand-950 to-slate-900 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">▶ Up next — Week {stats.nextWeek.n}: {stats.nextWeek.theme}</p>
              <p className="mt-1 text-sm text-slate-300">
                {stats.nextWeek.async.length > 0 && <>{stats.nextWeek.async.length} modules ({stats.nextWeek.asyncHours}h) · </>}
                {stats.nextWeek.sync.length} live sessions{stats.nextWeek.project ? " · project sprint" : ""}{stats.nextWeek.masterclass ? " · ★ masterclass" : ""}
              </p>
              <p className="mt-1 text-xs text-emerald-300">📦 {stats.nextWeek.deliverable}</p>
            </div>
            <Link href={`/journeys/${journey.slug}`} className="btn-primary text-sm">Continue journey →</Link>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Skills acquired (filled) vs role target (dashed)</p>
          {radar.length >= 3 ? <Radar data={radar} /> : <p className="mt-6 text-center text-sm text-slate-500">Complete your first week to start the radar.</p>}
        </div>
        <div className="card flex flex-col justify-center p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Effort by phase</p>
          <div className="mt-3"><PhaseChart weeks={plan.weeks} /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Quick actions</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <Link href="/portfolio" className="rounded-lg bg-slate-950/60 px-3 py-2 text-brand-400 hover:bg-slate-800">📁 Portfolio ({(active.deliverables || []).length})</Link>
            <Link href="/compare" className="rounded-lg bg-slate-950/60 px-3 py-2 text-brand-400 hover:bg-slate-800">↔ Compare roles</Link>
            <Link href="/analyzer" className="rounded-lg bg-slate-950/60 px-3 py-2 text-brand-400 hover:bg-slate-800">📋 Test a JD vs my skills</Link>
            <Link href="/pricing" className="rounded-lg bg-slate-950/60 px-3 py-2 text-brand-400 hover:bg-slate-800">🚀 Founding cohort</Link>
          </div>
        </div>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="text-lg font-bold text-white">Badges</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {badges.map((b) => (
            <div key={b.pct} className={`rounded-xl border p-3 text-center ${b.got ? "border-amber-600/60 bg-amber-950/30" : "border-slate-800 opacity-40"}`}>
              <div className="text-2xl">{b.icon}</div>
              <p className="mt-1 text-xs font-semibold text-white">{b.label}</p>
              <p className="text-[10px] text-slate-500">{b.pct}%</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="text-lg font-bold text-white">Certificate {(stats?.progressPct || 0) < 100 && <span className="text-xs font-normal text-slate-500">(preview — unlocks at 100%)</span>}</h2>
        <input className="input mt-3 max-w-xs" placeholder="Your name as it should appear" value={name} onChange={(e) => saveName(e.target.value)} />
        <div className={`mx-auto mt-4 max-w-2xl ${(stats?.progressPct || 0) < 100 ? "opacity-60" : ""}`}>
          <svg viewBox="0 0 800 520" className="w-full rounded-xl border border-slate-700">
            <rect width="800" height="520" fill="#0f172a" />
            <rect x="20" y="20" width="760" height="480" fill="none" stroke="#4f46e5" strokeWidth="2" />
            <rect x="28" y="28" width="744" height="464" fill="none" stroke="#334155" strokeWidth="1" />
            <text x="400" y="95" textAnchor="middle" fill="#818cf8" fontSize="16" letterSpacing="6">PATHFINDER AI · BOARD INFINITY</text>
            <text x="400" y="150" textAnchor="middle" fill="#f8fafc" fontSize="34" fontWeight="bold">Certificate of Completion</text>
            <text x="400" y="205" textAnchor="middle" fill="#94a3b8" fontSize="15">This certifies that</text>
            <text x="400" y="255" textAnchor="middle" fill="#fbbf24" fontSize="30" fontStyle="italic">{name || "Your Name"}</text>
            <text x="400" y="305" textAnchor="middle" fill="#94a3b8" fontSize="15">has successfully completed the blended career journey</text>
            <text x="400" y="345" textAnchor="middle" fill="#e2e8f0" fontSize="20" fontWeight="bold">{journey.role}</text>
            <text x="400" y="385" textAnchor="middle" fill="#64748b" fontSize="12">{plan.totalWeeks} weeks · async + live labs + masterclasses + hackathon + coached capstone</text>
            <text x="180" y="455" textAnchor="middle" fill="#64748b" fontSize="11">Verified skill evidence</text>
            <text x="620" y="455" textAnchor="middle" fill="#64748b" fontSize="11">boardinfinity.com</text>
          </svg>
        </div>
      </section>
    </div>
  );
}
