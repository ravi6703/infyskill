import Link from "next/link";
import degrees from "../../../data/degrees_bi.json";
import specs from "../../../data/journeys.json";
import DegreeTerms from "./DegreeTerms";

export function generateStaticParams() {
  return degrees.map((d) => ({ slug: d.slug }));
}
export function generateMetadata({ params }) {
  const d = degrees.find((x) => x.slug === params.slug);
  return { title: `${d ? d.name : "Degree"} — InfyAI` };
}

const PILLARS = [["async", "▶ Async", "border-t-brand-500"], ["sync", "🎙 Live sync", "border-t-peel-500"], ["masterclass", "★ Masterclass", "border-t-flame-500"], ["hackathon", "🏆 Hackathon", "border-t-rose-500"], ["capstone", "🎓 Capstone", "border-t-brand-400"]];

export default function Degree({ params }) {
  const d = degrees.find((x) => x.slug === params.slug);
  if (!d) return <p>Not found.</p>;
  const roleObjs = d.roles.map((r) => specs.find((s) => s.slug === r)).filter(Boolean);

  return (
    <div>
      <Link href="/degrees" className="text-sm font-bold text-brand-600">← All degree programs</Link>

      <div className="relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
        <span className="chip bg-white/15 text-white">{d.level} · {d.duration}</span>
        <h1 className="mt-2 text-3xl font-black text-white">{d.name}</h1>
        <p className="mt-2 max-w-2xl text-brand-50">{d.tagline}</p>
        <svg className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-20" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="55" stroke="white" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="100" cy="20" r="6" fill="white" /><circle cx="180" cy="100" r="6" fill="white" /><circle cx="100" cy="180" r="6" fill="white" />
        </svg>
      </div>

      {/* regulatory alignment */}
      {d.regulatory && (
        <section className="mt-8">
          <h2 className="text-xl font-black text-ink-900">Regulatory alignment</h2>
          <p className="mt-1 text-sm text-ink-500">Designed to the published norms of {d.regulatory.regulators.join(" + ")}. {d.regulatory.note}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {d.regulatory.regulators.map((r) => (<span key={r} className="chip border border-brand-200 bg-brand-50 text-brand-700">{r}</span>))}
            <span className="chip bg-ink-100 text-ink-700">NHEQF Level {d.regulatory.nheqfFinal}</span>
            <span className="chip bg-ink-100 text-ink-700">{d.credits.target} credits</span>
            <span className="chip-green">✓ {d.regulatory.award}</span>
          </div>
          <p className="mt-4 text-xs text-ink-400">Each box is an AICTE-required course category — tap one to see the AI-focused courses it covers.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {d.regulatory.categories.map((c) => (
              <details key={c.code} className="group rounded-xl border border-ink-200 bg-white p-3 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink-800">{c.label || c.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink-500">{c.name}{c.min ? (<> · min {c.min} cr {c.credits >= c.min ? <span className="font-bold text-teal-600">✓</span> : null}</>) : null}</p>
                    {c.desc && <p className="mt-1 text-[10px] italic leading-snug text-ink-400">{c.desc}</p>}
                  </div>
                  <span className="flex shrink-0 items-center gap-1"><span className="text-lg font-black text-brand-600">{c.credits}</span><span className="text-[10px] text-ink-400 transition group-open:rotate-180">▼</span></span>
                </summary>
                {c.covers?.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-ink-100 pt-2">
                    {c.covers.map((n, i) => (<li key={i} className="flex gap-1.5 text-[11px] leading-snug text-ink-600"><span className="text-brand-400">•</span><span>{n}</span></li>))}
                  </ul>
                )}
              </details>
            ))}
          </div>
          {d.regulatory.exits?.length > 1 && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Multiple entry / exit (NEP)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {d.regulatory.exits.map((e, i) => (
                  <div key={i} className="rounded-xl border border-ink-200 bg-white px-3 py-2">
                    <p className="text-[11px] text-ink-400">{e.after} · {e.credits} cr · L{e.nheqf}</p>
                    <p className="text-sm font-bold text-ink-800">{e.award}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* credit & hours model */}
      {d.credits && (
        <section className="mt-8">
          <h2 className="text-xl font-black text-ink-900">Credits & hours</h2>
          <p className="mt-1 text-sm text-ink-500">Modelled on the National Credit Framework: <b className="text-ink-700">1 credit = 30 notional learning hours</b>. Each delivery mode below — async, live sync, masterclass, hackathon and capstone — already bundles its own reading, lab practice and assessment, so the hours shown are total student effort, not video runtime{d.credits.benchmark ? <>. Benchmarked against <b className="text-ink-700">{d.credits.benchmark}</b></> : null}. Board Infinity delivers the industry layer within UGC&apos;s 40% online-credit allowance; faculty delivers the academic core.</p>
          {(() => {
            const facultyCore = d.credits.target - d.credits.nepCap;
            const onlinePct = Math.round((d.credits.nepCap / d.credits.target) * 100);
            return (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="card p-4 text-center"><p className="text-2xl font-black text-ink-900">{d.credits.target}</p><p className="text-[11px] text-ink-500">total credits · {d.credits.targetHours.toLocaleString()} hrs</p></div>
                  <div className="card border-brand-200 p-4 text-center"><p className="text-2xl font-black text-brand-600">{d.credits.nepCap}</p><p className="text-[11px] text-ink-500">online-eligible · blended delivery (async + live + projects)</p></div>
                  <div className="card p-4 text-center"><p className="text-2xl font-black text-ink-700">{facultyCore}</p><p className="text-[11px] text-ink-500">faculty academic core</p></div>
                </div>
                {/* stacked bar: online-eligible vs faculty core */}
                <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="bg-brand-500" style={{ width: `${onlinePct}%` }} title={`online-eligible ${d.credits.nepCap} cr`} />
                  <div className="bg-ink-300" style={{ width: `${100 - onlinePct}%` }} title="faculty core" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-500">
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-500" />Online-eligible blended ({d.credits.nepCap} cr · {onlinePct}%)</span>
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-ink-300" />Faculty academic core ({facultyCore} cr)</span>
                  <span className="chip-green ml-auto">✓ Within NEP 40% online allowance</span>
                </div>
              </>
            );
          })()}
        </section>
      )}

      {/* program journey */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">The program journey — semester by semester</h2>
        <p className="mt-1 text-sm text-ink-500">A focused, one-thing-at-a-time model: each semester carries its own delivery mix of recorded modules, live sessions, masterclasses and projects. Click any semester to expand.</p>
        <DegreeTerms terms={d.terms} delivery={d.delivery} />
      </section>

      {/* roles you graduate into */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">Roles you graduate into</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {roleObjs.map((r) => (
            <Link key={r.slug} href={`/specializations/${r.slug}`} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
              <p className="font-black text-ink-900">{r.role}</p>
              {r.salary && <p className="mt-1 text-sm font-bold text-[#1A8B66]">{r.salary.india}</p>}
              <p className="mt-1 text-xs font-bold text-brand-600">View specialization →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* delivery model */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">Delivery model</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map(([key, label, b]) => (
            <div key={key} className={`rounded-xl border border-ink-200 border-t-4 ${b} bg-white p-4 text-center`}>
              <p className="text-3xl font-black text-brand-600">{d.delivery[key]}%</p>
              <p className="mt-1 text-sm font-bold text-ink-700">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-brand-50 p-6">
        <div>
          <p className="font-black text-ink-900">For universities: map your curriculum against {d.name}</p>
          <p className="text-sm text-ink-600">Upload your existing syllabus — we parse it, tag the skills, compare against this ideal program, and return gap analysis, content suggestions and role outcomes.</p>
        </div>
        <Link href="/degrees/compare" className="btn-primary">Compare my curriculum →</Link>
      </div>
    </div>
  );
}
