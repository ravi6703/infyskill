import Link from "next/link";
import specializations from "../data/journeys.json";
import courses from "../data/courses.json";
import { HeroArt, Motif, NodeBand } from "../components/Art";

const stats = [
  [courses.length, "Skill-tagged courses"],
  [specializations.length, "AI-era specializations"],
  ["4", "Degree programs"],
  ["5-part", "Blended delivery model"],
];

const products = [
  ["/catalog", "Course Catalog", "Browse every course by category. Each course is skill-tagged and opens a visual learning roadmap — like roadmap.sh, for Board Infinity.", "chip-blue", "catalog"],
  ["/specializations", "Specializations", "AI-era job roles built from our content + new-age roles. See the full journey, skills and outcomes to land the role.", "chip-peel", "specialization"],
  ["/degrees", "Degree Programs", "Board Infinity's own best-of-best degree programs — trimester curriculum, delivery model and the roles you graduate into.", "chip-rose", "degree"],
];

const POP_SKILLS = ["Generative AI", "LangChain", "Python", "RAG Pipelines", "MLOps", "Prompt Engineering", "Deep Learning", "Power BI", "AI Agents", "Fine-Tuning", "Data Pipelines", "Computer Vision"];

export default function Home() {
  return (
    <div>
      <section className="grid items-center gap-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-12 text-white md:grid-cols-2 md:py-16">
        <div className="animate-fadeUp">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-100">Board Infinity · InfyAI</p>
          <h1 className="text-4xl font-black sm:text-5xl">From a course, to a skill, to a <span className="text-peel-400">career</span></h1>
          <p className="mt-4 max-w-xl text-brand-50">
            Skill-tagged courses with visual roadmaps, AI-era specializations, and Board Infinity degree programs —
            all on a blended model of self-paced content, live mentorship, masterclasses, hackathons and capstones.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/diagnostic" className="btn bg-white text-brand-600 hover:bg-brand-50">Take the career diagnostic →</Link>
            <Link href="/specializations" className="btn border border-white/40 text-white hover:bg-white/10">Explore specializations</Link>
          </div>
        </div>
        <div className="animate-fadeIn"><HeroArt className="w-full animate-floaty" /></div>
      </section>

      {/* marquee skill band */}
      <div className="mt-6 overflow-hidden rounded-xl border border-ink-200 bg-white py-3">
        <div className="flex w-max animate-marquee gap-3">
          {[...POP_SKILLS, ...POP_SKILLS].map((s, i) => <span key={i} className="chip-blue whitespace-nowrap">{s}</span>)}
        </div>
      </div>

      <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([v, l], i) => (
          <div key={l} className="card animate-fadeUp p-5 text-center" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="text-3xl font-black text-brand-600">{v}</div>
            <div className="mt-1 text-sm text-ink-500">{l}</div>
          </div>
        ))}
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-3">
        {products.map(([href, title, desc, chip, motif], i) => (
          <Link key={href} href={href} className="card group flex flex-col overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-lift animate-fadeUp" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-center bg-gradient-to-br from-ink-50 to-brand-50 py-6">
              <Motif variant={motif} className="h-24 w-32 transition group-hover:scale-105" />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <span className={`${chip} w-fit`}>{title}</span>
              <h3 className="mt-3 text-xl font-black text-ink-900 group-hover:text-brand-600">{title}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-600">{desc}</p>
              <span className="mt-4 text-sm font-bold text-brand-600 group-hover:underline">Open →</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="card relative mt-12 overflow-hidden p-6">
        <NodeBand className="pointer-events-none absolute inset-x-0 top-0 h-16 w-full opacity-30" />
        <h2 className="relative text-xl font-black text-ink-900">The Board Infinity delivery model</h2>
        <p className="relative mt-1 text-sm text-ink-500">Every specialization and degree blends five components — the mix that bridges the education-to-industry gap.</p>
        <div className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[["▶", "Async content", "Self-paced, high-engagement", "border-t-brand-500"],
            ["🎙", "Live sync", "Mentor & SME sessions", "border-t-peel-500"],
            ["★", "Masterclass", "Industry experts, 10+ yrs", "border-t-flame-500"],
            ["🏆", "Hackathon", "Practical, judged builds", "border-t-rose-500"],
            ["🎓", "Capstone", "Hands-on, coached project", "border-t-brand-400"]].map(([icon, name, sub, b], i) => (
            <div key={name} className={`animate-fadeUp rounded-xl border border-ink-200 border-t-4 ${b} bg-ink-50 p-4 transition hover:-translate-y-0.5 hover:shadow-card`} style={{ animationDelay: `${i * 60}ms` }}>
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
