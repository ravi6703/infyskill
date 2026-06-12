"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { skillsByCluster } from "../../../lib/engine";
import allSpecs from "../../../data/journeys.json";
import skillMeta from "../../../data/skills.json";
import coaches from "../../../data/coaches.json";
import allCourses from "../../../data/courses.json";
import allModules from "../../../data/modules.json";

const CLUSTER_OF = Object.fromEntries(skillMeta.map((s) => [s.name.toLowerCase(), s.cluster]));
const normT = (t) => (t || "").replace(/^[:\s]+/, "").trim().toLowerCase();
const COURSE_BY_TITLE = Object.fromEntries(allCourses.map((c) => [normT(c.title), c]));
const MODULES_BY_COURSE = (() => { const m = {}; allModules.forEach((x) => { const k = normT(x.course); (m[k] = m[k] || []).push(x.title); }); return m; })();
const initials = (n) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
// family-level market context (indicative, India)
const MARKET = {
  "Core AI Engineering": { demand: "Very High", sectors: "Product cos, GCCs, AI-first startups, IT services" },
  "Data Careers": { demand: "High", sectors: "Analytics, BFSI, e-commerce, consulting" },
  "Security": { demand: "High", sectors: "BFSI, GovTech, SaaS, consulting" },
  "Product, Strategy & Governance": { demand: "Growing fast", sectors: "Enterprises, consulting, RegTech, GCCs" },
  "Emerging & Specialist": { demand: "Emerging", sectors: "Startups, agencies, SMBs, freelance" },
  "AI-Augmented Business Functions": { demand: "Growing fast", sectors: "Marketing, HR, Finance & Supply-chain teams" },
};

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

  // journey readiness: how much of this role's path is available today
  const allComp = spec.stages.flatMap((s) => s.components || []);
  const nAvail = allComp.filter((c) => c.status === "available").length;
  const readyPct = allComp.length ? Math.round((nAvail / allComp.length) * 100) : 0;
  const market = MARKET[spec.bucket] || { demand: "Growing", sectors: "Multiple sectors" };

  // coaches matched to this role's skill clusters
  const roleClusters = useMemo(() => {
    const c = {};
    spec.skills.forEach((s) => { const cl = CLUSTER_OF[s.toLowerCase()]; if (cl) c[cl] = (c[cl] || 0) + 1; });
    return new Set(Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cl]) => cl));
  }, [spec.skills]);
  const roleCoaches = useMemo(() =>
    coaches.map((co) => ({ co, hit: co.clusters.filter((cl) => roleClusters.has(cl)).length }))
      .filter((x) => x.hit > 0).sort((a, b) => b.hit - a.hit || b.co.years - a.co.years).slice(0, 3).map((x) => x.co),
  [roleClusters]);

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
        <p className="mt-1 text-sm text-brand-100">🔥 Market demand: <b className="text-white">{market.demand}</b> · hiring across {market.sectors}</p>
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

      {/* the full journey — week by week, with the 5-part delivery model + content availability */}
      {(() => {
        const DELIV = {
          Async:       { icon: "▶", label: "Async", cls: "border-brand-200 bg-brand-50 text-brand-700" },
          Sync:        { icon: "🎙", label: "Live Sync", cls: "border-peel-200 bg-peel-50 text-peel-700" },
          Masterclass: { icon: "★", label: "Masterclass", cls: "border-flame-200 bg-flame-50 text-flame-700" },
          Hackathon:   { icon: "🏆", label: "Hackathon", cls: "border-rose-200 bg-rose-50 text-rose-600" },
          Capstone:    { icon: "🎓", label: "Capstone", cls: "border-teal-200 bg-teal-50 text-teal-700" },
          Assessment:  { icon: "✦", label: "Assessment", cls: "border-ink-200 bg-ink-100 text-ink-600" },
        };
        const AVAIL = {
          available: { label: "✓ Available now", cls: "text-teal-600" },
          create:    { label: "⚙ Board Infinity to build", cls: "text-peel-700" },
          planned:   { label: "◔ Planned", cls: "text-ink-400" },
        };
        const weeks = spec.weeks || 24;
        const totalC = spec.stages.reduce((s, st) => s + st.components.length, 0) || 1;
        let acc = 0;
        const ranges = spec.stages.map((st) => {
          const w = Math.max(1, Math.round(weeks * st.components.length / totalC));
          const start = acc + 1; acc += w; return [start, acc];
        });
        if (acc !== weeks && ranges.length) ranges[ranges.length - 1][1] = weeks;
        const allComp = spec.stages.flatMap((s) => s.components);
        const nAvail = allComp.filter((c) => c.status === "available").length;
        const nBuild = allComp.filter((c) => c.status === "create").length;
        const nPlan = allComp.filter((c) => c.status === "planned").length;
        const per = Math.ceil(clusters.length / Math.max(1, spec.stages.length));
        const MIX = [["ASYNC", "bg-brand-500"], ["SYNC", "bg-peel-500"], ["MASTERCLASS", "bg-flame-500"], ["HACKATHON", "bg-rose-500"], ["CAPSTONE", "bg-teal-500"]];
        // the 5-part delivery model + the VALUE each part adds to the learner (the "why", not just the "what")
        const VALUE = [
          ["▶", "Self-paced", "border-t-brand-500", "Master the fundamentals anytime, at your own pace"],
          ["🎙", "Live Sync", "border-t-peel-500", "Get unblocked fast — apply live with a mentor"],
          ["★", "Masterclass", "border-t-flame-500", "See how experts actually ship it in production"],
          ["🏆", "Hackathon", "border-t-rose-500", "Prove you can perform under real pressure"],
          ["🎓", "Capstone", "border-t-teal-500", "Walk away with a portfolio-grade project"],
        ];
        return (
          <section className="mt-10">
            <h2 className="text-xl font-black text-ink-900">The full journey — week by week</h2>
            <p className="mt-1 text-sm text-ink-500">Every element mapped to Board Infinity&apos;s <b className="text-ink-700">5-part delivery model</b> · {weeks} weeks total. See the value each part adds — and what you can do after every stage. Click any item for what it covers.</p>

            {/* delivery-mix bar */}
            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full">
              {MIX.map(([k, bg]) => <div key={k} className={bg} style={{ width: `${spec.mix[k]}%` }} title={`${k} ${spec.mix[k]}%`} />)}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500">
              {MIX.map(([k, bg]) => <span key={k}><span className={`mr-1 inline-block h-2 w-2 rounded-full ${bg}`} />{k.charAt(0) + k.slice(1).toLowerCase()} {spec.mix[k]}%</span>)}
            </div>

            {/* delivery model — value each part adds */}
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              {VALUE.map(([icon, label, top, value]) => (
                <div key={label} className={`rounded-xl border border-ink-200 ${top} border-t-4 bg-white p-3`}>
                  <p className="text-sm font-black text-ink-900">{icon} {label}</p>
                  <p className="mt-1 text-xs text-ink-600">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-400">Plus <b className="text-ink-500">🤝 weekly mentorship</b> and <b className="text-ink-500">✦ skill assessments</b> woven throughout — so progress is coached and verified, not just consumed.</p>

            <div className="relative mt-5 space-y-4 border-l-2 border-brand-100 pl-6">
              {spec.stages.map((st, i) => {
                const stageSkills = clusters.slice(i * per, (i + 1) * per).flatMap(([, sks]) => sks.slice(0, 3));
                return (
                  <div key={st.name} className="relative">
                    <span className="absolute -left-[31px] top-3 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[10px] font-black text-white">{i + 1}</span>
                    <div className="card p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-black text-ink-900">{st.name}</p>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Weeks {ranges[i][0]}–{ranges[i][1]}</span>
                      </div>
                      {/* delivery components — click to see what each covers */}
                      <div className="mt-3 space-y-1.5">
                        {st.components.map((c, k) => {
                          const d = DELIV[c.type] || DELIV.Async;
                          const matched = COURSE_BY_TITLE[normT(c.content)];
                          const mods = matched ? (MODULES_BY_COURSE[normT(c.content)] || []) : [];
                          const covers = c.type === "Sync" ? `Instructor-led working sessions, code-alongs & live doubt-solving on ${stageSkills.slice(0, 3).join(", ") || st.name}.`
                            : c.type === "Masterclass" ? "A practitioner deep-dive — real-world architectures, trade-offs and war stories on this topic."
                            : c.type === "Hackathon" ? "A timed, judged build — apply the stage's skills end-to-end and demo to mentors."
                            : c.type === "Capstone" ? "A coached, portfolio-grade project applying everything in this stage."
                            : c.type === "Assessment" ? "A scored skill checkpoint to verify you've mastered this stage before moving on."
                            : "Self-paced recorded modules.";
                          return (
                            <details key={k} className="group rounded-lg border border-ink-100 bg-white">
                              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 hover:bg-ink-50">
                                <span className={`chip border ${d.cls} shrink-0`}>{d.icon} {d.label}</span>
                                <span className="min-w-0 flex-1 text-sm font-medium text-ink-800">{c.content}</span>
                                <span className="shrink-0 text-[11px] font-bold text-brand-600 group-open:hidden">what&apos;s covered ▾</span>
                                <span className="shrink-0 text-[11px] font-bold text-brand-600 hidden group-open:inline">hide ▴</span>
                              </summary>
                              <div className="border-t border-ink-100 px-3 py-2.5">
                                <p className="text-xs text-ink-600">{covers}</p>
                                {mods.length > 0 && (
                                  <>
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">Modules covered</p>
                                    <ul className="mt-1 space-y-0.5">
                                      {mods.map((m, mi) => <li key={mi} className="flex items-baseline gap-1.5 text-xs text-ink-600"><span className="text-brand-400">•</span><span>{m}</span></li>)}
                                    </ul>
                                  </>
                                )}
                                {matched && <Link href={`/course/${matched.slug}`} className="mt-2 inline-block text-xs font-bold text-brand-600 hover:underline">View full course →</Link>}
                              </div>
                            </details>
                          );
                        })}
                      </div>
                      {stageSkills.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600">+ Skills you gain</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {stageSkills.map((s) => <span key={s} className="chip-green">{s}</span>)}
                          </div>
                        </div>
                      )}
                      {/* the VALUE — what the learner can DO after this stage */}
                      {stageSkills.length > 0 && (
                        <div className="mt-3 rounded-lg bg-teal-50 px-3 py-2">
                          <p className="text-xs text-ink-700"><span className="font-black text-teal-700">✓ You&apos;ll be able to:</span> put {stageSkills.slice(0, 3).join(", ")} to work on real problems — not just learn the theory.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="relative">
                <span className="absolute -left-[31px] top-3 grid h-5 w-5 place-items-center rounded-full bg-peel-500 text-[10px] text-white">🎯</span>
                <div className="card border-peel-200 bg-peel-50 p-4">
                  <p className="font-black text-ink-900">🎯 Outcome — {spec.role}</p>
                  <p className="mt-1 text-sm text-ink-600">Capstone + hackathon portfolio, verified skills, and interview-readiness for <b className="text-teal-600">{spec.salary?.india}</b> roles.</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-ink-400">Personalise the pace and difficulty in the <Link href="/diagnostic" className="text-brand-600 hover:underline">career diagnostic</Link>.</p>
          </section>
        );
      })()}

      {/* coaches who deliver this role's live journey */}
      {roleCoaches.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-black text-ink-900">Coaches for this role</h2>
          <p className="mt-1 text-sm text-ink-500">Industry practitioners matched to this role&apos;s skills — they run the live classes, masterclasses &amp; project coaching in the journey above.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {roleCoaches.map((c, i) => {
              const leads = i === 0 ? "Masterclass" : i === 1 ? "Project coach" : "Live mentor";
              return (
                <div key={c.name} className="rounded-xl border border-ink-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lift">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-lg font-black text-brand-600">{initials(c.name)}</span>
                  <p className="mt-2 font-black text-ink-900">{c.name}</p>
                  <p className="text-xs text-ink-500">{c.title}</p>
                  <p className="text-[11px] text-ink-400">{c.company} · {c.years}+ yrs</p>
                  <span className="mt-2 inline-block chip-peel text-[10px]">Leads: {leads}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-ink-400">Representative coach profiles, matched by skill.</p>
        </section>
      )}

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
