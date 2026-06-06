"use client";
import { useMemo, useState } from "react";
import modules from "../data/modules.json";
import { buildWeekPlan, clustersFor, skillsByCluster } from "../lib/engine";
import WeekPlan from "./WeekPlan";
import ValueModel from "./ValueModel";

const TIMELINES = [["3", "3 months", 13], ["6", "6 months", 26], ["12", "12 months", 52]];

export default function JourneyPlanner({ journey, view }) {
  const [hpw, setHpw] = useState(10);
  const [timeline, setTimeline] = useState("6");
  const [known, setKnown] = useState([]);
  const [knownSkills, setKnownSkills] = useState([]);
  const clusters = useMemo(() => clustersFor(journey.skills).slice(0, 8), [journey]);
  const clusterSkills = useMemo(() => Object.fromEntries(skillsByCluster(journey.skills)), [journey]);
  const maxWeeks = TIMELINES.find(([v]) => v === timeline)[2];

  const plan = useMemo(
    () => buildWeekPlan(journey.skills, modules, { knownClusters: known, knownSkills, hoursPerWeek: hpw, roleName: journey.role, maxWeeks }),
    [journey, hpw, known, knownSkills, maxWeeks]
  );

  function toggleKnown(cl) {
    setKnown((k) => (k.includes(cl) ? k.filter((x) => x !== cl) : [...k, cl]));
  }
  function toggleSkill(s) {
    setKnownSkills((k) => (k.includes(s) ? k.filter((x) => x !== s) : [...k, s]));
  }

  const counts = useMemo(() => plan && ({
    modules: plan.moduleCount, asyncPct: plan.blend.async,
    sync: plan.weeks.reduce((a, w) => a + (w.sync || []).length, 0),
    masterclasses: plan.weeks.filter((w) => w.masterclass).length,
    capstoneWeeks: plan.weeks.filter((w) => w.type === "capstone").length,
  }), [plan]);

  return (
    <div>
      <div className="mt-8">
        <ValueModel audience={view === "university" ? "university" : "learner"} counts={counts} toggle />
      </div>
      <div className="card mt-4 p-5">
        <h2 className="text-lg font-bold text-white">Personalize this journey</h2>
        <p className="mt-1 text-sm text-slate-400">The plan below recomputes live — module by module, week by week.</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="text-sm text-slate-300">Job-ready in:</label>
          {TIMELINES.map(([v, l]) => (
            <button key={v} onClick={() => { setTimeline(v); setHpw(v === "3" ? 15 : v === "12" ? 5 : 10); }}
              className={`btn text-sm ${timeline === v ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="text-sm text-slate-300">Hours/week:</label>
          {[5, 10, 15].map((h) => (
            <button key={h} onClick={() => setHpw(h)}
              className={`btn text-sm ${hpw === h ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>
              {h} hrs
            </button>
          ))}
          {plan && (
            <span className={`text-xs ${plan.totalWeeks > maxWeeks ? "text-amber-400" : "text-emerald-400"}`}>
              {plan.totalWeeks > maxWeeks
                ? `⚠ ${plan.totalWeeks} weeks at this pace — exceeds your ${timeline}-month target. Increase hrs/week or mark known skills.`
                : `✓ ${plan.totalWeeks} weeks · fits your ${timeline}-month target`}
            </span>
          )}
        </div>
        <p className="mt-4 text-sm text-slate-300">What do you already know? Tick a whole area, or individual skills for sharper mapping:</p>
        <div className="mt-2 space-y-2">
          {clusters.map(([cl]) => {
            const sks = (clusterSkills[cl] || []).slice(0, 6);
            const label = cl === "General Professional" ? "General & Workplace Skills" : cl;
            return (
              <div key={cl} className="rounded-lg bg-slate-950/50 px-3 py-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button onClick={() => toggleKnown(cl)}
                    className={`chip border font-semibold transition ${known.includes(cl) ? "border-emerald-500 bg-emerald-900/50 text-emerald-300" : "border-slate-600 bg-slate-900 text-slate-200 hover:border-brand-500"}`}>
                    {known.includes(cl) ? "✓ " : ""}{label}
                  </button>
                  <span className="mx-1 text-[10px] uppercase tracking-wider text-slate-600">or just:</span>
                  {sks.map((s) => (
                    <button key={s} onClick={() => toggleSkill(s)} disabled={known.includes(cl)}
                      className={`chip border transition disabled:opacity-30 ${knownSkills.includes(s) ? "border-emerald-500 bg-emerald-900/40 text-emerald-300" : "border-slate-700/70 bg-slate-900/70 text-slate-400 hover:border-brand-500"}`}>
                      {knownSkills.includes(s) ? "✓ " : ""}{s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {plan
        ? <WeekPlan plan={plan} planKey={journey.slug} />
        : <p className="mt-8 text-amber-400">You&apos;ve marked everything as known — try unticking a cluster.</p>}
    </div>
  );
}
