import Link from "next/link";
import journeys from "../data/journeys.json";
import courses from "../data/courses.json";
import skills from "../data/skills.json";

const stats = [
  [courses.length, "Recorded courses"],
  ["16,812", "Tagged content items"],
  [skills.length.toLocaleString(), "Canonical skills"],
  [journeys.length, "AI-era career journeys"],
];

const tools = [
  ["/journeys", "Career Journeys", "26 AI-era job roles with blended async + live + masterclass + hackathon + capstone paths, mapped to real content."],
  ["/catalog", "Course Catalog", "Search 259 courses by skill, domain or keyword. Drill down to module, lesson and individual video tags."],
  ["/analyzer", "JD → Journey Analyzer", "Paste any job description. Get extracted skills, library coverage %, recommended journey and course list."],
  ["/university", "University Curriculum Mapping", "Paste a degree or semester curriculum. Get subject-by-subject coverage, gaps and a blended overlay proposal."],
];

export default function Home() {
  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 px-6 py-16 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-400">Board Infinity presents</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-black text-white sm:text-5xl">
          Every course, lesson and video — <span className="bg-gradient-to-r from-brand-400 to-accent-500 bg-clip-text text-transparent">skill-tagged</span> and assembled into AI-era careers
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          PathFinder AI turns Board Infinity&apos;s content library into dynamic career journeys, JD-matched learning paths and university degree overlays.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/journeys" className="btn-primary">Explore Career Journeys</Link>
          <Link href="/analyzer" className="btn-ghost">Analyze a Job Description</Link>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([v, l]) => (
          <div key={l} className="card p-5 text-center">
            <div className="text-3xl font-extrabold text-white">{v}</div>
            <div className="mt-1 text-sm text-slate-400">{l}</div>
          </div>
        ))}
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        {tools.map(([href, title, desc]) => (
          <Link key={href} href={href} className="card group p-6 transition hover:border-brand-500">
            <h3 className="text-xl font-bold text-white group-hover:text-brand-300">{title} →</h3>
            <p className="mt-2 text-sm text-slate-400">{desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
