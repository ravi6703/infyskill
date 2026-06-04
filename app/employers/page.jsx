export const metadata = { title: "For Employers — PathFinder AI" };

const POOL = [
  { id: "PF-2841", role: "GenAI Application Developer", readiness: 92, evidence: "Capstone: doc-QA SaaS · Hackathon winner", skills: ["Python", "LangChain", "RAG Pipelines", "FastAPI"] },
  { id: "PF-1932", role: "Agentic AI Engineer", readiness: 88, evidence: "Capstone: multi-agent research assistant", skills: ["LangGraph", "Multi-Agent Systems", "Vector Databases"] },
  { id: "PF-3310", role: "Data Engineer", readiness: 85, evidence: "Capstone: streaming pipeline + dashboard", skills: ["SQL", "Snowflake", "Data Pipelines", "Power BI"] },
  { id: "PF-2156", role: "AI Business Analyst", readiness: 81, evidence: "Capstone: AI-assisted market entry analysis", skills: ["Microsoft Excel", "Power BI", "Generative AI"] },
  { id: "PF-4520", role: "AI Marketing Specialist", readiness: 79, evidence: "Capstone: full-funnel AI campaign, measured ROAS", skills: ["Google Analytics 4", "Generative AI", "Email Marketing"] },
];

export default function Employers() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Hire from PathFinder</h1>
      <p className="mt-2 max-w-2xl text-slate-400">
        Every candidate carries verified skill evidence: module checkpoints, hackathon demos and a coached capstone — not just a certificate.
        Browse the talent pool by role and readiness. <span className="text-xs">(Anonymized preview — full access via InfyTalent.)</span>
      </p>
      <div className="mt-8 space-y-3">
        {POOL.map((c) => (
          <div key={c.id} className="card flex flex-wrap items-center gap-4 p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-xs font-bold text-white">{c.readiness}</span>
            <div className="flex-1">
              <p className="font-bold text-white">{c.role} <span className="ml-2 text-xs font-normal text-slate-500">{c.id}</span></p>
              <p className="text-xs text-emerald-300">📦 {c.evidence}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {c.skills.map((s) => <span key={s} className="chip bg-slate-800 text-slate-300">{s}</span>)}
              </div>
            </div>
            <button className="btn-primary text-xs">Unlock profile →</button>
          </div>
        ))}
      </div>
      <div className="card mt-8 border-brand-700 p-6 text-center">
        <h2 className="text-lg font-bold text-white">Hiring at scale?</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-slate-400">Post your JD into the analyzer — we&apos;ll tell you exactly which cohort matches it, or spin up a custom journey to train your pipeline (hire-train-deploy).</p>
        <a href="/analyzer" className="btn-primary mt-4 inline-flex">Match a JD against our talent →</a>
      </div>
    </div>
  );
}
