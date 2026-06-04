"use client";
import { useEffect, useMemo, useState } from "react";
import Radar from "./Radar";

const PHASE_CLS = {
  "Foundation": "border-l-sky-500", "Core Build": "border-l-brand-500",
  "Specialization": "border-l-violet-500", "Career Launch": "border-l-rose-500",
};

export default function WeekPlan({ plan, planKey }) {
  const [done, setDone] = useState({});
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(`pf_progress_${planKey}`) || "{}")); } catch {}
  }, [planKey]);
  function toggle(wn) {
    const next = { ...done, [wn]: !done[wn] };
    setDone(next);
    try { localStorage.setItem(`pf_progress_${planKey}`, JSON.stringify(next)); } catch {}
  }
  const doneCount = useMemo(() => plan.weeks.filter((w) => done[w.n]).length, [done, plan]);
  const progress = Math.round((doneCount / plan.totalWeeks) * 100);

  return (
    <div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[["Weeks", plan.totalWeeks], ["Total hours", plan.totalHours], ["Modules", plan.moduleCount],
          ["From courses", plan.courseCount], ["Hrs/week", plan.hoursPerWeek], ["Progress", `${progress}%`]].map(([l, v]) => (
          <div key={l} className="card p-3 text-center">
            <div className="text-xl font-bold text-white">{v}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{l}</div>
          </div>
        ))}
      </div>

      <div className="card mt-4 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Blend (evidence-based: ~40% async · ~25% live · ~20% project · rest masterclass/coaching/assessment)</p>
        <div className="mt-2 flex h-4 w-full overflow-hidden rounded">
          <div className="bg-brand-500" style={{ width: `${plan.blend.async}%` }} title={`Async ${plan.blend.async}%`} />
          <div className="bg-violet-500" style={{ width: `${plan.blend.sync}%` }} title={`Sync ${plan.blend.sync}%`} />
          <div className="bg-rose-500" style={{ width: `${plan.blend.project}%` }} title={`Project ${plan.blend.project}%`} />
          <div className="bg-fuchsia-500" style={{ width: `${plan.blend.masterclassCoaching}%` }} title={`Masterclass+Coaching ${plan.blend.masterclassCoaching}%`} />
          <div className="bg-slate-500" style={{ width: `${plan.blend.assessment}%` }} title={`Assessment ${plan.blend.assessment}%`} />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-500" />Async {plan.blend.async}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-500" />Live sync {plan.blend.sync}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Hackathon+Capstone {plan.blend.project}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-fuchsia-500" />Masterclass+Coach {plan.blend.masterclassCoaching}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-500" />Assessment {plan.blend.assessment}%</span>
        </div>
      </div>

      {plan.radar?.length >= 3 && (
        <div className="card mt-4 p-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Skill coverage radar — plan (filled) vs role target (dashed)</p>
          <Radar data={plan.radar} />
        </div>
      )}

      <div className="mt-8 space-y-4">
        {plan.weeks.map((w) => (
          <div key={w.n} className={`card border-l-4 p-4 ${PHASE_CLS[w.phase]} ${done[w.n] ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => toggle(w.n)}
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition ${done[w.n] ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-600 text-slate-300 hover:border-brand-500"}`}>
                {done[w.n] ? "✓" : w.n}
              </button>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Week {w.n} · {w.theme}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{w.phase}</p>
              </div>
              {w.type === "hackathon" && <span className="chip bg-orange-900/60 text-orange-300">Hackathon</span>}
              {w.type === "capstone" && <span className="chip bg-rose-900/60 text-rose-300">Capstone</span>}
            </div>

            {w.async.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-400">Async · {w.asyncHours}h self-paced</p>
                <ul className="mt-1 space-y-1.5">
                  {w.async.map((a) => (
                    <li key={a.id} className="rounded-lg bg-slate-950/60 px-3 py-2 text-sm">
                      <span className="text-slate-200">Module {a.num}: {a.title}</span>
                      <span className="ml-2 text-xs text-slate-500">{a.hours}h · {a.videos} videos · from “{a.course}”</span>
                      <div className="mt-0.5 text-[11px] text-slate-500">{a.skills.join(" · ")}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {w.project && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Project · ~{w.project.hours}h</p>
                <p className="mt-1 rounded-lg bg-slate-950/60 px-3 py-2 text-sm text-slate-200">{w.project.title}</p>
              </div>
            )}

            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Live sync</p>
              <ul className="mt-1 space-y-1">
                {w.sync.map((s, i) => (
                  <li key={i} className="text-sm text-slate-300">• {s.title} <span className="text-xs text-slate-500">({s.hours}h)</span></li>
                ))}
              </ul>
            </div>

            {w.masterclass && <p className="mt-2 text-sm text-fuchsia-300">★ {w.masterclass.title} <span className="text-xs text-slate-500">({w.masterclass.hours}h)</span></p>}
            {w.assessment && <p className="mt-2 text-sm text-slate-300">✦ {w.assessment.title}</p>}

            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-emerald-300">
              📦 Deliverable: <span className="text-slate-200">{w.deliverable}</span>
            </p>

            {w.addons?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {w.addons.map((a, i) => (
                  <button key={i} className="chip border border-dashed border-slate-600 bg-slate-900 text-slate-300 hover:border-brand-500" title="Add-on — coming soon">
                    {a.kind === "coach" ? "🧑‍🏫" : a.kind === "resume" ? "📄" : "🎤"} {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
