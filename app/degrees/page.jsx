import Link from "next/link";
import degrees from "../../data/degrees_bi.json";
import { Motif } from "../../components/Art";

export const metadata = { title: "Degree Programs — InfyAI" };
const MOTIF = ["degree", "specialization", "catalog", "diagnostic"];

export default function Degrees() {
  return (
    <div>
      <h1 className="text-3xl font-black text-ink-900">Board Infinity Degree Programs</h1>
      <p className="mt-2 max-w-3xl text-ink-500">
        Not a university syllabus retro-fitted — these are Board Infinity&apos;s own best-of-best programs, designed from our content library and
        delivered through the blended model. Each shows the journey, the roles you graduate into, and how it out-performs a standard university degree.
      </p>
      <Link href="/degrees/compare" className="btn-ghost mt-4 text-sm">🎓 For universities: compare your curriculum & see the gap →</Link>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
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

      {/* what the institution gains — common to all programs */}
      <section className="mt-12">
        <h2 className="text-2xl font-black text-ink-900">What your institution gains</h2>
        <p className="mt-1 text-sm text-ink-500">Why colleges run these as powered programs rather than building them alone.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["🎓", "NEP & UGC compliant", "Online credits sit inside the 40% allowance and map to the NCrF (1 credit = 30 hours). Plugs into your existing degree without breaking accreditation."],
            ["💼", "Industry-ready graduates", "Every trimester ends in a hackathon or capstone; students graduate with a portfolio and skills mapped to real AI-era roles — better placements and rankings."],
            ["👩‍🏫", "Lower faculty load", "Recorded async content is built once and reusable every batch. Faculty shift from lecturing basics to mentoring and the academic core."],
            ["🤝", "No new hiring", "Board Infinity supplies the SMEs, masterclasses and live industry sessions. Your faculty keeps full academic governance."],
            ["⚡", "Fast to launch", "A ready blended curriculum — trimester structure, delivery model and tagged content — deploys in weeks, not a multi-year committee cycle."],
            ["📊", "Measurable outcomes", "Skill-level tracking, employability scoring and role-readiness give you data for NAAC/NBA reviews and placement reporting."],
          ].map(([icon, title, body]) => (
            <div key={title} className="card p-4">
              <div className="text-2xl">{icon}</div>
              <p className="mt-1 font-black text-ink-900">{title}</p>
              <p className="mt-1 text-sm text-ink-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
