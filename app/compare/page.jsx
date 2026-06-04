"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import journeys from "../../data/journeys.json";
import modules from "../../data/modules.json";
import { buildWeekPlan, clustersFor } from "../../lib/engine";
import { WeeklyLoadChart } from "../../components/PlanCharts";

const COLORS = ["#818cf8", "#34d399", "#fb923c"];

function MultiRadar({ roles }) {
  const allClusters = [...new Set(roles.flatMap((r) => r.clusters.map(([c]) => c)))].slice(0, 8);
  if (allClusters.length < 3) return null;
  const size = 360, cx = size / 2, cy = size / 2, R = size * 0.34, N = allClusters.length;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [cx + Math.cos(a) * R * (v / 100), cy + Math.sin(a) * R * (v / 100)];
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-md">
      {[33, 66, 100].map((r) => (
        <polygon key={r} points={allClusters.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke="#1e293b" />
      ))}
      {roles.map((r, ri) => {
        const max = Math.max(...r.clusters.map(([, w]) => w), 1);
        const vals = allClusters.map((c) => {
          const f = r.clusters.find(([cc]) => cc === c);
          return f ? (f[1] / max) * 100 : 0;
        });
        return <polygon key={ri} points={vals.map((v, i) => pt(i, v).join(",")).join(" ")}
          fill={COLORS[ri] + "22"} stroke={COLORS[ri]} strokeWidth="2" />;
      })}
      {allClusters.map((c, i) => {
        const [x, y] = pt(i, 120);
        return <text key={c} x={x} y={y} textAnchor="middle" fontSize="10" fill="#94a3b8">{c.length > 16 ? c.slice(0, 15) + "…" : c}</text>;
      })}
    </svg>
  );
}

export default function Compare() {
  const [sel, setSel] = useState([]);
  function toggle(slug) {
    setSel((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length < 3 ? [...s, slug] : s));
  }

  const picked = useMemo(() => sel.map((s) => {
    const j = journeys.find((x) => x.slug === s);
    const plan = buildWeekPlan(j.skills, modules, { hoursPerWeek: 10, roleName: j.role });
    return { ...j, plan, clusters: clustersFor(j.skills).slice(0, 8) };
  }), [sel]);

  // pivot analysis: weeks for role B if you've completed role A
  const pivot = useMemo(() => {
    if (picked.length !== 2) return null;
    const [a, b] = picked;
    const aClusters = a.clusters.slice(0, 4).map(([c]) => c);
    const bGivenA = buildWeekPlan(b.skills, modules, { hoursPerWeek: 10, knownClusters: aClusters, roleName: b.role });
    const aGivenB = buildWeekPlan(a.skills, modules, { hoursPerWeek: 10, knownClusters: b.clusters.slice(0, 4).map(([c]) => c), roleName: a.role });
    return {
      aToB: bGivenA ? b.plan.totalWeeks - bGivenA.totalWeeks : 0,
      bToA: aGivenB ? a.plan.totalWeeks - aGivenB.totalWeeks : 0,
    };
  }, [picked]);

  const common = picked.length > 1 ? picked[0].skills.filter((s) => picked.every((j) => j.skills.includes(s))).slice(0, 12) : [];

  const ROWS = [
    ["Career family", (j) => j.bucket],
    ["Personalized duration (10 h/wk)", (j) => `${j.plan?.totalWeeks ?? j.weeks} weeks`],
    ["Total effort", (j) => `${j.plan?.totalHours ?? "—"} hours`],
    ["Modules · courses drawn from", (j) => j.plan ? `${j.plan.moduleCount} · ${j.plan.courseCount}` : "—"],
    ["Level", (j) => j.level],
    ["Content readiness", (j) => `${j.readiness}%`],
    ["India salary", (j) => j.salary?.india, "text-emerald-300"],
    ["Global salary", (j) => j.salary?.global],
    ["Demand signal", (j) => j.salary?.growth, "text-slate-400 text-xs"],
    ["Hackathons + capstone weeks", (j) => j.plan ? `${j.plan.weeks.filter((w) => w.type !== "content").length} project weeks` : "—"],
    ["Live sessions across journey", (j) => j.plan ? `${j.plan.weeks.reduce((a, w) => a + w.sync.length, 0)} sessions` : "—"],
    ["Masterclasses", (j) => j.plan ? `${j.plan.weeks.filter((w) => w.masterclass).length}` : "—"],
    ["Indicative cost (Pro, full journey)", (j) => j.plan ? `₹${Math.round(j.plan.totalWeeks / 4.33 * 4999).toLocaleString("en-IN")}` : "—", "text-amber-300"],
    ["Async / Live / Project blend", (j) => j.plan ? `${j.plan.blend.async}% / ${j.plan.blend.sync}% / ${j.plan.blend.project}%` : "—"],
    ["Best entry profile", (j) => j.persona, "text-slate-400 text-xs"],
  ];

  function chooseHint() {
    if (picked.length < 2) return null;
    const byWeeks = [...picked].sort((a, b) => (a.plan?.totalWeeks || 99) - (b.plan?.totalWeeks || 99));
    const bySalary = [...picked].sort((a, b) => parseFloat((b.salary?.india || "0").replace(/[^\d–-]/g, "").split(/[–-]/)[1] || 0) - parseFloat((a.salary?.india || "0").replace(/[^\d–-]/g, "").split(/[–-]/)[1] || 0));
    const easiest = [...picked].sort((a, b) => (a.level.startsWith("Beg") ? 0 : 1) - (b.level.startsWith("Beg") ? 0 : 1))[0];
    return { fastest: byWeeks[0], highestCeiling: bySalary[0], easiest };
  }
  const hint = chooseHint();

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Compare Journeys</h1>
      <p className="mt-2 text-slate-400">Pick up to 3 roles — full plans are computed live for an apples-to-apples comparison at 10 hrs/week.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {journeys.map((j) => (
          <button key={j.slug} onClick={() => toggle(j.slug)}
            className={`chip border transition ${sel.includes(j.slug) ? "border-brand-500 bg-brand-900/60 text-brand-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-brand-600"}`}>
            {j.role}
          </button>
        ))}
      </div>

      {picked.length >= 2 && (
        <div className="card mt-8 p-5">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Skill-cluster footprint overlay</p>
          <MultiRadar roles={picked} />
          <div className="mt-2 flex justify-center gap-4 text-xs">
            {picked.map((j, i) => <span key={j.slug} style={{ color: COLORS[i] }}>■ {j.role}</span>)}
          </div>
        </div>
      )}

      {picked.length > 0 && (
        <div className="card mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-slate-500">Dimension</th>
                {picked.map((j, i) => (
                  <th key={j.slug} className="px-4 py-3 text-left">
                    <span style={{ color: COLORS[i] }}>{j.role}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, fn, cls]) => (
                <tr key={label} className="border-b border-slate-800/60">
                  <td className="px-4 py-2.5 text-xs text-slate-500">{label}</td>
                  {picked.map((j) => <td key={j.slug} className={`px-4 py-2.5 ${cls || "text-slate-200"}`}>{fn(j)}</td>)}
                </tr>
              ))}
              <tr>
                <td className="px-4 py-3" />
                {picked.map((j) => (
                  <td key={j.slug} className="px-4 py-3">
                    <Link href={`/journeys/${j.slug}`} className="btn-primary text-xs">Open plan →</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {hint && (
        <div className="card mt-6 border-brand-700 p-5">
          <h2 className="text-lg font-bold text-white">🧭 Which should you choose?</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-lg bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Fastest to job-ready</p>
              <p className="mt-1 font-bold text-white">{hint.fastest.role}</p>
              <p className="text-xs text-slate-400">{hint.fastest.plan?.totalWeeks} weeks at 10 h/wk</p>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Highest salary ceiling</p>
              <p className="mt-1 font-bold text-white">{hint.highestCeiling.role}</p>
              <p className="text-xs text-emerald-300">{hint.highestCeiling.salary?.india}</p>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Easiest entry</p>
              <p className="mt-1 font-bold text-white">{hint.easiest.role}</p>
              <p className="text-xs text-slate-400">{hint.easiest.level}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Rule-of-thumb guidance from the live plans — take the diagnostic for a personal recommendation.</p>
        </div>
      )}

      {picked.length >= 2 && (
        <div className={`mt-6 grid gap-4 ${picked.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
          {picked.map((j, i) => (
            <div key={j.slug} className="card p-4">
              <p className="text-sm font-bold" style={{ color: COLORS[i] }}>{j.role}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Weekly load across the journey</p>
              {j.plan && <WeeklyLoadChart weeks={j.plan.weeks} hoursPerWeek={10} />}
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">First 3 weeks — what you&apos;d actually study</p>
              <ul className="mt-1 space-y-1">
                {(j.plan?.weeks || []).slice(0, 3).map((w) => (
                  <li key={w.n} className="rounded bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300">
                    W{w.n}: {w.theme} <span className="text-slate-500">— {w.async.map((a) => a.title).slice(0, 2).join("; ")}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Skills unique to this role (vs your other picks)</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {j.skills.filter((s) => !picked.some((o) => o.slug !== j.slug && o.skills.includes(s))).slice(0, 8).map((s) => (
                  <span key={s} className="chip bg-slate-800 text-slate-300">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pivot && (
        <div className="card mt-6 border-emerald-900/60 p-5">
          <h2 className="text-lg font-bold text-white">↔ Career-pivot analysis</h2>
          <p className="mt-1 text-sm text-slate-400">Because skills overlap, completing one journey shortens the other:</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-950/60 p-4 text-sm">
              <p className="text-slate-300">{picked[0].role} → {picked[1].role}</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">{pivot.aToB > 0 ? `${pivot.aToB} weeks saved` : "full journey"}</p>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-4 text-sm">
              <p className="text-slate-300">{picked[1].role} → {picked[0].role}</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">{pivot.bToA > 0 ? `${pivot.bToA} weeks saved` : "full journey"}</p>
            </div>
          </div>
          {common.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Shared skills powering the pivot</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {common.map((s) => <span key={s} className="chip bg-emerald-900/60 text-emerald-300">{s}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
