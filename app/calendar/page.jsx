import journeys from "../../data/journeys.json";

export const metadata = { title: "Cohort Calendar — InfyAI" };

function nextMondays(n) {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  for (let i = 0; i < n; i++) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 14);
  }
  return out;
}

const MASTERCLASSES = [
  ["Agent evaluation & observability in production", "Head of AI Platform, Fortune-100 GCC"],
  ["AI in Indian banking: RBI guardrails & live use cases", "BFSI digital transformation leader"],
  ["From prompt to product: shipping GenAI features users pay for", "CPO, AI-native startup"],
  ["The AI marketing stack of 2026", "CMO, D2C unicorn"],
  ["Deploying LLMs on a budget: vLLM & GPU economics", "MLOps lead, AI infrastructure company"],
];

export default function Calendar() {
  const mondays = nextMondays(4);
  const featured = journeys.filter((j) => ["agentic-ai-engineer", "genai-application-developer", "ai-data-analyst-analytics-engineer", "ai-augmented-marketing-specialist", "ai-in-finance-fintech-analyst", "data-engineer-ai-era"].includes(j.slug));
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Cohort Calendar</h1>
      <p className="mt-2 text-slate-400">Upcoming cohort start dates and the public masterclass series. <span className="text-xs">(Preview schedule)</span></p>
      <section className="mt-8">
        <h2 className="text-lg font-bold text-white">Next cohorts</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((j, i) => (
            <div key={j.slug} className="card p-4">
              <p className="font-bold text-white">{j.role}</p>
              <p className="mt-1 text-sm text-brand-300">Starts {mondays[i % mondays.length].toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              <p className="mt-1 text-xs text-slate-500">{j.weeks} weeks · live labs Tue & Thu 8pm IST · limited seats</p>
              <a href={`/journeys/${j.slug}`} className="btn-ghost mt-3 text-xs">View journey →</a>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-lg font-bold text-white">Masterclass series (open to all)</h2>
        <div className="mt-4 space-y-2">
          {MASTERCLASSES.map(([t, by], i) => {
            const d = new Date(); d.setDate(d.getDate() + 7 * (i + 1));
            return (
              <div key={t} className="card flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="chip bg-fuchsia-900/60 text-fuchsia-300">★</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{t}</p>
                  <p className="text-xs text-slate-500">{by}</p>
                </div>
                <span className="text-xs text-slate-400">{d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · 8 pm IST</span>
                <button className="btn-ghost text-xs">Reserve seat</button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
