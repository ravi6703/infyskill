import Link from "next/link";
import degrees from "../../data/degrees_bi.json";

export const metadata = { title: "Degree Programs — InfyAI" };

export default function Degrees() {
  return (
    <div>
      <h1 className="text-3xl font-black text-ink-900">Board Infinity Degree Programs</h1>
      <p className="mt-2 max-w-3xl text-ink-500">
        Not a university syllabus retro-fitted — these are Board Infinity&apos;s own best-of-best programs, designed from our content library and
        delivered through the blended model. Each shows the journey, the roles you graduate into, and how it out-performs a standard university degree.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {degrees.map((d) => (
          <Link key={d.slug} href={`/degrees/${d.slug}`} className="card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="chip-peel">{d.level}</span>
                <h2 className="mt-2 text-xl font-black text-ink-900 group-hover:text-brand-600">{d.name}</h2>
                <p className="mt-1 text-sm text-ink-500">{d.tagline}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-ink-700">{d.duration}</p>
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Graduate into</p>
              <p className="mt-1 text-sm text-ink-700">{d.roles.length} AI-era roles</p>
            </div>
            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded">
              <div className="bg-brand-500" style={{ width: `${d.delivery.async}%` }} title={`Async ${d.delivery.async}%`} />
              <div className="bg-peel-500" style={{ width: `${d.delivery.sync}%` }} title={`Sync ${d.delivery.sync}%`} />
              <div className="bg-flame-500" style={{ width: `${d.delivery.masterclass}%` }} />
              <div className="bg-rose-500" style={{ width: `${d.delivery.hackathon}%` }} />
              <div className="bg-brand-300" style={{ width: `${d.delivery.capstone}%` }} />
            </div>
            <span className="mt-4 text-sm font-bold text-brand-600 group-hover:underline">View program →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
