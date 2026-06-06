"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sbSelect } from "../../../lib/supabase";

const ICON = { Video: "▶", Reading: "📄", Practice: "✏️", Assignment: "🧪", Quiz: "❓", Discussion: "💬", Lab: "🔬", Project: "🚀" };
const SIDE = ["left", "right"];

export default function CourseDetail({ course }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState(null);
  const [view, setView] = useState("skill"); // "skill" | "content"

  useEffect(() => {
    const t = encodeURIComponent(course.title);
    Promise.all([
      sbSelect("pf_modules", `course=eq.${t}&order=id`),
      sbSelect("pf_lessons", `course=eq.${t}&order=id`),
      sbSelect("pf_items", `course=eq.${t}&order=id`),
    ]).then(([modules, lessons, items]) => setData({ modules, lessons, items }))
      .catch((e) => setErr(String(e)));
  }, [course.title]);

  const totalVideos = data ? data.items.filter((i) => i.item_type === "Video").length : null;

  return (
    <div>
      <Link href="/catalog" className="text-sm font-bold text-brand-600">← Catalog</Link>

      <div className="card mt-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex gap-2">
              <span className="chip-blue">{course.domain}</span>
              <span className="chip-peel">{course.proficiency}</span>
            </div>
            <h1 className="mt-3 text-3xl font-black text-ink-900">{course.title}</h1>
          </div>
          {data && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-black text-brand-600">{data.modules.length}</p><p className="text-[11px] text-ink-500">modules</p></div>
              <div><p className="text-2xl font-black text-brand-600">{data.lessons.length}</p><p className="text-[11px] text-ink-500">lessons</p></div>
              <div><p className="text-2xl font-black text-brand-600">{totalVideos}</p><p className="text-[11px] text-ink-500">videos</p></div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Skills you&apos;ll build</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {course.skills.map((s) => <span key={s} className="chip-blue">{s}</span>)}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-ink-900">Learning Roadmap</h2>
        <div className="flex rounded-lg border border-ink-200 bg-ink-50 p-1 text-sm font-bold">
          <button onClick={() => setView("skill")} className={`rounded-md px-3 py-1.5 transition ${view === "skill" ? "bg-brand-500 text-white" : "text-ink-600 hover:text-brand-600"}`}>🎯 Skill Journey</button>
          <button onClick={() => setView("content")} className={`rounded-md px-3 py-1.5 transition ${view === "content" ? "bg-brand-500 text-white" : "text-ink-600 hover:text-brand-600"}`}>📚 Course Content</button>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        {view === "skill" ? "How your skills build, topic by topic — no curriculum, just the progression." : "The full curriculum — modules, lessons and videos."}
      </p>

      {err && <p className="mt-6 text-rose-600">Could not load roadmap: {err}</p>}
      {!data && !err && <p className="mt-6 animate-pulse text-ink-400">Building the roadmap…</p>}

      {/* SKILL JOURNEY — a skill ladder built from the course's skill set, no curriculum */}
      {data && view === "skill" && (() => {
        const JUNK = /^(beginner|intermediate|advanced|course|navigation|orientation|exam|career|introduction|overview|fundamentals|syllabus)/i;
        const sk = course.skills.filter((s) => !JUNK.test(s));
        const n = sk.length;
        const third = Math.max(1, Math.ceil(n / 3));
        const stages = [
          { name: "Foundational", icon: "1", color: "bg-brand-400", tint: "border-brand-200", skills: sk.slice(0, third), note: "Where you begin — the core concepts." },
          { name: "Core skills", icon: "2", color: "bg-brand-500", tint: "border-brand-200", skills: sk.slice(third, third * 2), note: "Apply the fundamentals to real work." },
          { name: "Advanced & applied", icon: "3", color: "bg-brand-600", tint: "border-brand-200", skills: sk.slice(third * 2), note: "Job-ready depth and specialization." },
        ].filter((s) => s.skills.length);
        let acc = 0;
        return (
          <div className="mt-6 relative space-y-4 border-l-2 border-brand-100 pl-6">
            {stages.map((st) => {
              acc += st.skills.length;
              return (
                <div key={st.name} className="relative">
                  <span className={`absolute -left-[33px] top-2 grid h-6 w-6 place-items-center rounded-full ${st.color} text-[11px] font-black text-white`}>{st.icon}</span>
                  <div className={`card border-l-4 ${st.tint} p-4`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-ink-900">{st.name}</p>
                      <span className="chip-blue">{acc}/{n} skills mastered</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">{st.note}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {st.skills.map((s) => <span key={s} className="chip-green">✓ {s}</span>)}
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all" style={{ width: `${Math.round((acc / n) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="relative">
              <span className="absolute -left-[31px] top-2 grid h-5 w-5 place-items-center rounded-full bg-peel-500 text-[10px] text-white">🎯</span>
              <div className="card border-peel-200 bg-peel-50 p-4">
                <p className="font-black text-ink-900">Job-ready — {n} skills mastered</p>
                <p className="mt-1 text-sm text-ink-600">These map directly to roles in <a href="/specializations" className="font-bold text-brand-600 hover:underline">Specializations</a>.</p>
              </div>
            </div>
          </div>
        );
      })()}

      {data && view === "content" && (
        <div className="relative mt-6">
          {/* center spine */}
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-brand-100 md:block" />
          <div className="space-y-5">
            {/* start node */}
            <div className="flex justify-center">
              <span className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-black text-white shadow-lift">Start here</span>
            </div>

            {data.modules.map((m, idx) => {
              const lessons = data.lessons.filter((l) => l.module_num === m.module_num);
              const isOpen = open === m.id;
              const side = SIDE[idx % 2];
              const mods = (m.skills || []).slice(0, 4);
              return (
                <div key={m.id} className="md:grid md:grid-cols-2 md:gap-8">
                  {/* spacer for alternating layout */}
                  {side === "right" && <div className="hidden md:block" />}
                  <div className={`relative ${side === "right" ? "md:text-left" : "md:text-right"}`}>
                    {/* node dot */}
                    <span className={`absolute top-5 hidden h-3 w-3 rounded-full border-2 border-white bg-brand-500 md:block ${side === "right" ? "-left-[18px]" : "-right-[18px]"}`} />
                    <button onClick={() => setOpen(isOpen ? null : m.id)}
                      className={`card w-full p-4 text-left transition hover:border-brand-400 hover:shadow-lift ${side === "right" ? "" : "md:text-right"}`}>
                      <div className={`flex items-center gap-2 ${side === "right" ? "" : "md:flex-row-reverse"}`}>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-black text-brand-600">{m.module_num}</span>
                        <span className="font-black text-ink-900">{m.title}</span>
                      </div>
                      <div className={`mt-2 flex flex-wrap gap-1.5 ${side === "right" ? "" : "md:justify-end"}`}>
                        {mods.map((s) => <span key={s} className="chip-gray">{s}</span>)}
                      </div>
                      <p className={`mt-2 text-xs font-bold text-brand-600`}>{lessons.length} lessons · {isOpen ? "hide" : "expand"} ▾</p>
                    </button>

                    {isOpen && (
                      <div className={`mt-2 space-y-2 ${side === "right" ? "" : "md:text-left"}`}>
                        {lessons.map((l) => {
                          const items = data.items.filter((i) => i.module_num === l.module_num && i.lesson_num === l.lesson_num);
                          return (
                            <div key={l.id} className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-left">
                              <p className="text-sm font-bold text-brand-700">Lesson {l.lesson_num}: {l.title}</p>
                              <ul className="mt-1.5 space-y-1">
                                {items.map((i) => (
                                  <li key={i.id} className="flex items-baseline gap-2 text-sm text-ink-600">
                                    <span>{ICON[i.item_type] || "•"}</span>
                                    <span className="flex-1">{i.title}</span>
                                    {i.duration && <span className="text-xs text-ink-400">{i.duration}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {side === "left" && <div className="hidden md:block" />}
                </div>
              );
            })}

            {/* finish node */}
            <div className="flex justify-center pt-2">
              <span className="rounded-full bg-peel-500 px-4 py-1.5 text-sm font-black text-white shadow-lift">🎯 Course complete — skills earned</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
