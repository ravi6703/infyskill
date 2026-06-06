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
        <h2 className="text-xl font-black text-ink-900">The program journey — trimester by trimester</h2>
        <p className="mt-1 text-sm text-ink-500">A focused, one-thing-at-a-time model: each trimester is a short, deep block with its own delivery mix. Click any trimester to expand.</p>
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
