"use client";
import { useState } from "react";
import journeys from "../../data/journeys.json";
import { sbInsert } from "../../lib/supabase";

const TIERS = [
  { name: "Explorer", price: "Free", desc: "Start your journey", features: ["Diagnostic & personalized week plan", "Full course catalog access (async)", "Skill taxonomy & JD analyzer", "Progress tracking & streaks", "Community forum"] },
  { name: "Pro Journey", price: "₹4,999/mo", hot: true, desc: "The full blended experience", features: ["Everything in Explorer", "Weekly live labs & mentor circles", "Industry masterclasses (every 2-3 weeks)", "Hackathons with industry judges", "Coached capstone project", "Skill checkpoints & verified badges", "Certificate of completion"] },
  { name: "Career+", price: "₹7,999/mo", desc: "Outcome-focused", features: ["Everything in Pro", "1:1 personal coach sessions", "AI Resume Builder (Infy Resume Copilot)", "AI Mock Interviews (Infy Interview)", "Placement support & employer pool listing", "Priority doubt-solving"] },
  { name: "University / Enterprise", price: "Custom", desc: "For institutions", features: ["Curriculum gap analysis & embed plans", "NEP 2020 40% online-credit overlay", "Semester hackathons & capstones", "Partner analytics dashboard", "InfyLearn LMS integration", "Dedicated success manager"] },
];

export default function Pricing() {
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState(null);
  const [sent, setSent] = useState(false);
  // ROI calculator
  const [currentLPA, setCurrentLPA] = useState(4);
  const [role, setRole] = useState("genai-application-developer");
  const j = journeys.find((x) => x.slug === role);
  const targetLow = j?.salary?.india ? parseFloat((j.salary.india.match(/₹(\d+)/) || [0, 8])[1]) : 8;
  const uplift = Math.max(0, targetLow - currentLPA);
  const cost = 4999 * 5 / 100000; // 5 months Pro in lakh
  const roiX = cost > 0 ? (uplift / cost).toFixed(1) : "∞";

  function lead(t) {
    setTier(t);
    if (!email.includes("@")) return;
    sbInsert("pf_analyses", { kind: "lead", input_title: `Pricing lead: ${t}`, input_text: email, result: { tier: t } }).then(() => setSent(true)).catch(() => {});
  }

  return (
    <div>
      <h1 className="text-center text-3xl font-extrabold text-white">Plans & Pricing</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-slate-400">Start free. Upgrade when you want the live, coached, outcome-driven experience.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t) => (
          <div key={t.name} className={`card flex flex-col p-5 ${t.hot ? "border-brand-500 bg-gradient-to-b from-brand-950 to-slate-900" : ""}`}>
            {t.hot && <span className="chip mb-2 w-fit bg-brand-600 text-white">Most popular</span>}
            <h3 className="text-lg font-bold text-white">{t.name}</h3>
            <p className="text-2xl font-extrabold text-brand-300">{t.price}</p>
            <p className="text-xs text-slate-500">{t.desc}</p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-300">
              {t.features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <button onClick={() => lead(t.name)} className={`mt-4 ${t.hot ? "btn-primary" : "btn-ghost"} justify-center text-sm`}>
              {t.price === "Custom" ? "Talk to us" : "Get started"}
            </button>
          </div>
        ))}
      </div>
      {tier && !sent && (
        <div className="card mx-auto mt-6 flex max-w-md gap-2 p-4">
          <input className="input" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={() => lead(tier)} className="btn-primary text-sm">Notify me</button>
        </div>
      )}
      {sent && <p className="mt-4 text-center text-emerald-400">✓ Got it — the team will reach out about {tier}.</p>}

      <section className="card mx-auto mt-12 max-w-2xl p-6">
        <h2 className="text-xl font-bold text-white">📈 ROI Calculator</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Your current salary (LPA)
            <input type="number" className="input mt-1" value={currentLPA} min="0" onChange={(e) => setCurrentLPA(+e.target.value || 0)} />
          </label>
          <label className="text-sm text-slate-300">Target role
            <select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value)}>
              {journeys.map((x) => <option key={x.slug} value={x.slug}>{x.role}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-950/60 p-3"><p className="text-2xl font-extrabold text-white">{j?.salary?.india}</p><p className="text-xs text-slate-500">target band (India)</p></div>
          <div className="rounded-lg bg-slate-950/60 p-3"><p className="text-2xl font-extrabold text-emerald-400">+₹{uplift} LPA</p><p className="text-xs text-slate-500">entry-level uplift vs today</p></div>
          <div className="rounded-lg bg-slate-950/60 p-3"><p className="text-2xl font-extrabold text-brand-300">{roiX}×</p><p className="text-xs text-slate-500">first-year ROI vs Pro plan cost</p></div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Illustrative: entry of target band vs current salary, against ~5 months of Pro. Actual outcomes vary.</p>
      </section>
    </div>
  );
}
