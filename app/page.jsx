import Link from "next/link";
import specializations from "../data/journeys.json";
import courses from "../data/courses.json";

const stats = [
  [courses.length, "Skill-tagged courses"],
  [specializations.length, "AI-era specializations"],
  ["4", "Degree programs"],
  ["5-part", "Blended delivery model"],
];

const products = [
  ["/catalog", "Course Catalog", "Browse every course by category. Each course is skill-tagged and opens a visual learning roadmap — like roadmap.sh, for Board Infinity.", "chip-blue"],
  ["/specializations", "Specializations", "AI-era job roles built from our content + new-age roles. See the full journey, skills and outcomes to land the role.", "chip-peel"],
  ["/degrees", "Degree Programs", "Board Infinity's own best-of-best degree programs — with delivery model, target roles, and how they out-perform a standard university degree.", "chip-rose"],
];

export default function Home() {
  return (
    <div>
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-16 text-center text-white">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-100">Board Infinity · InfyAI</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-black sm:text-5xl">
          From a course, to a skill, to a <span className="text-peel-400">career</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-50">
          Skill-tagged courses with visual roadmaps, AI-era specializations, and Board Infinity degree programs —
          all built on a blended model of self-paced content, live mentorship, masterclasses, hackathons and capstones.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/diagnostic" className="btn bg-white text-brand-600 hover:bg-brand-50">Take the career diagnostic →</Link>
          <Link href="/specializations" className="btn border border-white/40 text-white hover:bg-white/10">Explore specializations</Link>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([v, l]) => (
          <div key={l} className="card p-5 text-center">
            <div className="text-3xl font-black text-brand-600">{v}</div>
            <div className="mt-1 text-sm text-ink-500">{l}</div>
          </div>
        ))}
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-3">
        {products.map(([href, title, desc, chip]) => (
          <Link key={href} href={href} className="card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className={`${chip} w-fit`}>{title}</span>
            <h3 className="mt-3 text-xl font-black text-ink-900 group-hover:text-brand-600">{title}</h3>
            <p className="mt-2 flex-1 text-sm text-ink-600">{desc}</p>
            <span className="mt-4 text-sm font-bold text-brand-600 group-hover:underline">Open →</span>
          </Link>
        ))}
      </section>

      <section className="card mt-12 p-6">
        <h2 className="text-xl font-black text-ink-900">The Board Infinity delivery model</h2>
        <p className="mt-1 text-sm text-ink-500">Every specialization and degree blends five components — the mix that bridges the education-to-industry gap.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[["▶", "Async content", "Self-paced, high-engagement", "border-t-brand-500"],
            ["🎙", "Live sync", "Mentor & SME sessions", "border-t-peel-500"],
            ["★", "Masterclass", "Industry experts, 10+ yrs", "border-t-flame-500"],
            ["🏆", "Hackathon", "Practical, judged builds", "border-t-rose-500"],
            ["🎓", "Capstone", "Hands-on, coached project", "border-t-brand-400"]].map(([icon, name, sub, b]) => (
            <div key={name} className={`rounded-xl border border-ink-200 border-t-4 ${b} bg-ink-50 p-4`}>
              <div className="text-2xl">{icon}</div>
              <p className="mt-1 font-bold text-ink-900">{name}</p>
              <p className="text-xs text-ink-500">{sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
