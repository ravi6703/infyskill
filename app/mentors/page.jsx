export const metadata = { title: "Coaches & Mentors — InfyAI" };

const MENTORS = [
  { name: "Coach A — Senior AI Architect", exp: "14 yrs · ex-GCC AI platform lead", tags: ["Agentic AI", "MLOps", "System Design"], slots: "Tue/Thu evenings" },
  { name: "Coach B — Data Engineering Lead", exp: "11 yrs · lakehouse migrations at scale", tags: ["Data Engineering", "Snowflake", "Spark"], slots: "Weekends" },
  { name: "Coach C — AI Product Director", exp: "16 yrs · 3 AI products 0→1", tags: ["AI Product", "GTM", "Evals"], slots: "Mon/Wed evenings" },
  { name: "Coach D — CISO Advisor", exp: "18 yrs · BFSI security programs", tags: ["AI Security", "Governance", "DPDP"], slots: "Fri evenings" },
  { name: "Coach E — Growth & AI Marketing", exp: "12 yrs · D2C + SaaS growth", tags: ["AI Marketing", "GA4", "Attribution"], slots: "Weekends" },
  { name: "Coach F — BFSI Quant Mentor", exp: "13 yrs · CFA charterholder", tags: ["AI in Finance", "Risk", "CFA"], slots: "Sat mornings" },
];

export default function Mentors() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Coaches & Mentors</h1>
      <p className="mt-2 max-w-2xl text-slate-400">
        1:1 coach sessions are built into hackathon and capstone weeks on Pro/Career+ plans — project scoping, code/work reviews, and career strategy.
        <span className="text-xs"> (Directory preview — booking integration coming.)</span>
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MENTORS.map((m) => (
          <div key={m.name} className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-lg font-black text-white">{m.name[6]}</span>
              <div>
                <p className="text-sm font-bold text-white">{m.name}</p>
                <p className="text-xs text-slate-500">{m.exp}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.tags.map((t) => <span key={t} className="chip bg-slate-800 text-slate-300">{t}</span>)}
            </div>
            <p className="mt-3 text-xs text-slate-500">🗓 {m.slots}</p>
            <button className="btn-primary mt-4 w-full justify-center text-sm">Book a session →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
