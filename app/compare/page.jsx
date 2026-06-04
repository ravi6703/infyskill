"use client";
import { useState } from "react";
import Link from "next/link";
import journeys from "../../data/journeys.json";

export default function Compare() {
  const [sel, setSel] = useState([]);
  function toggle(slug) {
    setSel((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length < 3 ? [...s, slug] : s));
  }
  const picked = sel.map((s) => journeys.find((j) => j.slug === s));
  const common = picked.length > 1
    ? picked[0].skills.filter((s) => picked.every((j) => j.skills.includes(s))).slice(0, 10)
    : [];

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Compare Journeys</h1>
      <p className="mt-2 text-slate-400">Pick up to 3 roles to compare side by side.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {journeys.map((j) => (
          <button key={j.slug} onClick={() => toggle(j.slug)}
            className={`chip border transition ${sel.includes(j.slug) ? "border-brand-500 bg-brand-900/60 text-brand-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-brand-600"}`}>
            {j.role}
          </button>
        ))}
      </div>

      {picked.length > 0 && (
        <div className={`mt-8 grid gap-4 ${picked.length === 1 ? "" : picked.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          {picked.map((j) => (
            <div key={j.slug} className="card p-5">
              <p className="text-xs uppercase tracking-widest text-brand-400">{j.bucket}</p>
              <h3 className="mt-1 font-bold text-white">{j.role}</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-400">Default duration</dt><dd className="text-white">{j.weeks} weeks</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Level</dt><dd className="text-white">{j.level}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Content readiness</dt><dd className="text-white">{j.readiness}%</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">India salary</dt><dd className="text-emerald-300">{j.salary?.india}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Global salary</dt><dd className="text-white">{j.salary?.global}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">📈 {j.salary?.growth}</p>
              <p className="mt-3 text-xs text-slate-400">{j.persona}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {j.skills.slice(0, 8).map((s) => (
                  <span key={s} className={`chip ${common.includes(s) ? "bg-emerald-900/60 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>{s}</span>
                ))}
              </div>
              <Link href={`/journeys/${j.slug}`} className="btn-primary mt-4 w-full justify-center text-sm">Open week-by-week plan →</Link>
            </div>
          ))}
        </div>
      )}
      {common.length > 0 && (
        <p className="mt-6 text-sm text-slate-400">
          <span className="text-emerald-300">Green skills</span> are shared across your picks — a pivot between these roles reuses that learning.
        </p>
      )}
    </div>
  );
}
