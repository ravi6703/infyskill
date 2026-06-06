import Link from "next/link";
import specs from "../../data/journeys.json";

export const metadata = { title: "Specializations — PathFinder AI" };

const ORDER = ["Core AI Engineering", "Data Careers", "Product, Strategy & Governance", "Security", "AI-Augmented Business Functions", "Emerging & Specialist"];
const DESC = {
  "Core AI Engineering": "Build, deploy and scale AI systems.",
  "Data Careers": "The data backbone every AI initiative needs.",
  "Product, Strategy & Governance": "Lead AI products and responsible adoption.",
  "Security": "Defend AI systems, and use AI to defend.",
  "AI-Augmented Business Functions": "Domain experts who multiply output with AI.",
  "Emerging & Specialist": "New-collar roles born in the AI era.",
};

export default function Specializations() {
  return (
    <div>
      <h1 className="text-3xl font-black text-ink-900">Specializations</h1>
      <p className="mt-2 max-w-3xl text-ink-500">
        {specs.length} AI-era job roles — drawn from Board Infinity&apos;s content and emerging new-age roles. Each is a complete career specialization:
        the skills you&apos;ll achieve, the blended journey, and the outcome you&apos;re prepared for.
      </p>

      {ORDER.map((bucket) => {
        const list = specs.filter((s) => s.bucket === bucket);
        if (!list.length) return null;
        return (
          <section key={bucket} className="mt-10">
            <h2 className="text-xl font-black text-ink-900">{bucket}</h2>
            <p className="mt-1 text-sm text-ink-500">{DESC[bucket]}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <Link key={s.slug} href={`/specializations/${s.slug}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-ink-900 group-hover:text-brand-600">{s.role}</h3>
                    <span className="chip-gray shrink-0">{s.level.split("→")[0]}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-500">{s.persona}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.skills.slice(0, 3).map((k) => <span key={k} className="chip-blue">{k}</span>)}
                    <span className="chip-gray">+{Math.max(0, s.skills.length - 3)} skills</span>
                  </div>
                  {s.salary && (
                    <p className="mt-3 border-t border-ink-100 pt-3 text-sm font-bold text-[#1A8B66]">{s.salary.india}</p>
                  )}
                  <span className="mt-3 text-sm font-bold text-brand-600 group-hover:underline">View specialization →</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
