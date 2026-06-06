"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { skillsByCluster } from "../../../lib/engine";
import allSpecs from "../../../data/journeys.json";
import skillMeta from "../../../data/skills.json";

const CLUSTER_OF = Object.fromEntries(skillMeta.map((s) => [s.name.toLowerCase(), s.cluster]));

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
  const [skill, setSkill] = useState(null);
  const [sources, setSources] = useState(false);

  const skillInfo = useMemo(() => {
    if (!skill) return null;
    const sl = skill.toLowerCase();
    const cluster = CLUSTER_OF[sl] || "Professional & Workplace";
    const demandRoles = allSpecs.filter((s) => s.skills.some((k) => k.toLowerCase() === sl));
    const otherRoles = demandRoles.filter((s) => s.slug !== spec.slug);
    const related = spec.skills.filter((k) => k !== skill && (CLUSTER_OF[k.toLowerCase()] || "") === cluster).slice(0, 6);
    const idx = spec.skills.indexOf(skill);
    const phase = idx < spec.skills.length / 3 ? "Foundation stage" : idx < (spec.skills.length * 2) / 3 ? "Core stage" : "Specialization stage";
    const leverage = demandRoles.length >= 6 ? "high" : demandRoles.length >= 3 ? "medium" : "focused";
    return { cluster, demand: demandRoles.length, otherRoles: otherRoles.slice(0, 6), related, phase, leverage };
  }, [skill, spec.slug, spec.skills]);

  const SkillChip = ({ s }) => (
    <button onClick={() => setSkill(skill === s ? null : s)}
      className={`chip transition ${skill === s ? "bg-brand-500 text-white" : "chip-blue hover:bg-brand-100"}`}>{s}</button>
  );

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
        <button onClick={() => setSources(true)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white hover:bg-white/25">
          ⓘ Where do these numbers come from?
        </button>
      </div>

      {sources && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4" onClick={() => setSources(false)}>
          <div className="card max-w-lg animate-fadeUp p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-ink-900">Data sources & methodology</h3>
              <button onClick={() => setSources(false)} className="text-ink-500 hover:text-ink-800">✕</button>
            </div>
            <p className="mt-2 text-sm text-ink-600">The career figures for <b>{spec.role}</b> are compiled from public, reputable sources — not invented:</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              <li className="rounded-lg bg-ink-50 p-3"><b>Demand & growth</b> <span className="text-ink-500">— “{spec.salary?.growth}”</span><br/><span className="text-xs text-ink-500">WEF Future of Jobs Report 2025 · LinkedIn Jobs on the Rise 2026 · Stanford AI Index 2026.</span></li>
              <li className="rounded-lg bg-ink-50 p-3"><b>Salary band</b> <span className="text-ink-500">— {spec.salary?.india} (India) · {spec.salary?.global} (global)</span><br/><span className="text-xs text-ink-500">Indicative ranges from 6figr, AmbitionBox, Glassdoor & Levels.fyi aggregates (entry→senior), 2025–26.</span></li>
              <li className="rounded-lg bg-ink-50 p-3"><b>India talent context</b><br/><span className="text-xs text-ink-500">NASSCOM-Deloitte AI talent reports · NITI Aayog AI economy roadmap 2025 · IndiaAI Mission.</span></li>
            </ul>
            <p className="mt-3 text-xs text-ink-400">Salary bands are indicative and vary by company, city and experience. Figures are reviewed periodically.</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/diagnostic?role=${spec.slug}`} className="btn-primary">Personalize this for me — career diagnostic →</Link>
        <Link href={`/compare?with=${spec.slug}`} className="btn-ghost">⇄ Compare with another role</Link>
      </div>

      {/* skills you'll achieve */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">Skills you&apos;ll achieve</h2>
        <p className="mt-1 text-sm text-ink-500">Grouped by area — the competency map for this role. <span className="font-bold text-brand-600">Click any skill</span> to see where it&apos;s taught.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {clusters.map(([cl, sks]) => (
            <div key={cl} className="card p-4">
              <p className="font-black text-ink-900">{cl === "General Professional" ? "Professional & Workplace" : cl}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sks.map((s) => <SkillChip key={s} s={s} />)}
              </div>
            </div>
          ))}
        </div>

        {/* skill intelligence panel (no courses — role-centric) */}
        {skill && skillInfo && (
          <div className="card mt-4 animate-fadeUp border-brand-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-ink-900">{skill}</h3>
                <p className="text-xs text-ink-500">{skillInfo.cluster} · used in the <b>{skillInfo.phase}</b> of this journey</p>
              </div>
              <button onClick={() => setSkill(null)} className="text-sm font-bold text-ink-500 hover:text-ink-800">✕ close</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-ink-50 p-3 text-center">
                <p className="text-2xl font-black text-brand-600">{skillInfo.demand}</p>
                <p className="text-[11px] text-ink-500">AI-era roles need this</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-3 text-center">
                <p className={`text-sm font-black ${skillInfo.leverage === "high" ? "text-teal-600" : skillInfo.leverage === "medium" ? "text-brand-600" : "text-ink-600"}`}>
                  {skillInfo.leverage === "high" ? "High leverage" : skillInfo.leverage === "medium" ? "Transferable" : "Specialized"}
                </p>
                <p className="text-[11px] text-ink-500">career leverage</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-3 text-center">
                <p className="text-sm font-black text-ink-800">{skillInfo.phase.split(" ")[0]}</p>
                <p className="text-[11px] text-ink-500">when you learn it</p>
              </div>
            </div>
            {skillInfo.related.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Learn alongside</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {skillInfo.related.map((s) => <button key={s} onClick={() => setSkill(s)} className="chip-blue hover:bg-brand-100">{s}</button>)}
                </div>
              </div>
            )}
            {skillInfo.otherRoles.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Opens doors to other roles</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {skillInfo.otherRoles.map((r) => <Link key={r.slug} href={`/specializations/${r.slug}`} className="chip-gray hover:bg-brand-50 hover:text-brand-600">{r.role} →</Link>)}
                </div>
                <p className="mt-2 text-xs text-ink-400">💡 {skillInfo.leverage === "high" ? "A high-leverage skill — learning it early pays off across many roles." : "Builds toward this role's specialization."}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* the journey — stages with skills gained + delivery icons (no course content) */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">Your journey to the role</h2>
        <p className="mt-1 text-sm text-ink-500">Each stage builds new skills through the blended model. Your week-by-week plan is generated in the diagnostic.</p>
        <div className="relative mt-5 space-y-4 border-l-2 border-brand-100 pl-6">
          {(() => {
            const DELIV = { Async: "▶", Sync: "🎙", Masterclass: "★", Hackathon: "🏆", Capstone: "🎓", Assessment: "✦" };
            const per = Math.ceil(clusters.length / Math.max(1, spec.stages.length));
            return spec.stages.map((st, i) => {
              const types = [...new Set(st.components.map((c) => c.type))];
              const stageSkills = clusters.slice(i * per, (i + 1) * per).flatMap(([, sks]) => sks.slice(0, 3));
              return (
                <div key={st.name} className="relative">
                  <span className="absolute -left-[31px] top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[10px] font-black text-white">{i + 1}</span>
                  <div className="card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-ink-900">{st.name}</p>
                      <div className="flex gap-1.5 text-sm" title={types.join(" · ")}>
                        {types.map((t) => <span key={t} title={t}>{DELIV[t] || "•"}</span>)}
                      </div>
                    </div>
                    {stageSkills.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600">+ Skills you gain</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {stageSkills.map((s) => <span key={s} className="chip-green">{s}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
          <div className="relative">
            <span className="absolute -left-[31px] top-2 grid h-5 w-5 place-items-center rounded-full bg-peel-500 text-[10px] text-white">🎯</span>
            <div className="card border-peel-200 bg-peel-50 p-4">
              <p className="font-black text-ink-900">🎯 Outcome — {spec.role}</p>
              <p className="mt-1 text-sm text-ink-600">Capstone + hackathon portfolio, verified skills, and interview-readiness for <b className="text-teal-600">{spec.salary?.india}</b> roles.</p>
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
