import Link from "next/link";
import journeys from "../../../data/journeys.json";
import JourneyPlanner from "../../../components/JourneyPlanner";

export function generateStaticParams() {
  return journeys.map((j) => ({ slug: j.slug }));
}
export function generateMetadata({ params }) {
  const j = journeys.find((x) => x.slug === params.slug);
  return { title: `${j ? j.role : "Journey"} — PathFinder AI` };
}

export default function Journey({ params }) {
  const j = journeys.find((x) => x.slug === params.slug);
  if (!j) return <p>Not found.</p>;
  return (
    <div>
      <Link href="/journeys" className="text-sm text-brand-400">← All journeys</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">{j.bucket}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">{j.role}</h1>
          <p className="mt-2 max-w-2xl text-slate-400">{j.persona}</p>
        </div>
        {j.salary && (
          <div className="card p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outcome</p>
            <p className="mt-1 text-emerald-300">India: {j.salary.india}</p>
            <p className="text-slate-300">Global: {j.salary.global}</p>
            <p className="mt-1 text-xs text-slate-500">📈 {j.salary.growth}</p>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/diagnostic" className="btn-primary text-sm">Take the 60-second diagnostic →</Link>
        <Link href={`/compare?roles=${j.slug}`} className="btn-ghost text-sm">Compare with another role</Link>
      </div>
      <JourneyPlanner journey={j} />
      <section className="mt-10">
        <h2 className="text-lg font-bold text-white">Content gaps we&apos;re building for this journey</h2>
        <ul className="mt-3 space-y-2">
          {j.gaps.map((g) => <li key={g} className="card border-amber-900/50 px-4 py-2.5 text-sm text-amber-200">{g}</li>)}
        </ul>
      </section>
    </div>
  );
}
