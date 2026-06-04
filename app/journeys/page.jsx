import Link from "next/link";
import journeys from "../../data/journeys.json";

export const metadata = { title: "Career Journeys — PathFinder AI" };

const ORDER = ["Core AI Engineering", "Data Careers", "Product, Strategy & Governance", "Security", "AI-Augmented Business Functions", "Emerging & Specialist"];
const BUCKET_DESC = {
  "Core AI Engineering": "Build, deploy and scale AI systems — the deepest technical tracks.",
  "Data Careers": "The pipelines and analysis layer every AI initiative depends on.",
  "Product, Strategy & Governance": "Lead AI products, decisions and responsible adoption.",
  "Security": "Defend AI systems and use AI to defend everything else.",
  "AI-Augmented Business Functions": "Domain experts who multiply their output with AI.",
  "Emerging & Specialist": "New-collar roles born entirely in the AI era.",
};

export default function Journeys() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">AI-Era Career Journeys</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            {journeys.length} roles selected for future demand (WEF 2025, LinkedIn 2026, NASSCOM), bucketed by career family.
            Every journey is a dynamic, module-level, week-by-week plan — personalized to your skills and pace.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/diagnostic" className="btn-primary">Find my path →</Link>
          <Link href="/compare" className="btn-ghost">Compare roles</Link>
        </div>
      </div>

      {ORDER.map((bucket) => {
        const list = journeys.filter((j) => j.bucket === bucket);
        if (!list.length) return null;
        return (
          <section key={bucket} className="mt-10">
            <h2 className="text-xl font-bold text-white">{bucket}</h2>
            <p className="mt-1 text-sm text-slate-500">{BUCKET_DESC[bucket]}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((j) => (
                <Link key={j.slug} href={`/journeys/${j.slug}`} className="card group flex flex-col p-5 transition hover:border-brand-500">
                  <h3 className="font-bold text-white group-hover:text-brand-300">{j.role}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{j.persona}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="chip bg-slate-800 text-slate-300">{j.weeks} wks default</span>
                    <span className={`chip ${j.readiness >= 80 ? "bg-emerald-900/60 text-emerald-300" : "bg-amber-900/60 text-amber-300"}`}>{j.readiness}% ready</span>
                  </div>
                  {j.salary && (
                    <p className="mt-3 text-xs text-slate-400">💰 <span className="text-emerald-300">{j.salary.india}</span> · {j.salary.global}</p>
                  )}
                  {j.salary?.growth && <p className="mt-1 text-[11px] text-slate-500">📈 {j.salary.growth}</p>}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
