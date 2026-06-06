"use client";
import Link from "next/link";
import { skillsByCluster } from "../../../lib/engine";

const STATUS = {
  available: ["Ready", "chip-green"], planned: ["In production", "chip-blue"], create: ["Coming soon", "chip-peel"],
};
const PILLARS = [
  ["▶", "Async content", "Self-paced, skill-tagged modules", "border-t-brand-500"],
  ["🎙", "Live sync", "Mentor & SME sessions", "border-t-peel-500"],
  ["★", "Masterclass", "Industry experts, 10+ yrs", "border-t-flame-500"],
  ["🏆", "Hackathon", "Practical, judged build", "border-t-rose-500"],
  ["🎓", "Capstone", "Hands-on, coached project", "border-t-brand-400"],
];

export default function SpecDetail({ spec }) {
  const clusters = skillsByCluster(spec.skills).slice(0, 8);
  const stageNames = spec.stages.map((s) => s.name);

  return (
    <div>
      <Link href="/specializations" className="text-sm font-bold text-brand-600">← All specializations</Link>

      {/* hero */}
      <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-100">{spec.bucket}</p>
        <h1 className="mt-1 text-3xl font-black">{spec.role}</h1>
        <p className="mt-2 max-w-2xl text-brand-50">{spec.persona}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {spec.salary && (
            <div className="rounded-xl bg-white/10 px-4 py-2">
              <p className="text-[11px] uppercase tracking-wider text-brand-100">Outcome (India)</p>
              <p className="font-black">{spec.salary.india}</p>
            </div>
          )}
          <div className="rounded-xl bg-white/10 px-4 py-2">
            <p className="text-[11px] uppercase tracking-wider text-brand-100">Level</p>
            <p className="font-black">{spec.level}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-2">
            <p className="text-[11px] uppercase tracking-wider text-brand-100">Typical duration</p>
            <p className="font-black">{spec.weeks} weeks</p>
          </div>
        </div>
        {spec.salary?.growth && <p className="mt-3 text-sm text-brand-100">📈 {spec.salary.growth}</p>}
      </div>

      <div className="mt-4">
        <Link href={`/diagnostic?role=${spec.slug}`} className="btn-primary">Personalize this for me — career diagnostic →</Link>
      </div>

      {/* skills you'll achieve */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">Skills you&apos;ll achieve</h2>
        <p className="mt-1 text-sm text-ink-500">Grouped by area — this is the competency map for the role.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {clusters.map(([cl, sks]) => (
            <div key={cl} className="card p-4">
              <p className="font-black text-ink-900">{cl === "General Professional" ? "Professional & Workplace" : cl}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sks.slice(0, 8).map((s) => <span key={s} className="chip-blue">{s}</span>)}
                {sks.length > 8 && <span className="chip-gray">+{sks.length - 8}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* the journey — stages only, no course content */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">Your journey to the role</h2>
        <p className="mt-1 text-sm text-ink-500">Four stages, each blending the five-part delivery model. The detailed week-by-week plan is generated for you in the diagnostic.</p>
        <div className="relative mt-5 space-y-4 border-l-2 border-brand-100 pl-6">
          {spec.stages.map((st, i) => {
            const comps = st.components;
            const types = [...new Set(comps.map((c) => c.type))];
            return (
              <div key={st.name} className="relative">
                <span className="absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[10px] font-black text-white">{i + 1}</span>
                <div className="card p-4">
                  <p className="font-black text-ink-900">{st.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {types.map((t) => <span key={t} className="chip-gray">{t}</span>)}
                  </div>
                  <p className="mt-2 text-xs text-ink-500">Focus: {[...new Set(comps.flatMap((c) => c.content.split(/[:&-]/)[0].trim()).slice(0, 2))].join(" · ")}</p>
                </div>
              </div>
            );
          })}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full bg-peel-500 text-[10px] text-white">🎯</span>
            <div className="card border-peel-200 bg-peel-50 p-4">
              <p className="font-black text-ink-900">Outcome — {spec.role}</p>
              <p className="mt-1 text-sm text-ink-600">Capstone + hackathon portfolio, verified skills, and interview-readiness for {spec.salary?.india} roles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* delivery model */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">How it&apos;s delivered</h2>
        <p className="mt-1 text-sm text-ink-500">The Board Infinity blended model — balanced across this specialization.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map(([icon, name, sub, b], i) => (
            <div key={name} className={`rounded-xl border border-ink-200 border-t-4 ${b} bg-white p-4`}>
              <div className="text-2xl">{icon}</div>
              <p className="mt-1 font-bold text-ink-900">{name}</p>
              <p className="text-xs text-ink-500">{sub}</p>
              <p className="mt-2 text-xs font-black text-brand-600">{[spec.mix.ASYNC, spec.mix.SYNC, spec.mix.MASTERCLASS, spec.mix.HACKATHON, spec.mix.CAPSTONE][i]}%</p>
            </div>
          ))}
        </div>
      </section>

      <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-brand-50 p-6">
        <div>
          <p className="font-black text-ink-900">Ready to start {spec.role}?</p>
          <p className="text-sm text-ink-600">Take the 2-minute diagnostic — we&apos;ll tailor the journey to your current level and pace.</p>
        </div>
        <Link href={`/diagnostic?role=${spec.slug}`} className="btn-primary">Start diagnostic →</Link>
      </div>
    </div>
  );
}
