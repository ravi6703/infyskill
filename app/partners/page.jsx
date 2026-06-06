import Link from "next/link";
import degrees from "../../data/degrees.json";

export const metadata = { title: "University Partner Dashboard — InfyAI" };

export default function Partners() {
  const sorted = [...degrees].sort((a, b) => b.coverage_pct - a.coverage_pct);
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-extrabold text-white">University Partner Dashboard</h1>
        <span className="chip bg-amber-900/60 text-amber-300">preview</span>
      </div>
      <p className="mt-2 max-w-3xl text-slate-400">
        What a partner university sees: program coverage, semester overlays, cohort engagement and employability mapping —
        the operating dashboard for the NEP 2020 40% online-credit partnership.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[["9", "programs analyzed"], ["68%", "avg. library coverage"], ["26", "role journeys mapped"], ["3,778h", "deliverable content"]].map(([v, l]) => (
          <div key={l} className="card p-5 text-center">
            <div className="text-3xl font-extrabold text-white">{v}</div>
            <div className="mt-1 text-xs text-slate-400">{l}</div>
          </div>
        ))}
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold text-white">Program coverage</h2>
        <div className="mt-4 space-y-3">
          {sorted.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="w-72 shrink-0 truncate text-sm text-slate-300">{d.name}</span>
              <div className="h-3 flex-1 overflow-hidden rounded bg-slate-800">
                <div className={`h-full ${d.coverage_pct >= 70 ? "bg-emerald-500" : d.coverage_pct >= 55 ? "bg-brand-500" : "bg-amber-500"}`} style={{ width: `${d.coverage_pct}%` }} />
              </div>
              <span className="w-12 text-right text-sm font-bold text-white">{d.coverage_pct}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Coverage = subjects deliverable from the tagged library. Gaps stay with faculty (theory, math, law) — by design.</p>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold text-white">Cohort engagement (demo data)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[["BCA Sem 5 · 240 students", "78% weekly active", "12 capstones submitted"], ["MBA-Fin Sem 3 · 120 students", "84% weekly active", "Hackathon this Saturday"], ["B.Sc DS Sem 4 · 95 students", "71% weekly active", "Checkpoint 2 in progress"]].map(([c, a, n]) => (
            <div key={c} className="rounded-lg bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-white">{c}</p>
              <p className="mt-1 text-xs text-emerald-400">{a}</p>
              <p className="mt-1 text-xs text-slate-400">{n}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="card mt-6 border-brand-700 p-6 text-center">
        <h2 className="text-lg font-bold text-white">Run your curriculum through the engine</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-slate-400">Upload any semester or degree structure and get the coverage report + module-level embed plan in minutes.</p>
        <Link href="/university" className="btn-primary mt-4 inline-flex">Open curriculum mapper →</Link>
      </div>
    </div>
  );
}
