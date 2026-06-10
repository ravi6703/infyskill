"use client";
import { useEffect, useMemo, useState } from "react";
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
// conditional rules: which experience options are valid for each background
const EXP_BY_BG = { student: ["0"], fresher: ["0", "1-3"], working: ["1-3", "3-7", "7+"], switcher: ["1-3", "3-7", "7+"], freelancer: ["0", "1-3", "3-7", "7+"] };
const ALL_EXP = EXPERIENCE.map(([v]) => v);
// default goals that make sense per background (first = preselected)
const GOAL_BY_BG = { student: ["first-job", "upskill"], fresher: ["first-job", "switch"], working: ["upskill", "switch"], switcher: ["switch", "first-job"], freelancer: ["freelance", "upskill"] };
const EXP_HINT = { student: "Final-year students start at no professional experience (internships count as projects in the skill check).", fresher: "Recent graduates: pick 'No experience' or up to ~1–3 years if you've interned.", working: "As a working professional, pick your years of full-time experience.", switcher: "Career switchers carry prior experience — pick your total years.", freelancer: "Count your hands-on professional/freelance years." };
const EDUCATION = [["eng", "Engineering / CS / Science"], ["biz", "Commerce / Business"], ["other", "Arts / Other"]];
const TIMELINES = [["3", "3 months", 13], ["6", "6 months", 26], ["12", "12 months", 52]];
const STYLES = [["project", "🛠 Project-first (build early, learn by doing)"], ["structured", "📚 Structured (concepts first, then build)"]];
const GOALS = [["switch", "Switch career"], ["upskill", "Upskill in current role"], ["first-job", "First job"], ["freelance", "Freelance / side income"]];

const ORDER = ["Core AI Engineering", "Data Careers", "Product, Strategy & Governance", "Security", "AI-Augmented Business Functions", "Emerging & Specialist"];
const EXCITES = [["Building & shipping systems", "Building & shipping systems"], ["Working with data & insights", "Working with data & insights"], ["Product, strategy & people", "Product, strategy & people"], ["Creative, content & design", "Creative, content & design"], ["Automating business problems", "Automating business problems"]];
const APTITUDE = [["Coding & logic", "Coding & logic"], ["Math & statistics", "Math & statistics"], ["Communication & leadership", "Communication & leadership"], ["Design & UX", "Design & UX"], ["Domain / business knowledge", "Domain / business knowledge"]];
const IMPACT = [["Cutting-edge AI", "Cutting-edge AI"], ["Data & analytics", "Data & analytics"], ["Product & business", "Product & business"], ["Security & trust", "Security & trust"], ["Marketing / HR / Finance / Ops", "Marketing / HR / Finance / Ops"]];

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
  // AI assessment state
  const [aiQs, setAiQs] = useState(null);   // null=not loaded · []=failed (fallback) · [...]=questions
  const [aiAns, setAiAns] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  // adaptive round 2
  const [round, setRound] = useState(1);
  const [aiQs2, setAiQs2] = useState(null);
  const [aiAns2, setAiAns2] = useState({});
  const [round1Scores, setRound1Scores] = useState(null);
  const [ai2Loading, setAi2Loading] = useState(false);
  // "help me find my role" state
  const [findMode, setFindMode] = useState(false);
  const [prefs, setPrefs] = useState({ excites: null, aptitude: null, impact: null });
  const [recs, setRecs] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

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

  // load an AI-generated, profile-adapted assessment when entering step 3
  useEffect(() => {
    if (step !== 3 || !journey || aiQs !== null || aiLoading) return;
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 22000); // never leave the user stuck
    (async () => {
      setAiLoading(true);
      try {
        const res = await fetch("/api/diagnostic", {
          method: "POST", headers: { "content-type": "application/json" }, signal: ctrl.signal,
          body: JSON.stringify({ action: "assess", role: journey.role, clusters: clusters.map(([cl]) => cl), profile }),
        });
        const d = await res.json();
        if (!cancelled) setAiQs(d.ok && d.questions?.length ? d.questions : []);
      } catch { if (!cancelled) setAiQs([]); }
      if (!cancelled) setAiLoading(false);
    })();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [step, journey, aiQs, aiLoading, clusters, profile]);

  function resetAssessment() { setAiQs(null); setAiAns({}); setAnalysis(null); setRound(1); setAiQs2(null); setAiAns2({}); setRound1Scores(null); }
  function pickRole(slug) { setRole(slug); resetAssessment(); setStep(3); }
  function gotoAssessment() { resetAssessment(); setStep(3); }

  const scoreRound = (qs, ans) => {
    const per = {};
    qs.forEach((q, i) => { const cl = q.cluster; per[cl] = per[cl] || { c: 0, t: 0 }; per[cl].t++; if (ans[i] === q.correct) per[cl].c++; });
    return per;
  };
  const mergeScores = (a, b) => {
    const m = JSON.parse(JSON.stringify(a || {}));
    Object.entries(b || {}).forEach(([cl, v]) => { m[cl] = m[cl] || { c: 0, t: 0 }; m[cl].c += v.c; m[cl].t += v.t; });
    return m;
  };
  function finalize(per) {
    const newRatings = {};
    Object.entries(per).forEach(([cl, { c, t }]) => { const p = t ? c / t : 0; newRatings[cl] = p >= 0.75 ? 3 : p >= 0.5 ? 2 : p >= 0.25 ? 1 : 0; });
    setRatings(newRatings);
    let tc = 0, tt = 0; Object.values(per).forEach(({ c, t }) => { tc += c; tt += t; });
    const overall = tt ? Math.round((tc / tt) * 100) : 0;
    fetch("/api/diagnostic", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "analyze", role: journey.role, profile, overall, scored: Object.entries(per).map(([cluster, { c, t }]) => ({ cluster, correct: c, total: t })) }),
    }).then((r) => r.json()).then((d) => { if (d.ok) setAnalysis(d.analysis); }).catch(() => {});
    setStep(4);
  }

  async function recommend() {
    setRecLoading(true); setRecs(null);
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "recommend", profile, prefs, roles: journeys.map((j) => ({ role: j.role, bucket: j.bucket })) }),
      });
      const d = await res.json();
      const recsWithSlug = (d.ok ? d.recommendations : []).map((r) => {
        const j = journeys.find((x) => x.role === r.role) || journeys.find((x) => x.role.toLowerCase() === r.role.toLowerCase());
        return j ? { ...r, slug: j.slug, salary: j.salary } : null;
      }).filter(Boolean);
      setRecs(recsWithSlug);
    } catch { setRecs([]); }
    setRecLoading(false);
  }

  async function submitAssessment() {
    const per1 = scoreRound(aiQs, aiAns);
    const weak = Object.entries(per1).filter(([, { c, t }]) => t > 0 && c / t < 0.5).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t).map(([cl]) => cl).slice(0, 3);
    if (weak.length === 0) { finalize(per1); return; }
    // adaptive: fetch a harder round on the weak areas
    setRound1Scores(per1); setAi2Loading(true); setAiQs2(null); setRound(2);
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "followup", role: journey.role, profile, weak }),
      });
      const d = await res.json();
      if (d.ok && d.questions?.length) setAiQs2(d.questions);
      else { finalize(per1); return; } // no follow-up available → finalize on round 1
    } catch { finalize(per1); return; }
    setAi2Loading(false);
  }
  function submitFollowup() {
    const per2 = scoreRound(aiQs2, aiAns2);
    finalize(mergeScores(round1Scores, per2));
  }

  function finish() {
    setStep(5);
    if (journey) sbInsert("pf_analyses", {
      kind: "jd", input_title: `Diagnostic: ${journey.role}`,
      input_text: JSON.stringify({ profile, role, timeline, ratings, tools, hpw, style, goal }),
      result: { type: "diagnostic", role: journey.role, readiness, hpw, maxWeeks },
    }).catch(() => {});
  }

  const Btn = ({ on, children, ...p }) => (
    <button {...p} className={`btn text-sm ${on ? "bg-brand-600 text-white" : "border border-ink-300 text-ink-600 hover:border-brand-500 hover:text-brand-600"}`}>{children}</button>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-black text-ink-900">Career Diagnostic</h1>
      <p className="mt-1 text-sm text-ink-500">5 quick steps → a plan built for exactly you: background, experience, skills, time and goal.</p>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => <div key={s} className={`h-1.5 flex-1 rounded ${step >= s ? "bg-brand-500" : "bg-ink-200"}`} />)}
      </div>

      {step === 1 && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-black text-ink-900">1 · About you</h2>
            <p className="mt-1 text-sm text-ink-500">This calibrates the difficulty and pace of your plan.</p>
          </div>
          <div>
            <p className="text-sm font-bold text-ink-700">Where are you today?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BACKGROUNDS.map(([v, l]) => (
                <Btn key={v} on={profile.background === v} onClick={() => {
                  setProfile((p) => {
                    const allow = EXP_BY_BG[v] || ALL_EXP;
                    const exp = allow.includes(p.exp) ? p.exp : (allow.length === 1 ? allow[0] : null);
                    return { ...p, background: v, exp };
                  });
                  setGoal((GOAL_BY_BG[v] || ["switch"])[0]);
                }}>{l}</Btn>
              ))}
            </div>
          </div>
          <div className={profile.background ? "" : "pointer-events-none opacity-50"}>
            <p className="text-sm font-bold text-ink-700">Total work experience {!profile.background && <span className="font-normal text-ink-400">— pick where you are first</span>}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXPERIENCE.filter(([v]) => (EXP_BY_BG[profile.background] || ALL_EXP).includes(v)).map(([v, l]) =>
                <Btn key={v} on={profile.exp === v} onClick={() => setProfile((p) => ({ ...p, exp: v }))}>{l}</Btn>)}
            </div>
            {profile.background && EXP_HINT[profile.background] && <p className="mt-2 text-xs text-ink-400">{EXP_HINT[profile.background]}</p>}
            {fastTrack && <p className="mt-1 text-xs text-teal-600">✓ Fast-track enabled — we&apos;ll skip beginner-level modules where your skill check allows.</p>}
          </div>
          <div>
            <p className="text-sm font-bold text-ink-700">Education background</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EDUCATION.map(([v, l]) => <Btn key={v} on={profile.edu === v} onClick={() => setProfile((p) => ({ ...p, edu: v }))}>{l}</Btn>)}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-ink-700">Current role / field (optional)</p>
            <input className="input mt-2 max-w-md" placeholder="e.g. Accounts executive, BPO team lead, B.Tech student…" value={profile.currentRole} onChange={(e) => setProfile((p) => ({ ...p, currentRole: e.target.value }))} />
          </div>
          <button disabled={!profile.background || !profile.exp} onClick={() => setStep(2)} className="btn-primary disabled:opacity-40">Continue →</button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8">
          <h2 className="text-lg font-black text-ink-900">2 · Your target</h2>
          <p className="mt-1 text-sm text-ink-500">Know the role you want, or let the diagnostic suggest one based on you.</p>

          {/* mode toggle */}
          <div className="mt-3 inline-flex rounded-lg border border-ink-200 bg-ink-50 p-1 text-sm font-bold">
            <button onClick={() => setFindMode(false)} className={`rounded-md px-3 py-1.5 transition ${!findMode ? "bg-brand-500 text-white" : "text-ink-600 hover:text-brand-600"}`}>I know my role</button>
            <button onClick={() => setFindMode(true)} className={`rounded-md px-3 py-1.5 transition ${findMode ? "bg-brand-500 text-white" : "text-ink-600 hover:text-brand-600"}`}>✨ Help me find my role</button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink-600">Job-ready in:</span>
            {TIMELINES.map(([v, l]) => <Btn key={v} on={timeline === v} onClick={() => { setTimeline(v); setHpw(v === "3" ? 15 : v === "12" ? 5 : 10); }}>{l}</Btn>)}
          </div>

          {/* FIND MY ROLE — AI recommends from interests */}
          {findMode ? (
            <div className="mt-5">
              <div className="card p-4 space-y-4">
                <div><p className="text-sm font-bold text-ink-700">What kind of work excites you most?</p><div className="mt-2 flex flex-wrap gap-2">{EXCITES.map(([v, l]) => <Btn key={v} on={prefs.excites === v} onClick={() => setPrefs((p) => ({ ...p, excites: v }))}>{l}</Btn>)}</div></div>
                <div><p className="text-sm font-bold text-ink-700">Your strongest aptitude?</p><div className="mt-2 flex flex-wrap gap-2">{APTITUDE.map(([v, l]) => <Btn key={v} on={prefs.aptitude === v} onClick={() => setPrefs((p) => ({ ...p, aptitude: v }))}>{l}</Btn>)}</div></div>
                <div><p className="text-sm font-bold text-ink-700">Where do you want impact?</p><div className="mt-2 flex flex-wrap gap-2">{IMPACT.map(([v, l]) => <Btn key={v} on={prefs.impact === v} onClick={() => setPrefs((p) => ({ ...p, impact: v }))}>{l}</Btn>)}</div></div>
                <button disabled={!prefs.excites || !prefs.aptitude || !prefs.impact || recLoading} onClick={recommend} className="btn-primary disabled:opacity-40">{recLoading ? "Thinking…" : "✨ Recommend roles for me →"}</button>
              </div>

              {recLoading && <div className="mt-4 grid place-items-center gap-2 py-6"><div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" /><p className="text-sm text-ink-500">Matching you to AI-era roles…</p></div>}

              {Array.isArray(recs) && recs.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Recommended for you</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {recs.map((r) => (
                      <button key={r.slug} onClick={() => pickRole(r.slug)} className="card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lift">
                        <div className="flex items-center justify-between"><span className="font-black text-ink-900">{r.role}</span><span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-black text-teal-700">{r.fit}% fit</span></div>
                        <p className="mt-1 text-xs text-ink-600">{r.why}</p>
                        {r.salary && <p className="mt-2 text-xs font-bold text-brand-600">{r.salary.india}</p>}
                        <span className="mt-2 inline-block text-xs font-bold text-brand-600">Assess me for this →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(recs) && recs.length === 0 && !recLoading && (
                <p className="mt-4 text-sm text-ink-500">Couldn&apos;t generate a recommendation — pick a role directly from the list (toggle &quot;I know my role&quot;).</p>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {ORDER.map((b) => (
                <div key={b}>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{b}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {journeys.filter((j) => j.bucket === b).map((j) => (
                      <button key={j.slug} onClick={() => pickRole(j.slug)}
                        className={`card p-3 text-left text-sm transition hover:border-brand-400 hover:shadow-lift ${role === j.slug ? "border-brand-500" : ""}`}>
                        <span className="font-bold text-ink-900">{j.role}</span>
                        <span className="mt-0.5 block text-xs text-ink-500">{j.salary?.india} · {j.weeks} wks typical</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setStep(1)} className="btn-ghost mt-6">← Back</button>
        </div>
      )}

      {step === 3 && journey && round === 1 && (aiQs === null || aiLoading) && (
        <div className="mt-8">
          <h2 className="text-lg font-black text-ink-900">3 · Skill check for {journey.role}</h2>
          <p className="mt-1 text-sm text-ink-500">Generating a short, personalised assessment for your profile…</p>
          <div className="card mt-4 grid place-items-center gap-3 p-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            <p className="text-sm text-ink-500">Writing questions adapted to a {BACKGROUNDS.find(([v]) => v === profile.background)?.[1].replace(/^[^ ]+ /, "") || "candidate"} targeting {journey.role}…</p>
          </div>
        </div>
      )}

      {/* round 2 — adaptive deeper check on weak areas */}
      {step === 3 && journey && round === 2 && (aiQs2 === null || ai2Loading) && (
        <div className="mt-8">
          <h2 className="text-lg font-black text-ink-900">3 · Deeper check — round 2</h2>
          <p className="mt-1 text-sm text-ink-500">You did well on some areas — generating a few harder questions on the ones that need a closer look…</p>
          <div className="card mt-4 grid place-items-center gap-3 p-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-peel-200 border-t-peel-600" />
            <p className="text-sm text-ink-500">Probing your weaker areas to confirm the real gaps…</p>
          </div>
        </div>
      )}

      {step === 3 && journey && round === 2 && Array.isArray(aiQs2) && aiQs2.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-black text-ink-900">Round 2 · Deeper check</h2>
          <p className="mt-1 text-sm text-ink-500">A second, <b className="text-peel-700">harder</b> round focused only on the areas you scored low — to confirm whether the gap is real before we build your plan.</p>
          <div className="mt-4 space-y-3">
            {aiQs2.map((q, i) => (
              <div key={i} className="card p-4">
                <div className="flex flex-wrap items-start gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-peel-50 text-xs font-black text-peel-700">{i + 1}</span>
                  <p className="flex-1 font-bold text-ink-900">{q.q}</p>
                  <span className="chip-gray shrink-0 text-[10px]">{q.cluster}</span>
                </div>
                <div className="mt-2 space-y-1.5 pl-8">
                  {q.options.map((o, oi) => (
                    <button key={oi} onClick={() => setAiAns2((a) => ({ ...a, [i]: oi }))}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${aiAns2[i] === oi ? "border-peel-500 bg-peel-50 text-ink-900" : "border-ink-200 bg-white text-ink-700 hover:border-peel-300"}`}>
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${aiAns2[i] === oi ? "border-peel-600 bg-peel-600 text-white" : "border-ink-300"}`}>{aiAns2[i] === oi ? "●" : ""}</span>
                      <span className="flex-1">{o}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button disabled={Object.keys(aiAns2).length < aiQs2.length} onClick={submitFollowup} className="btn-primary disabled:opacity-40">See my results →</button>
            <span className="text-xs text-ink-400">{Object.keys(aiAns2).length}/{aiQs2.length} answered</span>
          </div>
        </div>
      )}

      {step === 3 && journey && round === 1 && Array.isArray(aiQs) && aiQs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-black text-ink-900">3 · Skill check for {journey.role}</h2>
          <p className="mt-1 text-sm text-ink-500">A few questions that <b className="text-ink-700">actually test</b> where you stand — generated for your background, not self-rated. We score your answers to find the real gaps.</p>
          <div className="mt-4 space-y-3">
            {aiQs.map((q, i) => (
              <div key={i} className="card p-4">
                <div className="flex flex-wrap items-start gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-black text-brand-600">{i + 1}</span>
                  <p className="flex-1 font-bold text-ink-900">{q.q}</p>
                  <span className="chip-gray shrink-0 text-[10px]">{q.cluster}</span>
                </div>
                <div className="mt-2 space-y-1.5 pl-8">
                  {q.options.map((o, oi) => (
                    <button key={oi} onClick={() => setAiAns((a) => ({ ...a, [i]: oi }))}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${aiAns[i] === oi ? "border-brand-500 bg-brand-50 text-ink-900" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"}`}>
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${aiAns[i] === oi ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300"}`}>{aiAns[i] === oi ? "●" : ""}</span>
                      <span className="flex-1">{o}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={() => setStep(2)} className="btn-ghost">← Back</button>
            <button disabled={Object.keys(aiAns).length < aiQs.length} onClick={submitAssessment} className="btn-primary disabled:opacity-40">See my results →</button>
            <span className="text-xs text-ink-400">{Object.keys(aiAns).length}/{aiQs.length} answered</span>
          </div>
        </div>
      )}

      {/* fallback: self-rating (used only if the AI assessment is unavailable) */}
      {step === 3 && journey && Array.isArray(aiQs) && aiQs.length === 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-black text-ink-900">3 · Skill self-assessment for {journey.role}</h2>
          <p className="mt-1 text-sm text-ink-500">Rate yourself across the skill areas this role needs.</p>
          <div className="card mt-3 p-3 text-[11px] text-ink-500">
            <span className="font-bold text-ink-700">How to rate yourself:</span>{" "}
            <span className="text-ink-600">New to this</span> = never touched it ·{" "}
            <span className="text-ink-600">Basics</span> = tutorials or college projects only ·{" "}
            <span className="text-teal-600">Comfortable</span> = used in real work/projects → <span className="text-teal-600">we skip these modules</span> ·{" "}
            <span className="text-ink-600">Strong</span> = could teach or interview on it
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
                      <span className="flex-1 text-sm font-bold text-ink-800">{label}</span>
                      <div className="flex gap-1">
                        {LEVELS.map((l, i) => (
                          <button key={l} onClick={() => setRatings((r) => ({ ...r, [cl]: i }))}
                            className={`rounded px-2 py-1 text-[11px] transition ${(ratings[cl] ?? -1) === i ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-500 hover:text-brand-600"}`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-ink-400">Tap the ones you already know:</span>
                      {shown.map((s) => (
                        <button key={s} onClick={() => setTools((x) => x.includes(s) ? x.filter((y) => y !== s) : [...x, s])}
                          className={`chip border transition ${tools.includes(s) ? "border-teal-500 bg-teal-50 text-teal-700" : "border-ink-200 bg-white text-ink-600 hover:border-brand-400"}`}>
                          {tools.includes(s) ? "✓ " : ""}{s}
                        </button>
                      ))}
                      {sks.length > shown.length && <span className="text-[11px] text-ink-400">+{sks.length - shown.length} more</span>}
                    </div>
                  </div>
                );
              })}
              <div className="card p-3">
                <p className="text-sm font-bold text-ink-800">Tools you&apos;ve already used (tap all that apply)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roleTools.map((t) => (
                    <button key={t} onClick={() => setTools((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t])}
                      className={`chip border ${tools.includes(t) ? "border-teal-500 bg-teal-50 text-teal-700" : "border-ink-200 bg-white text-ink-600 hover:border-brand-400"}`}>
                      {tools.includes(t) ? "✓ " : ""}{t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="card h-fit p-4 text-center">
              <ScoreRing value={readiness} label="Current readiness" />
              <div className="mt-2"><Radar data={currentRadar} size={240} /></div>
              <p className="text-[11px] text-ink-400">Your current skills (filled) vs role target (dashed)</p>
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
          <h2 className="text-lg font-black text-ink-900">4 · How you&apos;ll learn</h2>
          <div>
            <p className="text-sm font-bold text-ink-700">Time you can give <span className="font-normal text-ink-400">(suggested {suggestedHpw} hrs/week for your {TIMELINES.find(([v]) => v === timeline)[1]} target)</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 10, 15].map((h) => <Btn key={h} on={hpw === h} onClick={() => setHpw(h)}>{h} hrs/week{h === suggestedHpw ? " ✦" : ""}</Btn>)}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-ink-700">Learning style</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STYLES.map(([v, l]) => <Btn key={v} on={style === v} onClick={() => setStyle(v)}>{l}</Btn>)}
            </div>
            <p className="mt-1 text-xs text-ink-400">{style === "project" ? "Hackathon moves earlier in your journey — you build from week ~40%." : "Concepts build steadily; hackathon arrives after core content."}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-ink-700">Your goal</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GOALS.filter(([v]) => !profile.background || (GOAL_BY_BG[profile.background] || GOALS.map(([g]) => g)).includes(v)).map(([v, l]) => <Btn key={v} on={goal === v} onClick={() => setGoal(v)}>{l}</Btn>)}
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
          <div className="card overflow-hidden border-brand-200 bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white">
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing value={readiness} label="Starting readiness" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-brand-100">Your personalized journey</p>
                <h2 className="mt-1 text-2xl font-black text-white">{journey.role}</h2>
                <p className="mt-1 text-sm text-brand-50">
                  {BACKGROUNDS.find(([v]) => v === profile.background)?.[1].replace(/^[^ ]+ /, "")} · {profile.exp} yrs exp · job-ready in ~{TIMELINES.find(([v]) => v === timeline)[1]} at {hpw} hrs/week
                  {fastTrack && <span className="text-peel-200"> · fast-track on</span>}
                  {style === "project" && <span className="text-peel-200"> · project-first</span>}
                </p>
                {journey.salary && (
                  <p className="mt-2 text-sm text-brand-50">🎯 Outcome: <span className="font-bold text-white">{journey.salary.india}</span> (India) · {journey.salary.global} (global) · {journey.salary.growth}</p>
                )}
                {plan && plan.totalWeeks > maxWeeks && (
                  <p className="mt-2 text-xs text-peel-200">⚠ Full coverage needs {plan.totalWeeks} weeks — beyond your {maxWeeks}-week target. We trimmed to the highest-impact modules; increase hrs/week to cover more.</p>
                )}
              </div>
            </div>
          </div>

          {/* AI capability read (from the scored skill-check) */}
          {analysis && (
            <div className="card mt-4 border-brand-200 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">AI capability assessment</p>
              <p className="mt-1 text-base font-bold text-ink-900">{analysis.verdict}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {analysis.strengths?.length > 0 && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600">✓ Strengths</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-ink-700">{analysis.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                  </div>
                )}
                {analysis.gaps?.length > 0 && (
                  <div className="rounded-xl border border-peel-200 bg-peel-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-peel-700">⚠ Prioritise these gaps</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-ink-700">{analysis.gaps.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                  </div>
                )}
              </div>
              {analysis.focus && <p className="mt-3 text-sm text-ink-600">🎯 <b className="text-ink-800">Where to start:</b> {analysis.focus}</p>}
            </div>
          )}

          {/* YOU: BEFORE → AFTER — the outcome, from the learner's side */}
          {plan && (
            <div className="card mt-4 p-5">
              <h3 className="text-lg font-black text-ink-900">Your transformation — today vs after completion</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-400">📍 You today</p>
                  <p className="mt-2 text-3xl font-black text-ink-700">{readiness}%<span className="ml-2 text-sm font-normal text-ink-400">role-ready</span></p>
                  <ul className="mt-3 space-y-1 text-sm text-ink-600">
                    <li>• {clusters.filter(([cl]) => (ratings[cl] || 0) >= 2).length} of {clusters.length} skill areas at working level</li>
                    <li>• No role-specific portfolio evidence yet</li>
                    <li>• Profile: {BACKGROUNDS.find(([v]) => v === profile.background)?.[1].replace(/^[^ ]+ /, "")}, {profile.exp} yrs</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-teal-300 bg-teal-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-600">🎯 You on {new Date(Date.now() + plan.totalWeeks * 7 * 864e5).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  <p className="mt-2 text-3xl font-black text-teal-700">{journey.role}<span className="ml-2 text-sm font-normal text-ink-500">interview-ready</span></p>
                  <ul className="mt-3 space-y-1 text-sm text-ink-700">
                    <li>✓ {plan.moduleCount} modules across all {clusters.length} skill areas — verified by checkpoints</li>
                    <li>✓ Hackathon demo + coached capstone = 2 portfolio assets</li>
                    <li>✓ AI resume + mock interviews done · listed for employers</li>
                    <li>✓ Target band: <span className="font-bold text-teal-700">{journey.salary?.india}</span> (India) · {journey.salary?.global}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {plan ? <WeekPlan plan={plan} planKey={`diag-${journey.slug}`} /> : <p className="mt-6 animate-pulse text-ink-400">Composing…</p>}
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(4)} className="btn-ghost">← Adjust preferences</button>
            <button onClick={gotoAssessment} className="btn-ghost">← Retake skill check</button>
          </div>
        </div>
      )}
    </div>
  );
}
