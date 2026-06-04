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
              {list.map((j) => {
                return (
                  <Link key={j.slug} href={`/journeys/${j.slug}`} className="card group flex flex-col p-5 transition hover:border-brand-500 hover:shadow-lg hover:shadow-brand-950">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white group-hover:text-brand-300">{j.role}</h3>
                      <span className="chip shrink-0 bg-slate-800 text-slate-300">{j.level.split("→")[0]}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{j.persona}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {j.skills.slice(0, 4).map((s) => <span key={s} className="chip bg-brand-950 text-brand-300">{s}</span>)}
                      <span className="chip bg-slate-800/60 text-slate-500">+{Math.max(0, j.skills.length - 4)} skills</span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-800 py-2.5 text-center">
                      <div><p className="text-sm font-bold text-white">{j.weeks} wks</p><p className="text-[10px] text-slate-500">@10 hrs/week</p></div>
                      <div><p className="text-sm font-bold text-white">{Math.round(j.weeks * 10)}h</p><p className="text-[10px] text-slate-500">total effort</p></div>
                      <div><p className="text-sm font-bold text-emerald-300">{(j.salary?.india || "").split("–")[0] || "—"}+</p><p className="text-[10px] text-slate-500">entry (India)</p></div>
                    </div>

                    <p className="mt-2.5 text-[11px] text-slate-400" title="What's inside every journey">
                      ▶ Self-paced modules · 🎙 2 live labs/wk · ★ Masterclasses · 🏆 Hackathon · 🎓 Coached capstone
                    </p>
                    {j.salary?.growth && <p className="mt-1.5 text-[11px] text-amber-300/90">📈 {j.salary.growth}</p>}

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-[11px] text-slate-500">Self-paced free · <span className="text-slate-300">founding cohort opening</span></span>
                      <span className="text-xs font-semibold text-brand-400 group-hover:underline">Week-by-week plan →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
