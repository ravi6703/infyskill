import Link from "next/link";
import degrees from "../../data/degrees_bi.json";
import { Motif } from "../../components/Art";

export const metadata = { title: "Degree Programmes — InfyAI" };
const MOTIF = ["degree", "specialization", "catalog", "diagnostic"];

const GAINS = [
  ["40%", "NEP online-credit cap", "NEP & UGC compliant", "Online credits sit inside the 40% allowance, mapped to the NCrF (1 credit = 30 hrs). Plugs into your existing degree without breaking accreditation."],
  ["2+", "portfolio builds / student", "Industry-ready graduates", "Every trimester ends in a hackathon or capstone; skills mapped to real AI-era roles → better placements and rankings."],
  ["1×", "built, reused every batch", "Lower faculty load", "Recorded async content is built once and reused every cohort. Faculty move from lecturing basics to mentoring and the academic core."],
  ["0", "new hires needed", "No new hiring", "Board Infinity supplies the SMEs, masterclasses and live industry sessions. Your faculty keeps full academic governance."],
  ["Weeks", "to launch — not years", "Fast to launch", "A ready blended curriculum — structure, delivery model and tagged content — deploys in weeks, not a multi-year committee cycle."],
  ["NAAC / NBA", "ready reporting", "Measurable outcomes", "Skill-level tracking, employability scoring and role-readiness give you accreditation review and placement data."],
];

export default function Degrees() {
  return (
    <div>
      <h1 className="text-3xl font-black text-ink-900">Board Infinity Degree Programmes</h1>
      <p className="mt-2 max-w-3xl text-ink-500">
        Not a university syllabus retro-fitted — these are Board Infinity&apos;s own best-of-best programmes, designed from our content library and
        delivered through the blended model. Each shows the journey, the roles you graduate into, and how it out-performs a standard university degree.
      </p>
      <Link href="/degrees/compare" className="btn-ghost mt-4 text-sm">🎓 For universities: compare your curriculum &amp; see the gap →</Link>

      {/* what your institution gains — moved up, metric-led */}
      <section className="mt-8 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">For universities &amp; institutions</p>
        <h2 className="mt-1 text-2xl font-black text-ink-900">What your institution gains</h2>
        <p className="mt-1 text-sm text-ink-500">Why colleges run these as powered programs rather than building them alone.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GAINS.map(([metric, unit, title, body]) => (
            <div key={title} className="card flex flex-col p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black leading-none text-brand-600">{metric}</span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{unit}</span>
              </div>
              <p className="mt-2 font-black text-ink-900">{title}</p>
              <p className="mt-1 text-sm text-ink-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* the programs */}
      <h2 className="mt-12 text-xl font-black text-ink-900">The programs</h2>
      <p className="mt-1 text-sm text-ink-500">Four flagship blended degrees — click any to see its semester-by-semester journey and delivery model.</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {degrees.map((d, i) => (
          <Link key={d.slug} href={`/degrees/${d.slug}`} className="card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-lift animate-fadeUp" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="chip-peel">{d.level}</span>
                <h2 className="mt-2 text-xl font-black text-ink-900 group-hover:text-brand-600">{d.name}</h2>
                <p className="mt-1 text-sm text-ink-500">{d.tagline}</p>
              </div>
              <Motif variant={MOTIF[i % MOTIF.length]} className="h-16 w-20 shrink-0 transition group-hover:scale-105" />
            </div>
            <p className="mt-3 text-sm font-bold text-ink-700">{d.duration}{d.credits?.target ? ` · ${d.credits.target} credits` : ""}</p>
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
