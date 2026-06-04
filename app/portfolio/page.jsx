"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import journeys from "../../data/journeys.json";

export default function Portfolio() {
  const [active, setActive] = useState(null);
  const [name, setName] = useState("");
  useEffect(() => {
    try {
      setActive(JSON.parse(localStorage.getItem("pf_active_plan") || "null"));
      setName(localStorage.getItem("pf_name") || "");
    } catch {}
  }, []);
  const journey = active && journeys.find((j) => active.key.includes(j.slug));
  const items = active?.deliverables || [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-3xl font-extrabold text-white">My Portfolio</h1>
        <button onClick={() => window.print()} className="btn-ghost text-xs">🖨 Print / save PDF</button>
      </div>
      <p className="mt-2 text-slate-400 print:hidden">Auto-generated from your completed weekly deliverables — every checked week adds verifiable evidence here.</p>

      <div className="card mt-6 p-6">
        <p className="text-2xl font-bold text-white">{name || "Your Name"}</p>
        <p className="mt-1 text-brand-300">{journey ? `${journey.role} — in training` : "PathFinder AI learner"}</p>
        {journey && <p className="mt-1 text-xs text-slate-500">Target: {journey.salary?.india} (India) · Skills: {journey.skills.slice(0, 8).join(", ")}</p>}
        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-slate-400">Project & deliverable evidence ({items.length})</h2>
        {items.length === 0
          ? <p className="mt-3 text-sm text-slate-500">Nothing yet — complete weeks in your journey to populate this portfolio. <Link href="/dashboard" className="text-brand-400">Go to dashboard →</Link></p>
          : (
            <ul className="mt-3 space-y-2">
              {items.map((d, i) => (
                <li key={i} className="rounded-lg bg-slate-950/60 px-4 py-3 text-sm text-slate-200">✅ {d}</li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
