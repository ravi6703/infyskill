"use client";
import { useRouter } from "next/navigation";

// Demo feed for the NEXUS emerging-roles pipeline. In production this is fed by
// the in-house NEXUS scraper: postings -> role clusters -> skill extraction -> auto-journey.
const FEED = [
  { role: "Forward-Deployed AI Engineer", growth: "+800% postings (2025)", detected: "2 days ago", postings: 1240,
    skills: "Python, LangGraph, RAG pipelines, prompt engineering, client communication, FastAPI, AWS, agent evaluation, Docker" },
  { role: "AI Evaluation Engineer", growth: "+340% postings", detected: "5 days ago", postings: 610,
    skills: "LLM evaluation, Python, statistical analysis, prompt engineering, A/B testing, data annotation, RLHF, model monitoring" },
  { role: "GenAI Sales Engineer", growth: "+210% postings", detected: "1 week ago", postings: 480,
    skills: "Generative AI, solution selling, demo building, prompt engineering, stakeholder management, no-code development, communication skills" },
  { role: "AI Compliance Analyst (DPDP/EU AI Act)", growth: "+190% postings", detected: "1 week ago", postings: 350,
    skills: "AI governance, regulatory compliance, risk management, audit management, documentation, data privacy" },
  { role: "Vibe Coding Specialist / AI-native Developer", growth: "new cluster", detected: "2 weeks ago", postings: 290,
    skills: "no-code development, prompt engineering, JavaScript, API integration, workflow automation, generative AI, debugging" },
  { role: "AI Localization Lead (Indic languages)", growth: "new cluster", detected: "3 weeks ago", postings: 180,
    skills: "natural language processing, fine-tuning, data annotation, Hugging Face, translation quality, conversation design" },
];

export default function Nexus() {
  const router = useRouter();
  function generate(item) {
    try { localStorage.setItem("pf_jd", `${item.role}\nRequired skills: ${item.skills}`); } catch {}
    router.push("/analyzer?from=nexus");
  }
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-extrabold text-white">NEXUS — Emerging Roles Feed</h1>
        <span className="chip bg-amber-900/60 text-amber-300">pipeline preview</span>
      </div>
      <p className="mt-2 max-w-3xl text-slate-400">
        NEXUS continuously scrapes job boards for new AI-era role clusters. Each detection flows through the same engine:
        skill extraction → content matching → auto-drafted journey → curriculum-team review → published. Demo data below;
        live scraper integration is the production hookup.
      </p>
      <div className="mt-8 space-y-3">
        {FEED.map((f) => (
          <div key={f.role} className="card flex flex-wrap items-center gap-4 p-5">
            <div className="flex-1">
              <h3 className="font-bold text-white">{f.role}</h3>
              <p className="mt-1 text-xs text-slate-500">Detected {f.detected} · ~{f.postings.toLocaleString()} postings · <span className="text-emerald-400">{f.growth}</span></p>
              <p className="mt-2 text-xs text-slate-400">{f.skills}</p>
            </div>
            <button onClick={() => generate(f)} className="btn-primary text-sm">Auto-generate journey →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
