import Link from "next/link";
import journeys from "../../data/journeys.json";

export const metadata = { title: "Career Journeys — PathFinder AI" };

export default function Journeys() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">AI-Era Career Journeys</h1>
      <p className="mt-2 max-w-3xl text-slate-400">
        {journeys.length} job roles selected for future demand (WEF 2025, LinkedIn 2026, NASSCOM). Each journey blends async courses,
        live sessions, masterclasses, hackathons and a capstone. Readiness = share of async content already recorded.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {journeys.map((j) => (
          <Link key={j.slug} href={`/journeys/${j.slug}`} className="card group flex flex-col p-5 transition hover:border-brand-500">
            <h3 className="font-bold text-white group-hover:text-brand-300">{j.role}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">{j.persona}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="chip bg-slate-800 text-slate-300">{j.weeks} weeks</span>
              <span className="chip bg-slate-800 text-slate-300">{j.level}</span>
              <span className={`chip ${j.readiness >= 80 ? "bg-emerald-900/60 text-emerald-300" : "bg-amber-900/60 text-amber-300"}`}>
                {j.readiness}% content ready
              </span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded bg-slate-800">
              <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${j.readiness}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
