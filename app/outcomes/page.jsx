import Link from "next/link";

export const metadata = { title: "Outcomes & Trust — PathFinder AI" };

const STATS = [["30,000+", "learners trained last academic year"], ["80+", "institutions incl. 10 IIMs, 2 IITs"], ["300K+", "learners enrolled via Coursera"], ["200+", "industry-aligned courses"]];
const STORIES = [
  { name: "Priya S.", from: "B.Com graduate, Indore", to: "AI Business Analyst @ fintech startup", quote: "The diagnostic skipped what I knew from my Excel days and the weekly deliverables became my interview portfolio." },
  { name: "Arjun M.", from: "Support engineer, 4 yrs", to: "Agentic AI Engineer @ GCC, Bengaluru", quote: "Fast-track mode meant zero beginner fluff. The hackathon project is literally what I demoed in my final interview." },
  { name: "Fatima K.", from: "Final-year BCA student", to: "GenAI App Developer (campus placement)", quote: "My university ran the curriculum overlay — the capstone counted for credits AND got me placed." },
];

export default function Outcomes() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Outcomes & Trust</h1>
      <p className="mt-2 max-w-2xl text-slate-400">Built on Board Infinity&apos;s delivery track record across higher-ed and enterprise.</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map(([v, l]) => (
          <div key={l} className="card p-5 text-center">
            <div className="text-3xl font-extrabold text-white">{v}</div>
            <div className="mt-1 text-xs text-slate-400">{l}</div>
          </div>
        ))}
      </div>
      <section className="card mt-8 p-6">
        <h2 className="text-lg font-bold text-white">Recognitions & approvals</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[["CII", "Approved industry partner to deliver courses with academic credits"], ["NSDC", "Approved by National Skill Development Corporation"], ["NASSCOM", "Approved by NASSCOM"], ["Coursera", "Instructor partner alongside IBM & Google certificates"]].map(([n, d]) => (
            <div key={n} className="rounded-lg border border-slate-800 p-4">
              <p className="font-bold text-brand-300">{n}</p>
              <p className="mt-1 text-xs text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-bold text-white">Learner stories <span className="text-xs font-normal text-slate-500">(illustrative personas for preview)</span></h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {STORIES.map((s) => (
            <div key={s.name} className="card p-5">
              <p className="text-sm italic text-slate-300">“{s.quote}”</p>
              <p className="mt-4 text-sm font-bold text-white">{s.name}</p>
              <p className="text-xs text-slate-500">{s.from} → <span className="text-emerald-400">{s.to}</span></p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-8 text-center">
        <Link href="/diagnostic" className="btn-primary">Start your journey →</Link>
      </div>
    </div>
  );
}
