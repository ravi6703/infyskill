import Link from "next/link";
import journeys from "../data/journeys.json";
import courses from "../data/courses.json";
import skills from "../data/skills.json";

const stats = [
  [courses.length, "Recorded courses"],
  ["866", "Composable modules"],
  ["16,812", "Tagged content items"],
  [skills.length.toLocaleString(), "Canonical skills"],
];

const tools = [
  ["/diagnostic", "🎯 60-Second Diagnostic", "Pick a role, self-assess, set your pace — get a personalized week-by-week journey that skips what you already know.", true],
  ["/journeys", "🚀 Career Journeys", `${journeys.length} AI-era roles in 6 career families. Module-level plans with live labs, masterclasses, hackathons and a capstone.`, false],
  ["/analyzer", "📋 JD → Journey", "Paste any job description — get extracted skills, coverage % and a custom week plan in seconds.", false],
  ["/university", "🎓 University Mapping", "Map any degree curriculum: subject-by-subject coverage, gaps, and module-level embed plans under NEP 2020.", false],
  ["/catalog", "📚 Course Catalog", "Search 259 courses down to individual video tags.", false],
  ["/nexus", "📡 NEXUS Feed", "Emerging AI roles detected from live job postings, auto-converted into journeys.", false],
];

export default function Home() {
  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 px-6 py-16 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-400">Board Infinity presents</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-black text-white sm:text-5xl">
          Your AI-era career, planned <span className="bg-gradient-to-r from-brand-400 to-accent-500 bg-clip-text text-transparent">week by week</span> — down to the module
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          PathFinder AI composes personalized learning journeys from 866 skill-tagged modules —
          blending self-paced content, live labs, industry masterclasses, hackathons and a coached capstone.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/diagnostic" className="btn-primary text-base">Find my path in 60 seconds →</Link>
          <Link href="/journeys" className="btn-ghost">Browse {journeys.length} journeys</Link>
        </div>
        <p className="mt-6 text-xs text-slate-500">Evidence-based blend: ~40% async · ~25% live · ~20% projects · masterclasses, coaching & assessments</p>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([v, l]) => (
          <div key={l} className="card p-5 text-center">
            <div className="text-3xl font-extrabold text-white">{v}</div>
            <div className="mt-1 text-sm text-slate-400">{l}</div>
          </div>
        ))}
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tools.map(([href, title, desc, hot]) => (
          <Link key={href} href={href} className={`card group p-6 transition hover:border-brand-500 ${hot ? "border-brand-700 bg-gradient-to-br from-brand-950 to-slate-900" : ""}`}>
            <h3 className="text-lg font-bold text-white group-hover:text-brand-300">{title} →</h3>
            <p className="mt-2 text-sm text-slate-400">{desc}</p>
          </Link>
        ))}
      </section>

      <section className="card mt-12 p-6">
        <h2 className="text-xl font-bold text-white">Add-ons on every journey</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-dashed border-slate-700 p-4">
            <p className="font-semibold text-white">🧑‍🏫 Personal Coach</p>
            <p className="mt-1 text-sm text-slate-400">1:1 guidance on hackathon and capstone weeks — scoping, reviews, career strategy.</p>
          </div>
          <div className="rounded-lg border border-dashed border-slate-700 p-4">
            <p className="font-semibold text-white">📄 AI Resume Builder</p>
            <p className="mt-1 text-sm text-slate-400">Auto-drafts your resume from journey evidence — modules, projects, verified skills (Infy Resume Copilot).</p>
          </div>
          <div className="rounded-lg border border-dashed border-slate-700 p-4">
            <p className="font-semibold text-white">🎤 AI Mock Interview</p>
            <p className="mt-1 text-sm text-slate-400">Role-specific interview simulation with feedback, unlocked at journey end (Infy Interview).</p>
          </div>
        </div>
      </section>
    </div>
  );
}
