import Link from "next/link";

export const metadata = { title: "Outcomes & Trust — InfyAI" };

const STATS = [["30,000+", "learners trained last academic year"], ["80+", "institutions incl. 10 IIMs, 2 IITs"], ["300K+", "learners enrolled via Coursera"], ["200+", "industry-aligned courses"]];

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
      <section className="card mt-8 border-dashed border-slate-700 p-6 text-center">
        <h2 className="text-lg font-bold text-white">Founding cohort stories — coming here</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
          We publish only real, verifiable learner outcomes. The first InfyAI cohort&apos;s results — completion, placements and
          capstone showcases — will appear on this page as they happen.
        </p>
      </section>
      <div className="mt-8 text-center">
        <Link href="/diagnostic" className="btn-primary">Start your journey →</Link>
      </div>
    </div>
  );
}
