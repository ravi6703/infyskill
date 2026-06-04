"use client";
import { useMemo, useState } from "react";
import journeys from "../../data/journeys.json";
import modules from "../../data/modules.json";
import { buildWeekPlan, clustersFor } from "../../lib/engine";
import WeekPlan from "../../components/WeekPlan";
import { sbInsert } from "../../lib/supabase";

const LEVELS = ["New to this", "Basics", "Comfortable", "Strong"];

export default function Diagnostic() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [ratings, setRatings] = useState({});
  const [hpw, setHpw] = useState(10);
  const [goal, setGoal] = useState("switch");

  const journey = journeys.find((j) => j.slug === role);
  const clusters = useMemo(() => (journey ? clustersFor(journey.skills).slice(0, 7) : []), [journey]);

  const plan = useMemo(() => {
    if (step !== 3 || !journey) return null;
    const known = clusters.filter(([cl]) => (ratings[cl] || 0) >= 2).map(([cl]) => cl);
    return buildWeekPlan(journey.skills, modules, { knownClusters: known, hoursPerWeek: hpw, roleName: journey.role });
  }, [step, journey, ratings, hpw, clusters]);

  function finish() {
    setStep(3);
    if (journey) {
      sbInsert("pf_analyses", {
        kind: "jd", input_title: `Diagnostic: ${journey.role}`,
        input_text: JSON.stringify({ role, ratings, hpw, goal }),
        result: { type: "diagnostic", role: journey.role, hpw },
      }).catch(() => {});
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-extrabold text-white">Find your path <span className="text-brand-400">in 60 seconds</span></h1>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded ${step >= s ? "bg-brand-500" : "bg-slate-800"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white">1 · Which AI-era role do you want?</h2>
          <p className="mt-1 text-sm text-slate-400">Not sure? Pick the closest — you can compare later.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {journeys.map((j) => (
              <button key={j.slug} onClick={() => { setRole(j.slug); setStep(2); }}
                className={`card p-3 text-left text-sm transition hover:border-brand-500 ${role === j.slug ? "border-brand-500" : ""}`}>
                <span className="font-semibold text-white">{j.role}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{j.bucket} · {j.salary?.india}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && journey && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white">2 · Quick self-assessment for {journey.role}</h2>
          <p className="mt-1 text-sm text-slate-400">Rate yourself honestly — “Comfortable” or above means we skip those modules.</p>
          <div className="mt-4 space-y-3">
            {clusters.map(([cl]) => (
              <div key={cl} className="card flex flex-wrap items-center gap-3 p-3">
                <span className="flex-1 text-sm font-semibold text-slate-200">{cl}</span>
                <div className="flex gap-1">
                  {LEVELS.map((l, i) => (
                    <button key={l} onClick={() => setRatings((r) => ({ ...r, [cl]: i }))}
                      className={`rounded px-2 py-1 text-[11px] transition ${(ratings[cl] ?? -1) === i ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="text-sm text-slate-300">Time you can give:</span>
            {[5, 10, 15].map((h) => (
              <button key={h} onClick={() => setHpw(h)} className={`btn text-sm ${hpw === h ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>{h} hrs/week</button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="text-sm text-slate-300">Your goal:</span>
            {[["switch", "Switch career"], ["upskill", "Upskill in current role"], ["first-job", "First job"]].map(([v, l]) => (
              <button key={v} onClick={() => setGoal(v)} className={`btn text-sm ${goal === v ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>{l}</button>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
            <button onClick={finish} className="btn-primary">Generate my journey →</button>
          </div>
        </div>
      )}

      {step === 3 && journey && (
        <div className="mt-8">
          <h2 className="text-2xl font-extrabold text-white">Your personalized {journey.role} journey</h2>
          <p className="mt-1 text-sm text-slate-400">
            Built from your self-assessment: modules you already know are skipped; pace set to {hpw} hrs/week.
            {journey.salary && <> Outcome: <span className="text-emerald-300">{journey.salary.india}</span> (India) · {journey.salary.global} (global).</>}
          </p>
          {plan ? <WeekPlan plan={plan} planKey={`diag-${journey.slug}`} /> : <p className="mt-6 animate-pulse text-slate-500">Composing…</p>}
          <button onClick={() => setStep(2)} className="btn-ghost mt-6">← Adjust my answers</button>
        </div>
      )}
    </div>
  );
}
