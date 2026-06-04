"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Radar from "./Radar";
import { WeeklyLoadChart, PhaseChart } from "./PlanCharts";
import modulesAll from "../data/modules.json";
import coursesAll from "../data/courses.json";
import { alternativesFor } from "../lib/engine";
import { sbSelect } from "../lib/supabase";

const PHASE_CLS = {
  "Foundation": "border-l-sky-500", "Core Build": "border-l-brand-500",
  "Specialization": "border-l-violet-500", "Career Launch": "border-l-rose-500",
};
const PHASE_TEXT = {
  "Foundation": "text-sky-400", "Core Build": "text-brand-400",
  "Specialization": "text-violet-400", "Career Launch": "text-rose-400",
};
const LEVEL = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_CLS = ["bg-emerald-900/60 text-emerald-300", "bg-sky-900/60 text-sky-300", "bg-violet-900/60 text-violet-300"];
const slugOf = Object.fromEntries(coursesAll.map((c) => [c.title, c.slug]));

function bumpStreak() {
  try {
    const today = new Date().toDateString();
    const s = JSON.parse(localStorage.getItem("pf_streak") || "{}");
    if (s.lastDay === today) return;
    const yest = new Date(Date.now() - 864e5).toDateString();
    localStorage.setItem("pf_streak", JSON.stringify({ lastDay: today, count: s.lastDay === yest ? (s.count || 0) + 1 : 1 }));
  } catch {}
}

function weekDates(n) {
  const start = new Date(Date.now() + (n - 1) * 7 * 864e5);
  const end = new Date(start.getTime() + 6 * 864e5);
  const f = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${f(start)} – ${f(end)}`;
}

// Live curriculum preview for a module (videos/readings from Supabase)
function ModulePreview({ course, num }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    sbSelect("pf_items", `course=eq.${encodeURIComponent(course)}&module_num=eq.${encodeURIComponent(num)}&order=id&limit=40`)
      .then(setItems).catch(() => setItems([]));
  }, [course, num]);
  if (!items) return <p className="mt-2 animate-pulse text-xs text-slate-500">Loading curriculum…</p>;
  return (
    <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto border-t border-slate-800 pt-2">
      {items.map((i) => (
        <li key={i.id} className="flex items-baseline gap-2 text-xs text-slate-400">
          <span>{i.item_type === "Video" ? "▶" : i.item_type === "Reading" ? "📄" : "✏️"}</span>
          <span className="flex-1">{i.item_type}: {i.title}</span>
          {i.duration && <span className="text-slate-600">{i.duration}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function WeekPlan({ plan, planKey }) {
  const [done, setDone] = useState({});       // week-level
  const [itemDone, setItemDone] = useState({}); // item-level
  const [swaps, setSwaps] = useState({});
  const [removed, setRemoved] = useState({});   // moduleId -> true (user removed)
  const [added, setAdded] = useState({});       // weekN -> [module]
  const [swapOpen, setSwapOpen] = useState(null);
  const [addOpen, setAddOpen] = useState(null); // weekN with add-search open
  const [addQuery, setAddQuery] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(`pf_progress_${planKey}`) || "{}"));
      setItemDone(JSON.parse(localStorage.getItem(`pf_items_${planKey}`) || "{}"));
      const e = JSON.parse(localStorage.getItem(`pf_edits_${planKey}`) || "{}");
      setSwaps(e.swaps || {}); setRemoved(e.removed || {}); setAdded(e.added || {});
      // register as active journey immediately (powers Jobs match %, Dashboard, Portfolio)
      const prog = JSON.parse(localStorage.getItem(`pf_progress_${planKey}`) || "{}");
      localStorage.setItem("pf_active_plan", JSON.stringify({
        key: planKey, totalWeeks: plan.totalWeeks, hoursPerWeek: plan.hoursPerWeek, ts: Date.now(),
        deliverables: plan.weeks.filter((w) => prog[w.n]).map((w) => w.deliverable),
      }));
    } catch {}
  }, [planKey, plan]);

  function persistEdits(s, r, a) {
    try { localStorage.setItem(`pf_edits_${planKey}`, JSON.stringify({ swaps: s, removed: r, added: a })); } catch {}
  }
  function removeModule(id) {
    const r = { ...removed, [id]: !removed[id] };
    setRemoved(r); persistEdits(swaps, r, added);
  }
  function addModule(wn, m) {
    const lite = { id: m.id, course: m.course, num: m.num, title: m.title, hours: m.hours, skills: m.skills.slice(0, 4), videos: m.videos, lessons: m.lessons, level: m.level };
    const a = { ...added, [wn]: [...(added[wn] || []), lite] };
    setAdded(a); persistEdits(swaps, removed, a); setAddOpen(null); setAddQuery("");
  }
  function unAdd(wn, id) {
    const a = { ...added, [wn]: (added[wn] || []).filter((x) => x.id !== id) };
    setAdded(a); persistEdits(swaps, removed, a);
  }
  function resetEdits() {
    setSwaps({}); setRemoved({}); setAdded({}); persistEdits({}, {}, {});
  }
  const editCount = Object.values(removed).filter(Boolean).length + Object.values(added).flat().length + Object.values(swaps).filter(Boolean).length;
  const searchResults = useMemo(() => {
    if (!addQuery || addQuery.length < 3) return [];
    const q = addQuery.toLowerCase();
    return modulesAll.filter((m) => m.title.toLowerCase().includes(q) || m.course.toLowerCase().includes(q) || m.skills.some((s) => s.toLowerCase().includes(q))).slice(0, 6);
  }, [addQuery]);

  function persist(weeks, items) {
    try {
      localStorage.setItem(`pf_progress_${planKey}`, JSON.stringify(weeks));
      localStorage.setItem(`pf_items_${planKey}`, JSON.stringify(items));
      localStorage.setItem("pf_active_plan", JSON.stringify({
        key: planKey, totalWeeks: plan.totalWeeks, hoursPerWeek: plan.hoursPerWeek, ts: Date.now(),
        deliverables: plan.weeks.filter((w) => weeks[w.n]).map((w) => w.deliverable),
      }));
    } catch {}
  }
  function toggleWeek(wn) {
    const next = { ...done, [wn]: !done[wn] };
    setDone(next); bumpStreak(); persist(next, itemDone);
  }
  function toggleItem(id, wn, week) {
    const next = { ...itemDone, [id]: !itemDone[id] };
    // auto-complete week when every item in it is done
    const ids = [...week.async.map((a) => a.id), ...week.sync.map((_, i) => `${wn}-sync-${i}`), ...(week.project ? [`${wn}-proj`] : [])];
    const allDone = ids.every((x) => next[x]);
    const nextWeeks = { ...done, [wn]: allDone };
    setItemDone(next); setDone(nextWeeks); bumpStreak(); persist(nextWeeks, next);
  }
  function weekPct(w) {
    const ids = [...w.async.map((a) => a.id), ...w.sync.map((_, i) => `${w.n}-sync-${i}`), ...(w.project ? [`${w.n}-proj`] : [])];
    if (!ids.length) return done[w.n] ? 100 : 0;
    return Math.round((ids.filter((x) => itemDone[x]).length / ids.length) * 100);
  }
  function doSwap(origId, alt) {
    setSwaps((s) => ({ ...s, [origId]: alt ? { id: alt.id, course: alt.course, num: alt.num, title: alt.title, hours: alt.hours, skills: alt.skills.slice(0, 4), videos: alt.videos, lessons: alt.lessons, level: alt.level } : undefined }));
    setSwapOpen(null);
  }

  const doneCount = useMemo(() => plan.weeks.filter((w) => done[w.n]).length, [done, plan]);
  const progress = Math.round((doneCount / plan.totalWeeks) * 100);
  const projected = useMemo(() => {
    const d = new Date(Date.now() + (plan.totalWeeks - doneCount) * 7 * 864e5);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" });
  }, [doneCount, plan]);

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
        <button onClick={() => window.print()} className="btn-ghost text-xs">🖨 Print / save PDF</button>
        <a className="btn-ghost text-xs" target="_blank" rel="noreferrer"
          href={`https://wa.me/?text=${encodeURIComponent(`My ${plan.totalWeeks}-week learning journey on PathFinder AI by Board Infinity — ${plan.totalHours} hours, ${plan.moduleCount} modules. Build yours: https://infyskill.vercel.app/diagnostic`)}`}>Share on WhatsApp</a>
        <a className="btn-ghost text-xs" target="_blank" rel="noreferrer"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://infyskill.vercel.app/diagnostic")}`}>Share on LinkedIn</a>
        <span className="ml-auto text-xs text-slate-500">📅 Projected completion: <span className="text-slate-300">{projected}</span></span>
        {editCount > 0 && (
          <span className="flex items-center gap-2 text-xs">
            <span className="chip bg-brand-900/60 text-brand-300">✏️ Customized · {editCount} edit{editCount > 1 ? "s" : ""}</span>
            <button onClick={resetEdits} className="text-slate-500 hover:text-white">reset</button>
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[["Weeks", plan.totalWeeks], ["Total hours", plan.totalHours], ["Modules", plan.moduleCount],
          ["From courses", plan.courseCount], ["Hrs/week", plan.hoursPerWeek], ["Progress", `${progress}%`]].map(([l, v]) => (
          <div key={l} className="card p-3 text-center">
            <div className="text-xl font-bold text-white">{v}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{l}</div>
          </div>
        ))}
      </div>

      <div className="card mt-4 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Blend (evidence-based: ~40% async · ~25% live · ~20% project · rest masterclass/coaching/assessment)</p>
        <div className="mt-2 flex h-4 w-full overflow-hidden rounded">
          <div className="bg-brand-500" style={{ width: `${plan.blend.async}%` }} />
          <div className="bg-violet-500" style={{ width: `${plan.blend.sync}%` }} />
          <div className="bg-rose-500" style={{ width: `${plan.blend.project}%` }} />
          <div className="bg-fuchsia-500" style={{ width: `${plan.blend.masterclassCoaching}%` }} />
          <div className="bg-slate-500" style={{ width: `${plan.blend.assessment}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-500" />Async {plan.blend.async}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-500" />Live sync {plan.blend.sync}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Hackathon+Capstone {plan.blend.project}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-fuchsia-500" />Masterclass+Coach {plan.blend.masterclassCoaching}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-500" />Assessment {plan.blend.assessment}%</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {plan.radar?.length >= 3 && (
          <div className="card p-4">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Skill coverage radar — plan (filled) vs role target (dashed)</p>
            <Radar data={plan.radar} />
          </div>
        )}
        <div className="card flex flex-col justify-center p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Effort by phase</p>
          <div className="mt-3"><PhaseChart weeks={plan.weeks} /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Weekly load (hours, stacked by type)</p>
          <div className="mt-2"><WeeklyLoadChart weeks={plan.weeks} hoursPerWeek={plan.hoursPerWeek} /></div>
          <p className="mt-1 text-[10px] text-slate-500">🏆 hackathon week · 🎓 capstone weeks</p>
        </div>
      </div>

      <div className="card mt-6 border-slate-700 p-4 text-xs text-slate-400 print:hidden">
        <span className="font-semibold text-slate-200">How to read your week:</span> tick each item as you finish it — the week completes itself.
        <span className="text-brand-300"> Async</span> = recorded modules (▶ preview the exact videos) ·
        <span className="text-violet-300"> Live sync</span> = scheduled cohort sessions ·
        <span className="text-emerald-300"> Deliverable</span> = what you submit by Sunday ·
        <span className="text-slate-300"> ⇄ swap</span> = replace a module with an equivalent.
        Suggested rhythm: <span className="text-slate-300">Mon–Wed videos · Tue/Thu 8pm live · Sat deliverable · Sun review</span>.
      </div>

      <div className="mt-6 space-y-4">
        {plan.weeks.map((w) => {
          const pct = weekPct(w);
          const outcomeSkills = [...new Set(w.async.flatMap((a) => (swaps[a.id] || a).skills))].slice(0, 4);
          return (
            <div key={w.n} className={`card border-l-4 p-4 ${PHASE_CLS[w.phase]} ${done[w.n] ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => toggleWeek(w.n)} title="Mark whole week done"
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition ${done[w.n] ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-600 text-slate-300 hover:border-brand-500"}`}>
                  {done[w.n] ? "✓" : w.n}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Week {w.n} · {w.theme}</p>
                  <p className="text-[11px]">
                    <span className={`font-semibold uppercase tracking-wide ${PHASE_TEXT[w.phase]}`}>{w.phase}</span>
                    <span className="text-slate-500"> · {weekDates(w.n)} · ~{Math.round((w.asyncHours + w.sync.reduce((a, s) => a + s.hours, 0) + (w.project?.hours || 0)) * 10) / 10}h total</span>
                  </p>
                </div>
                {w.type === "hackathon" && <span className="chip bg-orange-900/60 text-orange-300">🏆 Hackathon</span>}
                {w.type === "capstone" && <span className="chip bg-rose-900/60 text-rose-300">🎓 Capstone</span>}
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded bg-slate-800">
                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[11px] text-slate-500">{pct}%</span>
                </div>
              </div>

              {w.async.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-400">▶ Async · {w.asyncHours}h self-paced · watch Mon–Wed</p>
                  <ul className="mt-1 space-y-1.5">
                    {(added[w.n] || []).map((a) => (
                      <li key={a.id} className="rounded-lg border border-dashed border-brand-800 bg-slate-950/60 px-3 py-2.5 text-sm">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <input type="checkbox" checked={!!itemDone[a.id]} onChange={() => toggleItem(a.id, w.n, w)} className="h-4 w-4 accent-emerald-500" />
                          <span className="text-slate-200">Module {a.num}: {a.title}</span>
                          <span className="chip bg-brand-900/60 text-brand-300">added by you</span>
                          <span className="text-xs text-slate-500">{a.hours}h · {a.videos} videos · from “{a.course}”</span>
                          <button onClick={() => unAdd(w.n, a.id)} className="ml-auto text-[11px] text-rose-400 hover:underline">✕ remove</button>
                        </div>
                      </li>
                    ))}
                    {w.async.map((orig) => {
                      if (removed[orig.id]) return (
                        <li key={orig.id} className="rounded-lg bg-slate-950/40 px-3 py-2 text-xs text-slate-600">
                          <span className="line-through">Module {orig.num}: {orig.title}</span> — removed by you
                          <button onClick={() => removeModule(orig.id)} className="ml-2 text-brand-400 hover:underline">↩ restore</button>
                        </li>
                      );
                      const a = swaps[orig.id] || orig;
                      const alts = swapOpen === orig.id ? alternativesFor(orig.id, modulesAll, orig.skills) : null;
                      const cslug = slugOf[a.course];
                      return (
                        <li key={orig.id} className="rounded-lg bg-slate-950/60 px-3 py-2.5 text-sm">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <input type="checkbox" checked={!!itemDone[orig.id]} onChange={() => toggleItem(orig.id, w.n, w)}
                              className="h-4 w-4 accent-emerald-500" />
                            <span className={`text-slate-200 ${itemDone[orig.id] ? "line-through opacity-60" : ""}`}>Module {a.num}: {a.title}</span>
                            <span className={`chip ${LEVEL_CLS[a.level ?? 1]}`}>{LEVEL[a.level ?? 1]}</span>
                            <span className="text-xs text-slate-500">{a.hours}h · {a.videos} videos · {a.lessons} lessons</span>
                            <span className="ml-auto flex gap-2 text-[11px]">
                              <button onClick={() => setPreview(preview === orig.id ? null : orig.id)} className="text-slate-400 hover:text-white">{preview === orig.id ? "hide" : "▶ preview"}</button>
                              <button onClick={() => setSwapOpen(swapOpen === orig.id ? null : orig.id)} className="text-brand-400 hover:underline">{swaps[orig.id] ? "↩ revert" : "⇄ swap"}</button>
                              <button onClick={() => removeModule(orig.id)} title="Remove from my plan" className="text-rose-400/80 hover:text-rose-300">✕</button>
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-500">Builds:</span>
                            {a.skills.map((s) => <span key={s} className="chip bg-slate-800/80 text-slate-300">{s}</span>)}
                            {cslug && <Link href={`/course/${cslug}`} className="ml-auto text-[11px] text-slate-500 hover:text-brand-300">from “{a.course}” →</Link>}
                          </div>
                          {preview === orig.id && <ModulePreview course={a.course} num={a.num} />}
                          {swapOpen === orig.id && (
                            <div className="mt-2 space-y-1 border-t border-slate-800 pt-2">
                              <p className="text-[11px] text-slate-500">Equivalent modules teaching the same skills:</p>
                              {swaps[orig.id] && <button onClick={() => doSwap(orig.id, null)} className="block w-full rounded bg-slate-900 px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800">↩ Restore original: {orig.title}</button>}
                              {(alts || []).filter((x) => x.id !== (swaps[orig.id]?.id)).map((alt) => {
                                const shared = alt.skills.filter((s) => orig.skills.includes(s)).length;
                                return (
                                  <button key={alt.id} onClick={() => doSwap(orig.id, alt)} className="block w-full rounded bg-slate-900 px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800">
                                    ⇄ Module {alt.num}: {alt.title}
                                    <span className="text-slate-500"> · {alt.hours}h · {LEVEL[alt.level ?? 1]} · from “{alt.course}” · </span>
                                    <span className="text-emerald-400">{shared} shared skills</span>
                                  </button>
                                );
                              })}
                              {alts && alts.length === 0 && <p className="text-xs text-slate-500">No equivalent module teaches these skills — this one&apos;s unique in the library.</p>}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-2">
                    {addOpen === w.n ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-2">
                        <input autoFocus className="input text-xs" placeholder="Search 866 modules by title, course or skill (e.g. Kubernetes, Tableau, prompt)…"
                          value={addQuery} onChange={(e) => setAddQuery(e.target.value)} />
                        <div className="mt-1 space-y-1">
                          {searchResults.map((m) => (
                            <button key={m.id} onClick={() => addModule(w.n, m)} className="block w-full rounded bg-slate-900 px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800">
                              + Module {m.num}: {m.title} <span className="text-slate-500">({m.hours}h · {m.course})</span>
                            </button>
                          ))}
                          {addQuery.length >= 3 && searchResults.length === 0 && <p className="px-2 py-1 text-xs text-slate-500">No modules match.</p>}
                        </div>
                        <button onClick={() => { setAddOpen(null); setAddQuery(""); }} className="mt-1 px-2 text-[11px] text-slate-500 hover:text-white">close</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddOpen(w.n)} className="text-[11px] text-brand-400 hover:underline">+ Add a module to this week</button>
                    )}
                  </div>
                </div>
              )}

              {w.project && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">🛠 Project · ~{w.project.hours}h</p>
                  <label className="mt-1 flex items-center gap-2 rounded-lg bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                    <input type="checkbox" checked={!!itemDone[`${w.n}-proj`]} onChange={() => toggleItem(`${w.n}-proj`, w.n, w)} className="h-4 w-4 accent-emerald-500" />
                    <span className={itemDone[`${w.n}-proj`] ? "line-through opacity-60" : ""}>{w.project.title}</span>
                  </label>
                </div>
              )}

              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">🎙 Live sync · Tue/Thu 8pm IST</p>
                <ul className="mt-1 space-y-1">
                  {w.sync.map((s, i) => (
                    <li key={i}>
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input type="checkbox" checked={!!itemDone[`${w.n}-sync-${i}`]} onChange={() => toggleItem(`${w.n}-sync-${i}`, w.n, w)} className="h-4 w-4 accent-emerald-500" />
                        <span className={itemDone[`${w.n}-sync-${i}`] ? "line-through opacity-60" : ""}>{s.title} <span className="text-xs text-slate-500">({s.hours}h)</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {w.masterclass && <p className="mt-2 text-sm text-fuchsia-300">★ {w.masterclass.title} <span className="text-xs text-slate-500">({w.masterclass.hours}h)</span></p>}
              {w.assessment && <p className="mt-2 text-sm text-slate-300">✦ {w.assessment.title} <span className="text-xs text-slate-500">— pass to earn this stage&apos;s badge</span></p>}

              <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-emerald-300">
                📦 Deliverable (due Sunday): <span className="text-slate-200">{w.deliverable}</span>
              </p>
              {outcomeSkills.length > 0 && (
                <p className="mt-2 text-[11px] text-slate-500">🎯 After this week you can work with: <span className="text-slate-300">{outcomeSkills.join(" · ")}</span></p>
              )}

              {w.addons?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {w.addons.map((a, i) => (
                    <button key={i} className="chip border border-dashed border-slate-600 bg-slate-900 text-slate-300 hover:border-brand-500" title="Career Launchpad — coming soon">
                      {a.kind === "coach" ? "🧑‍🏫" : a.kind === "resume" ? "📄" : a.kind === "jobs" ? "💼" : "🎤"} {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
