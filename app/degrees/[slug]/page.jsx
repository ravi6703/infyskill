import Link from "next/link";
import degrees from "../../../data/degrees_bi.json";
import specs from "../../../data/journeys.json";

export function generateStaticParams() {
  return degrees.map((d) => ({ slug: d.slug }));
}
export function generateMetadata({ params }) {
  const d = degrees.find((x) => x.slug === params.slug);
  return { title: `${d ? d.name : "Degree"} — PathFinder AI` };
}

const PILLARS = [["async", "▶ Async", "border-t-brand-500"], ["sync", "🎙 Live sync", "border-t-peel-500"], ["masterclass", "★ Masterclass", "border-t-flame-500"], ["hackathon", "🏆 Hackathon", "border-t-rose-500"], ["capstone", "🎓 Capstone", "border-t-brand-400"]];

export default function Degree({ params }) {
  const d = degrees.find((x) => x.slug === params.slug);
  if (!d) return <p>Not found.</p>;
  const roleObjs = d.roles.map((r) => specs.find((s) => s.slug === r)).filter(Boolean);

  return (
    <div>
      <Link href="/degrees" className="text-sm font-bold text-brand-600">← All degree programs</Link>

      <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
        <span className="chip bg-white/15 text-white">{d.level} · {d.duration}</span>
        <h1 className="mt-2 text-3xl font-black">{d.name}</h1>
        <p className="mt-2 max-w-2xl text-brand-50">{d.tagline}</p>
      </div>

      {/* program journey */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">The program journey</h2>
        <p className="mt-1 text-sm text-ink-500">Each term blends the five-part delivery model and ends at a job-ready milestone.</p>
        <div className="relative mt-5 space-y-4 border-l-2 border-brand-100 pl-6">
          {d.terms.map((t, i) => (
            <div key={t.name} className="relative">
              <span className="absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[10px] font-black text-white">{i + 1}</span>
              <div className="card p-4">
                <p className="font-black text-ink-900">{t.name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.themes.map((th) => <span key={th} className="chip-blue">{th}</span>)}
                </div>
                <p className="mt-2 text-sm text-[#1A8B66]">🎯 Milestone: {t.milestone}</p>
              </div>
            </div>
          ))}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full bg-peel-500 text-[10px] text-white">🎓</span>
            <div className="card border-peel-200 bg-peel-50 p-4">
              <p className="font-black text-ink-900">Graduation — industry-ready</p>
              <p className="mt-1 text-sm text-ink-600">Degree + verified skills + capstone portfolio, prepared for the roles below.</p>
            </div>
          </div>
        </div>
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

      {/* vs university */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">How this out-performs a standard university degree</h2>
        <p className="mt-1 text-sm text-ink-500">The education-to-industry gap — and how this program bridges it.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card border-[#BFE9D7] bg-[#F0FBF6] p-5">
            <p className="font-black text-[#1A8B66]">✓ Board Infinity program</p>
            <ul className="mt-3 space-y-2">
              {d.vsUniversity.biStrength.map((x) => <li key={x} className="flex gap-2 text-sm text-ink-700"><span className="text-[#1A8B66]">✓</span>{x}</li>)}
            </ul>
          </div>
          <div className="card border-rose-200 bg-rose-50 p-5">
            <p className="font-black text-rose-600">✕ Typical university degree</p>
            <ul className="mt-3 space-y-2">
              {d.vsUniversity.uniGap.map((x) => <li key={x} className="flex gap-2 text-sm text-ink-700"><span className="text-rose-500">✕</span>{x}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-brand-50 p-6">
        <div>
          <p className="font-black text-ink-900">Partner with us on {d.name}</p>
          <p className="text-sm text-ink-600">Universities can adopt this program, or map it against an existing degree to bridge the gap.</p>
        </div>
        <Link href="/diagnostic" className="btn-primary">Explore the journey →</Link>
      </div>
    </div>
  );
}
