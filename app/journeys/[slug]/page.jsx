import Link from "next/link";
import journeys from "../../../data/journeys.json";
import courses from "../../../data/courses.json";

export function generateStaticParams() {
  return journeys.map((j) => ({ slug: j.slug }));
}
export function generateMetadata({ params }) {
  const j = journeys.find((x) => x.slug === params.slug);
  return { title: `${j ? j.role : "Journey"} — PathFinder AI` };
}

const STATUS = {
  available: ["Available", "bg-emerald-900/60 text-emerald-300"],
  planned: ["Planned (upcoming 30)", "bg-sky-900/60 text-sky-300"],
  create: ["To create", "bg-amber-900/60 text-amber-300"],
};
const TYPE = {
  Async: "bg-brand-900/60 text-brand-300", Sync: "bg-violet-900/60 text-violet-300",
  Masterclass: "bg-fuchsia-900/60 text-fuchsia-300", Hackathon: "bg-orange-900/60 text-orange-300",
  Capstone: "bg-rose-900/60 text-rose-300", Assessment: "bg-slate-800 text-slate-300",
};
const slugOf = Object.fromEntries(courses.map((c) => [c.title, c.slug]));

export default function Journey({ params }) {
  const j = journeys.find((x) => x.slug === params.slug);
  if (!j) return <p>Not found.</p>;
  return (
    <div>
      <Link href="/journeys" className="text-sm text-brand-400">← All journeys</Link>
      <h1 className="mt-2 text-3xl font-extrabold text-white">{j.role}</h1>
      <p className="mt-2 max-w-3xl text-slate-400">{j.persona}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="chip bg-slate-800 text-slate-300">{j.weeks} weeks</span>
        <span className="chip bg-slate-800 text-slate-300">{j.level}</span>
        <span className="chip bg-emerald-900/60 text-emerald-300">{j.readiness}% async content ready</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(j.mix).map(([k, v]) => (
          <div key={k} className="card p-3 text-center">
            <div className="text-xl font-bold text-white">{v}%</div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{k.toLowerCase()}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-8">
        {j.stages.map((st, i) => (
          <section key={st.name}>
            <h2 className="text-lg font-bold text-white">
              <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-sm text-white">{i + 1}</span>
              {st.name}
            </h2>
            <div className="mt-3 space-y-2">
              {st.components.map((c, k) => {
                const [label, cls] = STATUS[c.status];
                const cslug = c.status === "available" ? slugOf[c.content] : null;
                return (
                  <div key={k} className="card flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className={`chip ${TYPE[c.type] || TYPE.Assessment}`}>{c.type}</span>
                    {cslug ? (
                      <Link href={`/course/${cslug}`} className="flex-1 text-sm text-slate-200 hover:text-brand-300">{c.content}</Link>
                    ) : (
                      <span className="flex-1 text-sm text-slate-200">{c.content}</span>
                    )}
                    <span className={`chip ${cls}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-white">Content gaps to build</h2>
        <ul className="mt-3 space-y-2">
          {j.gaps.map((g) => (
            <li key={g} className="card border-amber-900/50 px-4 py-2.5 text-sm text-amber-200">{g}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-white">Skills this journey builds</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {j.skills.map((s) => <span key={s} className="chip bg-slate-800 text-slate-300">{s}</span>)}
        </div>
      </section>
    </div>
  );
}
