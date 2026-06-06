"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import journeys from "../../data/journeys.json";
import modules from "../../data/modules.json";
import { buildWeekPlan, clustersFor, placementScore } from "../../lib/engine";
import { ScoreRing } from "../../components/PlanCharts";
import Radar from "../../components/Radar";

const PHASE_TEXT = { "Foundation": "text-sky-400", "Core Build": "text-brand-400", "Specialization": "text-violet-400", "Career Launch": "text-rose-400" };

export default function Portfolio() {
  const [active, setActive] = useState(null);
  const [done, setDone] = useState({});
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("pf_active_plan") || "null");
      setActive(a);
      setName(localStorage.getItem("pf_name") || "");
      setHeadline(localStorage.getItem("pf_headline") || "");
      if (a) setDone(JSON.parse(localStorage.getItem(`pf_progress_${a.key}`) || "{}"));
    } catch {}
  }, []);

  const journey = useMemo(() => active && journeys.find((j) => active.key.includes(j.slug)), [active]);
  const plan = useMemo(() => journey && buildWeekPlan(journey.skills, modules, { hoursPerWeek: active?.hoursPerWeek || 10, roleName: journey.role }), [journey, active]);

  const evidence = useMemo(() => {
    if (!plan) return { acquired: [], planned: [], skills: [], hours: 0, pct: 0 };
    const acquired = [], planned = [];
    let hours = 0;
    for (const w of plan.weeks) {
      const entry = {
        week: w.n, phase: w.phase, theme: w.theme, deliverable: w.deliverable,
        type: w.type, skills: [...new Set((w.async || []).flatMap((m) => m.skills))].slice(0, 5),
        date: new Date(Date.now() + (w.n - 1) * 7 * 864e5),
      };
      if (done[w.n]) {
        acquired.push(entry);
        hours += w.asyncHours + (w.sync || []).reduce((a, s) => a + s.hours, 0) + (w.project?.hours || 0);
      } else planned.push(entry);
    }
    return {
      acquired, planned,
      skills: [...new Set(acquired.flatMap((e) => e.skills))],
      hours: Math.round(hours),
      pct: Math.round((acquired.length / plan.totalWeeks) * 100),
    };
  }, [plan, done]);

  const radar = useMemo(() => {
    if (!journey) return [];
    const target = clustersFor(journey.skills).slice(0, 7);
    const acq = new Map(clustersFor(evidence.skills));
    return target.map(([cl, w]) => ({ cluster: cl, target: 100, plan: Math.min(100, Math.round(((acq.get(cl) || 0) / w) * 100)) }));
  }, [journey, evidence]);

  const score = placementScore({ progressPct: evidence.pct, startReadiness: 30, hackathonDone: evidence.pct > 65, capstoneDone: evidence.pct >= 95 });

  function save(k, v, setter) { setter(v); try { localStorage.setItem(k, v); } catch {} }

  if (!journey) return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-3xl font-extrabold text-white">My Portfolio</h1>
      <p className="mt-3 text-slate-400">Your portfolio builds itself from journey evidence — deliverables, hackathon demos and your capstone. Start a journey to begin.</p>
      <Link href="/diagnostic" className="btn-primary mt-6">Start the 60-second diagnostic →</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-3xl font-extrabold text-white">My Portfolio</h1>
        <div className="flex gap-2">
          <a className="btn-ghost text-xs" target="_blank" rel="noreferrer"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://infyskill.vercel.app/diagnostic")}`}>Share on LinkedIn</a>
          <button onClick={() => window.print()} className="btn-ghost text-xs">🖨 Print / save PDF</button>
        </div>
      </div>

      <div className="card mt-5 overflow-hidden p-0">
        <div className="bg-gradient-to-r from-brand-900 via-slate-900 to-slate-950 px-6 py-6">
          <div className="flex flex-wrap items-center gap-5">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-2xl font-black text-white">
              {(name || "Y")[0].toUpperCase()}
            </span>
            <div className="flex-1">
              <input className="w-full bg-transparent text-2xl font-extrabold text-white outline-none placeholder:text-slate-600"
                placeholder="Your Name (click to edit)" value={name} onChange={(e) => save("pf_name", e.target.value, setName)} />
              <input className="mt-0.5 w-full bg-transparent text-sm text-brand-300 outline-none placeholder:text-slate-600"
                placeholder={`${journey.role} — in training`} value={headline} onChange={(e) => save("pf_headline", e.target.value, setHeadline)} />
              <p className="mt-1 text-xs text-slate-400">InfyAI verified journey · Board Infinity · target {journey.salary?.india}</p>
            </div>
            <div className="print:hidden"><ScoreRing value={score} label="Placement readiness" size={100} /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-800 sm:grid-cols-4">
          {[[evidence.acquired.length + " wks", "completed"], [evidence.hours + "h", "verified effort"], [evidence.skills.length, "skills evidenced"], [(active.deliverables || []).length, "deliverables"]].map(([v, l]) => (
            <div key={l} className="bg-slate-900 p-3 text-center">
              <p className="text-lg font-bold text-white">{v}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{l}</p>
            </div>
          ))}
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Skill evidence map</h2>
              {radar.length >= 3 ? <Radar data={radar} size={300} /> : null}
              <p className="text-center text-[11px] text-slate-500">acquired (filled) vs {journey.role} target (dashed)</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Verified skills ({evidence.skills.length})</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {evidence.skills.length === 0 && <p className="text-xs text-slate-500">Complete week 1 to earn your first verified skills.</p>}
                {evidence.skills.map((s) => <span key={s} className="chip bg-emerald-900/60 text-emerald-300">✓ {s}</span>)}
              </div>
              <h2 className="mt-5 text-sm font-semibold uppercase tracking-wider text-slate-400">Building next</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...new Set(evidence.planned.slice(0, 3).flatMap((e) => e.skills))].slice(0, 8).map((s) => <span key={s} className="chip bg-slate-800 text-slate-400">{s}</span>)}
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-400">Evidence timeline</h2>
          <div className="mt-3 space-y-2">
            {evidence.acquired.map((e) => (
              <div key={e.week} className="flex flex-wrap items-baseline gap-3 rounded-lg border-l-2 border-emerald-500 bg-slate-950/60 px-4 py-2.5">
                <span className="text-xs font-bold text-emerald-400">✓ Week {e.week}</span>
                <span className={`text-[10px] uppercase tracking-wider ${PHASE_TEXT[e.phase]}`}>{e.phase}</span>
                <span className="flex-1 text-sm text-slate-200">{e.deliverable}</span>
                {e.type === "hackathon" && <span className="chip bg-orange-900/60 text-orange-300">🏆 Hackathon</span>}
                {e.type === "capstone" && <span className="chip bg-rose-900/60 text-rose-300">🎓 Capstone</span>}
              </div>
            ))}
            {evidence.planned.slice(0, Math.max(3, 8 - evidence.acquired.length)).map((e) => (
              <div key={e.week} className="flex flex-wrap items-baseline gap-3 rounded-lg border-l-2 border-slate-700 bg-slate-950/30 px-4 py-2.5 opacity-60">
                <span className="text-xs font-bold text-slate-500">Week {e.week}</span>
                <span className="flex-1 text-sm text-slate-400">{e.deliverable}</span>
                {e.type === "hackathon" && <span className="chip bg-slate-800 text-slate-400">🏆 upcoming</span>}
                {e.type === "capstone" && <span className="chip bg-slate-800 text-slate-400">🎓 upcoming</span>}
                <span className="text-[10px] text-slate-600">~{e.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
          {evidence.acquired.length === 0 && (
            <p className="mt-3 text-xs text-slate-500">Greyed items show what this portfolio will contain as you progress — recruiters see only completed evidence. <Link href={`/journeys/${journey.slug}`} className="text-brand-400">Start week 1 →</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}
