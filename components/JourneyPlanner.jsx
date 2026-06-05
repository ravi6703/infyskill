"use client";
import { useMemo, useState } from "react";
import modules from "../data/modules.json";
import { buildWeekPlan, clustersFor } from "../lib/engine";
import WeekPlan from "./WeekPlan";
import ValueModel from "./ValueModel";

export default function JourneyPlanner({ journey, view }) {
  const [hpw, setHpw] = useState(10);
  const [known, setKnown] = useState([]);
  const clusters = useMemo(() => clustersFor(journey.skills).slice(0, 8), [journey]);

  const plan = useMemo(
    () => buildWeekPlan(journey.skills, modules, { knownClusters: known, hoursPerWeek: hpw, roleName: journey.role }),
    [journey, hpw, known]
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
          <label className="text-sm text-slate-300">Hours/week:</label>
          {[5, 10, 15].map((h) => (
            <button key={h} onClick={() => setHpw(h)}
              className={`btn text-sm ${hpw === h ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>
              {h} hrs
            </button>
          ))}
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
