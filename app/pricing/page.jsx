"use client";
import { useState } from "react";
import journeys from "../../data/journeys.json";
import { sbInsert } from "../../lib/supabase";

export default function FoundingCohort() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [kind, setKind] = useState("learner");
  const [sent, setSent] = useState(false);
  // ROI calculator
  const [currentLPA, setCurrentLPA] = useState(4);
  const [roiRole, setRoiRole] = useState("genai-application-developer");
  const j = journeys.find((x) => x.slug === roiRole);
  const targetLow = j?.salary?.india ? parseFloat((j.salary.india.match(/₹(\d+)/) || [0, 8])[1]) : 8;
  const uplift = Math.max(0, targetLow - currentLPA);

  function join() {
    if (!email.includes("@")) return;
    sbInsert("pf_analyses", { kind: "lead", input_title: `Waitlist: ${kind}`, input_text: email, result: { kind, role } })
      .then(() => setSent(true)).catch(() => setSent(true));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-center text-3xl font-extrabold text-white">Join the Founding Cohort</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">
        The full blended experience — weekly live labs, industry masterclasses, a hackathon and a coached capstone —
        launches with a limited founding cohort. Founding members get lifetime pricing and direct input into the product.
      </p>

      <div className="card mx-auto mt-8 max-w-xl p-6">
        {sent ? (
          <p className="text-center text-emerald-400">✓ You&apos;re on the list. We&apos;ll reach out when your cohort opens.</p>
        ) : (
          <>
            <div className="flex gap-2">
              {[["learner", "I'm a learner"], ["university", "I'm a university"], ["employer", "I'm an employer"]].map(([v, l]) => (
                <button key={v} onClick={() => setKind(v)} className={`btn flex-1 justify-center text-sm ${kind === v ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300"}`}>{l}</button>
              ))}
            </div>
            {kind === "learner" && (
              <select className="input mt-3" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Which journey interests you?</option>
                {journeys.map((x) => <option key={x.slug} value={x.slug}>{x.role}</option>)}
              </select>
            )}
            <input className="input mt-3" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={join} className="btn-primary mt-3 w-full justify-center">Join the waitlist →</button>
            <p className="mt-2 text-center text-[11px] text-slate-500">Self-paced journeys, the diagnostic and all analyzers are free to use today.</p>
          </>
        )}
      </div>

      <section className="card mx-auto mt-10 max-w-2xl p-6">
        <h2 className="text-xl font-bold text-white">📈 What&apos;s the upside? (ROI estimate)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Your current salary (LPA)
            <input type="number" className="input mt-1" value={currentLPA} min="0" onChange={(e) => setCurrentLPA(+e.target.value || 0)} />
          </label>
          <label className="text-sm text-slate-300">Target role
            <select className="input mt-1" value={roiRole} onChange={(e) => setRoiRole(e.target.value)}>
              {journeys.map((x) => <option key={x.slug} value={x.slug}>{x.role}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-slate-950/60 p-3"><p className="text-2xl font-extrabold text-white">{j?.salary?.india}</p><p className="text-xs text-slate-500">target band (India)</p></div>
          <div className="rounded-lg bg-slate-950/60 p-3"><p className="text-2xl font-extrabold text-emerald-400">+₹{uplift} LPA</p><p className="text-xs text-slate-500">entry-level uplift vs today</p></div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Illustrative: entry of target salary band vs your current salary. Actual outcomes vary by individual and market.</p>
      </section>
    </div>
  );
}
