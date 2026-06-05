"use client";
import { useMemo, useState } from "react";
import journeys from "../../data/journeys.json";
import modules from "../../data/modules.json";
import { buildWeekPlan, clustersFor, skillsByCluster } from "../../lib/engine";
import WeekPlan from "../../components/WeekPlan";
import Radar from "../../components/Radar";
import { ScoreRing } from "../../components/PlanCharts";
import { sbInsert } from "../../lib/supabase";

const LEVELS = ["New to this", "Basics", "Comfortable", "Strong"];
const BACKGROUNDS = [["student", "🎓 Student (final year)"], ["fresher", "🌱 Fresher / recent graduate"], ["working", "💼 Working professional"], ["switcher", "🔄 Career switcher"], ["freelancer", "🚀 Freelancer / founder"]];
const EXPERIENCE = [["0", "No experience"], ["1-3", "1–3 years"], ["3-7", "3–7 years"], ["7+", "7+ years"]];
const EDUCATION = [["eng", "Engineering / CS / Science"], ["biz", "Commerce / Business"], ["other", "Arts / Other"]];
const TIMELINES = [["3", "3 months", 13], ["6", "6 months", 26], ["12", "12 months", 52]];
const STYLES = [["project", "🛠 Project-first (build early, learn by doing)"], ["structured", "📚 Structured (concepts first, then build)"]];
const GOALS = [["switch", "Switch career"], ["upskill", "Upskill in current role"], ["first-job", "First job"], ["freelance", "Freelance / side income"]];

const ORDER = ["Core AI Engineering", "Data Careers", "Product, Strategy & Governance", "Security", "AI-Augmented Business Functions", "Emerging & Specialist"];

export default function Diagnostic() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ background: null, exp: null, edu: null, currentRole: "" });
  const [role, setRole] = useState(null);
  const [timeline, setTimeline] = useState("6");
  const [ratings, setRatings] = useState({});
  const [tools, setTools] = useState([]);
  const [hpw, setHpw] = useState(10);
  const [style, setStyle] = useState("project");
  const [goal, setGoal] = useState("switch");

  // deep link: /diagnostic?role=<slug> — learner clicked a role page CTA
  useState(() => {
    if (typeof window !== "undefined") {
      const r = new URLSearchParams(window.location.search).get("role");
      if (r && journeys.some((j) => j.slug === r)) { setRole(r); setStep(1); }
    }
  });

  const journey = journeys.find((j) => j.slug === role);
  const clusters = useMemo(() => (journey ? clustersFor(journey.skills).slice(0, 7) : []), [journey]);
  const clusterSkills = useMemo(() => (journey ? Object.fromEntries(skillsByCluster(journey.skills)) : {}), [journey]);
  const roleTools = useMemo(() => (journey ? journey.skills.filter((s) => /^[A-Z]/.test(s) && s.length < 16).slice(0, 12) : []), [journey]);

  const maxWeeks = TIMELINES.find(([v]) => v === timeline)[2];
  const fastTrack = profile.exp === "3-7" || profile.exp === "7+";
  const suggestedHpw = timeline === "3" ? 15 : timeline === "12" ? 5 : 10;

  const plan = useMemo(() => {
    if (step !== 5 || !journey) return null;
    const known = clusters.filter(([cl]) => (ratings[cl] || 0) >= 2).map(([cl]) => cl);
    return buildWeekPlan(journey.skills, modules, {
      knownClusters: known, knownSkills: tools, hoursPerWeek: hpw, roleName: journey.role,
      maxWeeks, fastTrack, projectFirst: style === "project",
    });
  }, [step, journey, ratings, tools, hpw, clusters, maxWeeks, fastTrack, style]);

  // cluster score = the better of (self-rating) or (fraction of its sub-skills ticked)
  const clusterScore = (cl) => {
    const sks = clusterSkills[cl] || [];
    const ticked = sks.filter((s) => tools.includes(s)).length;
    const frac = sks.length ? ticked / sks.length : 0;
    return Math.max((ratings[cl] ?? 0) / 3, frac);
  };
  const currentRadar = useMemo(() => clusters.map(([cl]) => ({ cluster: cl, target: 100, plan: clusterScore(cl) * 100 })), [clusters, ratings, tools, clusterSkills]);
  const readiness = useMemo(() => {
    if (!clusters.length) return 0;
    return Math.round((clusters.reduce((a, [cl]) => a + clusterScore(cl), 0) / clusters.length) * 100);
  }, [clusters, ratings, tools, clusterSkills]);

  function finish() {
    setStep(5);
    if (journey) sbInsert("pf_analyses", {
      kind: "jd", input_title: `Diagnostic: ${journey.role}`,
      input_text: JSON.stringify({ profile, role, timeline, ratings, tools, hpw, style, goal }),
      result: { type: "diagnostic", role: journey.role, readiness, hpw, maxWeeks },
    }).catch(() => {});
  }

  const Btn = ({ on, children, ...p }) => (
    <button {...p} className={`btn text-sm ${on ? "bg-brand-600 text-white" : "border border-slate-700 text-slate-300 hover:border-brand-500"}`}>{children}</button>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-extrabold text-white">Career Diagnostic</h1>
      <p className="mt-1 text-sm text-slate-400">5 quick steps → a plan built for exactly you: background, experience, skills, time and goal.</p>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => <div key={s} className={`h-1.5 flex-1 rounded ${step >= s ? "bg-brand-500" : "bg-slate-800"}`} />)}
      </div>

      {step === 1 && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">1 · About you</h2>
            <p className="mt-1 text-sm text-slate-400">This calibrates the difficulty and pace of your plan.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">Where are you today?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BACKGROUNDS.map(([v, l]) => <Btn key={v} on={profile.background === v} onClick={() => setProfile((p) => ({ ...p, background: v }))}>{l}</Btn>)}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">Total work experience</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXPERIENCE.map(([v, l]) => <Btn key={v} on={profile.exp === v} onClick={() => setProfile((p) => ({ ...p, exp: v }))}>{l}</Btn>)}
            </div>
            {fastTrack && <p className="mt-2 text-xs text-emerald-400">✓ Fast-track enabled — we&apos;ll skip beginner-level modules where your self-assessment allows.</p>}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">Education background</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EDUCATION.map(([v, l]) => <Btn key={v} on={profile.edu === v} onClick={() => setProfile((p) => ({ ...p, edu: v }))}>{l}</Btn>)}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">Current role / field (optional)</p>
            <input className="input mt-2 max-w-md" placeholder="e.g. Accounts executive, BPO team lead, B.Tech student…" value={profile.currentRole} onChange={(e) => setProfile((p) => ({ ...p, currentRole: e.target.value }))} />
          </div>
          <button disabled={!profile.background || !profile.exp} onClick={() => setStep(2)} className="btn-primary disabled:opacity-40">Continue →</button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white">2 · Your target</h2>
          <p className="mt-1 text-sm text-slate-400">Pick a role (grouped by career family) and when you want to be job-ready.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-300">Job-ready in:</span>
            {TIMELINES.map(([v, l]) => <Btn key={v} on={timeline === v} onClick={() => { setTimeline(v); setHpw(v === "3" ? 15 : v === "12" ? 5 : 10); }}>{l}</Btn>)}
          </div>
          <div className="mt-5 space-y-5">
            {ORDER.map((b) => (
              <div key={b}>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">{b}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {journeys.filter((j) => j.bucket === b).map((j) => (
                    <button key={j.slug} onClick={() => { setRole(j.slug); setStep(3); }}
                      className={`card p-3 text-left text-sm transition hover:border-brand-500 ${role === j.slug ? "border-brand-500" : ""}`}>
                      <span className="font-semibold text-white">{j.role}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{j.salary?.india} · {j.weeks} wks typical</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="btn-ghost mt-6">← Back</button>
        </div>
      )}

      {step === 3 && journey && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white">3 · Skill self-assessment for {journey.role}</h2>
          <p className="mt-1 text-sm text-slate-400">Each skill area lists the exact skills this role needs from it — rate against those, not the label.</p>
          <div className="card mt-3 p-3 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-200">How to rate yourself:</span>{" "}
            <span className="text-slate-300">New to this</span> = never touched it ·{" "}
            <span className="text-slate-300">Basics</span> = tutorials or college projects only ·{" "}
            <span className="text-emerald-300">Comfortable</span> = used in real work/projects → <span className="text-emerald-300">we skip these modules</span> ·{" "}
            <span className="text-slate-300">Strong</span> = could teach or interview on it
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr,260px]">
            <div className="space-y-3">
              {clusters.map(([cl]) => {
                const sks = clusterSkills[cl] || [];
                const shown = sks.slice(0, 6);
                const label = cl === "General Professional" ? "General & Workplace Skills" : cl;
                return (
                  <div key={cl} className="card p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex-1 text-sm font-semibold text-slate-200">{label}</span>
                      <div className="flex gap-1">
                        {LEVELS.map((l, i) => (
                          <button key={l} onClick={() => setRatings((r) => ({ ...r, [cl]: i }))}
                            className={`rounded px-2 py-1 text-[11px] transition ${(ratings[cl] ?? -1) === i ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">Tap the ones you already know:</span>
                      {shown.map((s) => (
                        <button key={s} onClick={() => setTools((x) => x.includes(s) ? x.filter((y) => y !== s) : [...x, s])}
                          className={`chip border transition ${tools.includes(s) ? "border-emerald-500 bg-emerald-900/50 text-emerald-300" : "border-slate-700 bg-slate-800/80 text-slate-400 hover:border-brand-500"}`}>
                          {tools.includes(s) ? "✓ " : ""}{s}
                        </button>
                      ))}
                      {sks.length > shown.length && <span className="text-[11px] text-slate-600">+{sks.length - shown.length} more</span>}
                    </div>
                  </div>
                );
              })}
              <div className="card p-3">
                <p className="text-sm font-semibold text-slate-200">Tools you&apos;ve already used (tap all that apply)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roleTools.map((t) => (
                    <button key={t} onClick={() => setTools((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t])}
                      className={`chip border ${tools.includes(t) ? "border-emerald-500 bg-emerald-900/50 text-emerald-300" : "border-slate-700 bg-slate-900 text-slate-300"}`}>
                      {tools.includes(t) ? "✓ " : ""}{t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="card h-fit p-4 text-center">
              <ScoreRing value={readiness} label="Current readiness" />
              <div className="mt-2"><Radar data={currentRadar} size={240} /></div>
              <p className="text-[11px] text-slate-500">Your current skills (filled) vs role target (dashed)</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(2)} className="btn-ghost">← Back</button>
            <button onClick={() => setStep(4)} className="btn-primary">Continue →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-8 space-y-6">
          <h2 className="text-lg font-bold text-white">4 · How you&apos;ll learn</h2>
          <div>
            <p className="text-sm font-semibold text-slate-300">Time you can give <span className="font-normal text-slate-500">(suggested {suggestedHpw} hrs/week for your {TIMELINES.find(([v]) => v === timeline)[1]} target)</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 10, 15].map((h) => <Btn key={h} on={hpw === h} onClick={() => setHpw(h)}>{h} hrs/week{h === suggestedHpw ? " ✦" : ""}</Btn>)}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">Learning style</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STYLES.map(([v, l]) => <Btn key={v} on={style === v} onClick={() => setStyle(v)}>{l}</Btn>)}
            </div>
            <p className="mt-1 text-xs text-slate-500">{style === "project" ? "Hackathon moves earlier in your journey — you build from week ~40%." : "Concepts build steadily; hackathon arrives after core content."}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">Your goal</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GOALS.map(([v, l]) => <Btn key={v} on={goal === v} onClick={() => setGoal(v)}>{l}</Btn>)}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="btn-ghost">← Back</button>
            <button onClick={finish} className="btn-primary">Generate my journey →</button>
          </div>
        </div>
      )}

      {step === 5 && journey && (
        <div className="mt-8">
          <div className="card border-brand-700 bg-gradient-to-br from-brand-950 to-slate-900 p-5">
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing value={readiness} label="Starting readiness" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-brand-400">Your personalized journey</p>
                <h2 className="mt-1 text-2xl font-extrabold text-white">{journey.role}</h2>
                <p className="mt-1 text-sm text-slate-300">
                  {BACKGROUNDS.find(([v]) => v === profile.background)?.[1].replace(/^[^ ]+ /, "")} · {profile.exp} yrs exp · job-ready in ~{TIMELINES.find(([v]) => v === timeline)[1]} at {hpw} hrs/week
                  {fastTrack && <span className="text-emerald-400"> · fast-track on</span>}
                  {style === "project" && <span className="text-violet-300"> · project-first</span>}
                </p>
                {journey.salary && (
                  <p className="mt-2 text-sm">🎯 Outcome: <span className="text-emerald-300">{journey.salary.india}</span> (India) · {journey.salary.global} (global) · <span className="text-slate-400">{journey.salary.growth}</span></p>
                )}
                {plan && plan.totalWeeks > maxWeeks && (
                  <p className="mt-2 text-xs text-amber-300">⚠ Full coverage needs {plan.totalWeeks} weeks — beyond your {maxWeeks}-week target. We trimmed to the highest-impact modules; increase hrs/week to cover more.</p>
                )}
              </div>
            </div>
          </div>
          {/* YOU: BEFORE → AFTER — the outcome, from the learner's side */}
          {plan && (
            <div className="card mt-4 border-emerald-900/60 p-5">
              <h3 className="text-lg font-bold text-white">Your transformation — today vs after completion</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">📍 You today</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-300">{readiness}%<span className="ml-2 text-sm font-normal text-slate-500">role-ready</span></p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-400">
                    <li>• {clusters.filter(([cl]) => (ratings[cl] || 0) >= 2).length} of {clusters.length} skill areas at working level</li>
                    <li>• No role-specific portfolio evidence yet</li>
                    <li>• Profile: {BACKGROUNDS.find(([v]) => v === profile.background)?.[1].replace(/^[^ ]+ /, "")}, {profile.exp} yrs</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-emerald-700 bg-emerald-950/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">🎯 You on {new Date(Date.now() + plan.totalWeeks * 7 * 864e5).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-300">{journey.role}<span className="ml-2 text-sm font-normal text-slate-400">interview-ready</span></p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-300">
                    <li>✓ {plan.moduleCount} modules across all {clusters.length} skill areas — verified by checkpoints</li>
                    <li>✓ Hackathon demo + coached capstone = 2 portfolio assets</li>
                    <li>✓ AI resume + mock interviews done · listed for employers</li>
                    <li>✓ Target band: <span className="text-emerald-300">{journey.salary?.india}</span> (India) · {journey.salary?.global}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {plan ? <WeekPlan plan={plan} planKey={`diag-${journey.slug}`} /> : <p className="mt-6 animate-pulse text-slate-500">Composing…</p>}
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(4)} className="btn-ghost">← Adjust preferences</button>
            <button onClick={() => setStep(3)} className="btn-ghost">← Redo self-assessment</button>
          </div>
        </div>
      )}
    </div>
  );
}
