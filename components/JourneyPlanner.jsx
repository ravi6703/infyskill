"use client";
import { useMemo, useState } from "react";
import modules from "../data/modules.json";
import { buildWeekPlan, clustersFor } from "../lib/engine";
import WeekPlan from "./WeekPlan";
import ValueModel from "./ValueModel";

const TIMELINES = [["3", "3 months", 13], ["6", "6 months", 26], ["12", "12 months", 52]];

export default function JourneyPlanner({ journey, view }) {
  const [hpw, setHpw] = useState(10);
  const [timeline, setTimeline] = useState("6");
  const [known, setKnown] = useState([]);
  const clusters = useMemo(() => clustersFor(journey.skills).slice(0, 8), [journey]);
  const maxWeeks = TIMELINES.find(([v]) => v === timeline)[2];

  const plan = useMemo(
    () => buildWeekPlan(journey.skills, modules, { knownClusters: known, hoursPerWeek: hpw, roleName: journey.role, maxWeeks }),
    [journey, hpw, known, maxWeeks]
  );

  function toggleKnown(cl) {
    setKnown((k) => (k.includes(cl) ? k.filter((x) => x !== cl) : [...k, cl]));
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
        <p className="mt-4 text-sm text-slate-300">Skills you already have (we&apos;ll skip those modules):</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {clusters.map(([cl]) => (
            <button key={cl} onClick={() => toggleKnown(cl)}
              className={`chip border transition ${known.includes(cl) ? "border-emerald-500 bg-emerald-900/50 text-emerald-300" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-brand-500"}`}>
              {known.includes(cl) ? "✓ " : ""}{cl}
            </button>
          ))}
        </div>
      </div>

      {plan
        ? <WeekPlan plan={plan} planKey={journey.slug} />
        : <p className="mt-8 text-amber-400">You&apos;ve marked everything as known — try unticking a cluster.</p>}
    </div>
  );
}
