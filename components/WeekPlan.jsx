"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Radar from "./Radar";
import { WeeklyLoadChart, PhaseChart } from "./PlanCharts";
import modulesAll from "../data/modules.json";
import coursesAll from "../data/courses.json";
import { alternativesFor } from "../lib/engine";
import { sbSelect } from "../lib/supabase";

const PHASE_DOT = { "Foundation": "bg-sky-500", "Core Build": "bg-brand-500", "Specialization": "bg-violet-500", "Career Launch": "bg-rose-500" };
const LEVEL = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_CLS = ["bg-[#E8F8F2] text-[#1A8B66]", "bg-brand-50 text-brand-600", "bg-flame-50 text-flame-600"];
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

function ModulePreview({ course, num }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    sbSelect("pf_items", `course=eq.${encodeURIComponent(course)}&module_num=eq.${encodeURIComponent(num)}&order=id&limit=40`)
      .then(setItems).catch(() => setItems([]));
  }, [course, num]);
  if (!items) return <p className="mt-2 animate-pulse text-xs text-ink-500">Loading curriculum…</p>;
  return (
    <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto border-t border-ink-200 pt-2">
      {items.map((i) => (
        <li key={i.id} className="flex items-baseline gap-2 text-xs text-ink-500">
          <span>{i.item_type === "Video" ? "▶" : i.item_type === "Reading" ? "📄" : "✏️"}</span>
          <span className="flex-1">{i.item_type}: {i.title}</span>
          {i.duration && <span className="text-ink-400">{i.duration}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function WeekPlan({ plan, planKey }) {
  const [done, setDone] = useState({});
  const [itemDone, setItemDone] = useState({});
  const [swaps, setSwaps] = useState({});
  const [removed, setRemoved] = useState({});
  const [added, setAdded] = useState({});
  const [expanded, setExpanded] = useState({});
  const [customize, setCustomize] = useState(false);
  const [swapOpen, setSwapOpen] = useState(null);
  const [addOpen, setAddOpen] = useState(null);
  const [addQuery, setAddQuery] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    try {
      const prog = JSON.parse(localStorage.getItem(`pf_progress_${planKey}`) || "{}");
      setDone(prog);
      setItemDone(JSON.parse(localStorage.getItem(`pf_items_${planKey}`) || "{}"));
      const e = JSON.parse(localStorage.getItem(`pf_edits_${planKey}`) || "{}");
      setSwaps(e.swaps || {}); setRemoved(e.removed || {}); setAdded(e.added || {});
      const next = plan.weeks.find((w) => !prog[w.n]);
      setExpanded(next ? { [next.n]: true } : {});
      localStorage.setItem("pf_active_plan", JSON.stringify({
        key: planKey, totalWeeks: plan.totalWeeks, hoursPerWeek: plan.hoursPerWeek, ts: Date.now(),
        deliverables: plan.weeks.filter((w) => prog[w.n]).map((w) => w.deliverable),
      }));
    } catch {}
  }, [planKey, plan]);

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
  function persistEdits(s, r, a) {
    try { localStorage.setItem(`pf_edits_${planKey}`, JSON.stringify({ swaps: s, removed: r, added: a })); } catch {}
  }
  function toggleWeek(wn, e) {
    e?.stopPropagation?.();
    const next = { ...done, [wn]: !done[wn] };
    setDone(next); bumpStreak(); persist(next, itemDone);
  }
  function toggleItem(id, wn, week) {
    const next = { ...itemDone, [id]: !itemDone[id] };
    const ids = [...week.async.filter((a) => !removed[a.id]).map((a) => a.id), ...(added[wn] || []).map((a) => a.id), ...week.sync.map((_, i) => `${wn}-sync-${i}`), ...(week.project ? [`${wn}-proj`] : [])];
    const allDone = ids.length > 0 && ids.every((x) => next[x]);
    const nextWeeks = { ...done, [wn]: allDone };
    setItemDone(next); setDone(nextWeeks); bumpStreak(); persist(nextWeeks, next);
  }
  function weekPct(w) {
    const ids = [...w.async.filter((a) => !removed[a.id]).map((a) => a.id), ...(added[w.n] || []).map((a) => a.id), ...w.sync.map((_, i) => `${w.n}-sync-${i}`), ...(w.project ? [`${w.n}-proj`] : [])];
    if (!ids.length) return done[w.n] ? 100 : 0;
    return Math.round((ids.filter((x) => itemDone[x]).length / ids.length) * 100);
  }
  function doSwap(origId, alt) {
    const s = { ...swaps, [origId]: alt ? { id: alt.id, course: alt.course, num: alt.num, title: alt.title, hours: alt.hours, skills: alt.skills.slice(0, 4), videos: alt.videos, lessons: alt.lessons, level: alt.level } : undefined };
    setSwaps(s); persistEdits(s, removed, added); setSwapOpen(null);
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
  const doneCount = useMemo(() => plan.weeks.filter((w) => done[w.n]).length, [done, plan]);
  const progress = Math.round((doneCount / plan.totalWeeks) * 100);
  const projected = useMemo(() => {
    const d = new Date(Date.now() + (plan.totalWeeks - doneCount) * 7 * 864e5);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" });
  }, [doneCount, plan]);
  const searchResults = useMemo(() => {
    if (!addQuery || addQuery.length < 3) return [];
    const q = addQuery.toLowerCase();
    return modulesAll.filter((m) => m.title.toLowerCase().includes(q) || m.course.toLowerCase().includes(q) || m.skills.some((s) => s.toLowerCase().includes(q))).slice(0, 6);
  }, [addQuery]);

  return (
    <div>
      {/* toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
        <button onClick={() => window.print()} className="btn-ghost text-xs">🖨 Print</button>
        <a className="btn-ghost text-xs" target="_blank" rel="noreferrer"
          href={`https://wa.me/?text=${encodeURIComponent(`My ${plan.totalWeeks}-week learning journey on InfyAI by Board Infinity — ${plan.totalHours} hours, ${plan.moduleCount} modules. Build yours: https://infyskill.vercel.app/diagnostic`)}`}>Share</a>
        <button onClick={() => { setCustomize(!customize); setSwapOpen(null); setAddOpen(null); }}
          className={`btn text-xs ${customize ? "bg-brand-600 text-ink-900" : "border border-ink-300 text-ink-700"}`}>
          ✏️ {customize ? "Done customizing" : "Customize plan"}
        </button>
        {editCount > 0 && (
          <span className="flex items-center gap-2 text-xs">
            <span className="chip bg-brand-50 text-brand-600">{editCount} edit{editCount > 1 ? "s" : ""}</span>
            <button onClick={resetEdits} className="text-ink-500 hover:text-ink-900">reset</button>
          </span>
        )}
        <span className="ml-auto text-xs text-ink-500">📅 Done by <span className="text-ink-700">{projected}</span></span>
      </div>

      {/* summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[["Weeks", plan.totalWeeks], ["Hours", plan.totalHours], ["Modules", plan.moduleCount],
          ["Courses", plan.courseCount], ["Hrs/week", plan.hoursPerWeek], ["Progress", `${progress}%`]].map(([l, v]) => (
          <div key={l} className="card p-3 text-center">
            <div className="text-xl font-bold text-ink-900">{v}</div>
            <div className="text-[11px] uppercase tracking-wide text-ink-500">{l}</div>
          </div>
        ))}
      </div>

      {/* blend + charts */}
      <div className="card mt-4 p-4">
        <div className="flex h-3.5 w-full overflow-hidden rounded">
          <div className="bg-brand-500" style={{ width: `${plan.blend.async}%` }} />
          <div className="bg-violet-500" style={{ width: `${plan.blend.sync}%` }} />
          <div className="bg-rose-500" style={{ width: `${plan.blend.project}%` }} />
          <div className="bg-fuchsia-500" style={{ width: `${plan.blend.masterclassCoaching}%` }} />
          <div className="bg-slate-500" style={{ width: `${plan.blend.assessment}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-500" />Async {plan.blend.async}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-500" />Live {plan.blend.sync}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Projects {plan.blend.project}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-fuchsia-500" />Masterclass+Coach {plan.blend.masterclassCoaching}%</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-500" />Assessment {plan.blend.assessment}%</span>
        </div>
      </div>

      <details className="card mt-4 p-4 print:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-ink-700">📊 Charts: skill radar · effort by phase · weekly load</summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {plan.radar?.length >= 3 && (
            <div>
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-ink-500">Plan (filled) vs role target (dashed)</p>
              <Radar data={plan.radar} />
            </div>
          )}
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Effort by phase</p>
            <div className="mt-3"><PhaseChart weeks={plan.weeks} /></div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-ink-500">Weekly load</p>
            <div className="mt-2"><WeeklyLoadChart weeks={plan.weeks} hoursPerWeek={plan.hoursPerWeek} /></div>
          </div>
        </div>
      </details>

      <p className="mt-5 text-xs text-ink-500 print:hidden">
        Rhythm: <span className="text-ink-700">Mon–Wed videos · Tue/Thu 8pm live · Sat deliverable</span> · tick items as you finish — weeks complete themselves · click any week to open it
      </p>

      {/* week list — collapsed by default, current week open */}
      <div className="mt-3 space-y-2">
        {plan.weeks.map((w) => {
          const pct = weekPct(w);
          const isOpen = !!expanded[w.n];
          const totalH = Math.round((w.asyncHours + w.sync.reduce((a, s) => a + s.hours, 0) + (w.project?.hours || 0)) * 10) / 10;
          const effAsync = w.async.filter((a) => !removed[a.id]);
          return (
            <div key={w.n} className={`card overflow-hidden ${done[w.n] ? "opacity-60" : ""}`}>
              {/* header row */}
              <button onClick={() => setExpanded((x) => ({ ...x, [w.n]: !x[w.n] }))}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-ink-50">
                <span onClick={(e) => toggleWeek(w.n, e)} title="Mark week done"
                  className={`grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border text-xs font-bold transition ${done[w.n] ? "border-[#1A8B66] bg-[#1A8B66] text-ink-900" : "border-ink-300 text-ink-700 hover:border-brand-500"}`}>
                  {done[w.n] ? "✓" : w.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink-900">Week {w.n} · {w.theme}</p>
                  <p className="text-[11px] text-ink-500">
                    <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${PHASE_DOT[w.phase]}`} />
                    {w.phase} · {weekDates(w.n)} · {totalH}h
                  </p>
                </div>
                {w.type === "hackathon" && <span className="chip bg-flame-50 text-flame-600">🏆</span>}
                {w.type === "capstone" && <span className="chip bg-rose-50 text-rose-600">🎓</span>}
                {w.masterclass && !isOpen && <span className="chip bg-flame-50 text-flame-600">★</span>}
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-1.5 w-14 overflow-hidden rounded bg-ink-100">
                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[11px] text-ink-500">{pct}%</span>
                </div>
                <span className="text-ink-500">{isOpen ? "▴" : "▾"}</span>
              </button>

              {isOpen && (
                <div className="border-t border-ink-200 px-4 pb-4 pt-3">
                  {(effAsync.length > 0 || (added[w.n] || []).length > 0) && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">▶ Watch · {w.asyncHours}h self-paced</p>
                      <ul className="mt-1.5 space-y-1.5">
                        {(added[w.n] || []).map((a) => (
                          <li key={a.id} className="rounded-lg border border-dashed border-brand-200 bg-ink-50 px-3 py-2 text-sm">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <input type="checkbox" checked={!!itemDone[a.id]} onChange={() => toggleItem(a.id, w.n, w)} className="h-4 w-4 accent-emerald-500" />
                              <span className="text-ink-800">{a.title}</span>
                              <span className="chip bg-brand-50 text-brand-600">added</span>
                              <span className="text-xs text-ink-500">{a.hours}h</span>
                              {customize && <button onClick={() => unAdd(w.n, a.id)} className="ml-auto text-[11px] text-rose-500 hover:underline">✕</button>}
                            </div>
                          </li>
                        ))}
                        {w.async.map((orig) => {
                          if (removed[orig.id]) {
                            if (!customize) return null;
                            return (
                              <li key={orig.id} className="rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-400">
                                <span className="line-through">{orig.title}</span> — removed
                                <button onClick={() => removeModule(orig.id)} className="ml-2 text-brand-600 hover:underline">↩ restore</button>
                              </li>
                            );
                          }
                          const a = swaps[orig.id] || orig;
                          const alts = swapOpen === orig.id ? alternativesFor(orig.id, modulesAll, orig.skills) : null;
                          const cslug = slugOf[a.course];
                          return (
                            <li key={orig.id} className="rounded-lg bg-ink-50 px-3 py-2.5 text-sm">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <input type="checkbox" checked={!!itemDone[orig.id]} onChange={() => toggleItem(orig.id, w.n, w)} className="h-4 w-4 accent-emerald-500" />
                                <span className={`text-ink-800 ${itemDone[orig.id] ? "line-through opacity-60" : ""}`}>{a.title}</span>
                                <span className={`chip ${LEVEL_CLS[a.level ?? 1]}`}>{LEVEL[a.level ?? 1]}</span>
                                <span className="text-xs text-ink-500">{a.hours}h · {a.videos} videos</span>
                                <span className="ml-auto flex gap-2.5 text-[11px]">
                                  <button onClick={() => setPreview(preview === orig.id ? null : orig.id)} className="text-ink-500 hover:text-ink-900">{preview === orig.id ? "hide" : "▶ preview"}</button>
                                  {customize && (
                                    <>
                                      <button onClick={() => setSwapOpen(swapOpen === orig.id ? null : orig.id)} className="text-brand-600 hover:underline">{swaps[orig.id] ? "↩" : "⇄ swap"}</button>
                                      <button onClick={() => removeModule(orig.id)} className="text-rose-500/80 hover:text-rose-600">✕</button>
                                    </>
                                  )}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-[11px] text-ink-500">
                                {a.skills.join(" · ")}
                                {customize && cslug && <Link href={`/course/${cslug}`} className="ml-2 text-ink-400 hover:text-brand-600">from “{a.course}” →</Link>}
                              </p>
                              {preview === orig.id && <ModulePreview course={a.course} num={a.num} />}
                              {customize && swapOpen === orig.id && (
                                <div className="mt-2 space-y-1 border-t border-ink-200 pt-2">
                                  {swaps[orig.id] && <button onClick={() => doSwap(orig.id, null)} className="block w-full rounded bg-white px-2 py-1.5 text-left text-xs text-ink-700 hover:bg-ink-100">↩ Restore: {orig.title}</button>}
                                  {(alts || []).filter((x) => x.id !== (swaps[orig.id]?.id)).map((alt) => {
                                    const shared = alt.skills.filter((s) => orig.skills.includes(s)).length;
                                    return (
                                      <button key={alt.id} onClick={() => doSwap(orig.id, alt)} className="block w-full rounded bg-white px-2 py-1.5 text-left text-xs text-ink-700 hover:bg-ink-100">
                                        ⇄ {alt.title} <span className="text-ink-500">· {alt.hours}h · {alt.course}</span> <span className="text-[#1A8B66]">{shared} shared skills</span>
                                      </button>
                                    );
                                  })}
                                  {alts && alts.length === 0 && <p className="text-xs text-ink-500">No equivalent module — this one&apos;s unique.</p>}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      {customize && (
                        <div className="mt-2">
                          {addOpen === w.n ? (
                            <div className="rounded-lg border border-ink-300 bg-ink-50 p-2">
                              <input autoFocus className="input text-xs" placeholder="Search 866 modules by title, course or skill…" value={addQuery} onChange={(e) => setAddQuery(e.target.value)} />
                              <div className="mt-1 space-y-1">
                                {searchResults.map((m) => (
                                  <button key={m.id} onClick={() => addModule(w.n, m)} className="block w-full rounded bg-white px-2 py-1.5 text-left text-xs text-ink-700 hover:bg-ink-100">
                                    + {m.title} <span className="text-ink-500">({m.hours}h · {m.course})</span>
                                  </button>
                                ))}
                                {addQuery.length >= 3 && searchResults.length === 0 && <p className="px-2 py-1 text-xs text-ink-500">No modules match.</p>}
                              </div>
                              <button onClick={() => { setAddOpen(null); setAddQuery(""); }} className="mt-1 px-2 text-[11px] text-ink-500 hover:text-ink-900">close</button>
                            </div>
                          ) : (
                            <button onClick={() => setAddOpen(w.n)} className="text-[11px] text-brand-600 hover:underline">+ Add a module to this week</button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {w.project && (
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">🛠 Build · ~{w.project.hours}h</p>
                      <label className="mt-1 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-800">
                        <input type="checkbox" checked={!!itemDone[`${w.n}-proj`]} onChange={() => toggleItem(`${w.n}-proj`, w.n, w)} className="h-4 w-4 accent-emerald-500" />
                        <span className={itemDone[`${w.n}-proj`] ? "line-through opacity-60" : ""}>{w.project.title}</span>
                      </label>
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-flame-600">🎙 Attend · Tue/Thu 8pm IST</p>
                    <ul className="mt-1 space-y-1">
                      {w.sync.map((s, i) => (
                        <li key={i}>
                          <label className="flex items-center gap-2 text-sm text-ink-700">
                            <input type="checkbox" checked={!!itemDone[`${w.n}-sync-${i}`]} onChange={() => toggleItem(`${w.n}-sync-${i}`, w.n, w)} className="h-4 w-4 accent-emerald-500" />
                            <span className={itemDone[`${w.n}-sync-${i}`] ? "line-through opacity-60" : ""}>{s.title} <span className="text-xs text-ink-500">({s.hours}h)</span></span>
                          </label>
                        </li>
                      ))}
                      {w.masterclass && <li className="text-sm text-flame-600">★ {w.masterclass.title} <span className="text-xs text-ink-500">({w.masterclass.hours}h)</span></li>}
                      {w.assessment && <li className="text-sm text-ink-700">✦ {w.assessment.title}</li>}
                    </ul>
                  </div>

                  <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5">
                    <p className="text-sm text-[#1A8B66]">📦 Submit by Sunday: <span className="text-ink-800">{w.deliverable}</span></p>
                    {effAsync.length > 0 && (
                      <p className="mt-1 text-[11px] text-ink-500">🎯 Unlocks: {[...new Set(effAsync.flatMap((a) => (swaps[a.id] || a).skills))].slice(0, 4).join(" · ")}</p>
                    )}
                  </div>

                  {w.addons?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {w.addons.map((a, i) => (
                        <button key={i} className="chip border border-dashed border-ink-300 bg-white text-ink-700 hover:border-brand-500" title="Career Launchpad — coming soon">
                          {a.kind === "coach" ? "🧑‍🏫" : a.kind === "resume" ? "📄" : a.kind === "jobs" ? "💼" : "🎤"} {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
