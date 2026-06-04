"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sbSelect } from "../../../lib/supabase";

const ICON = { Video: "▶", Reading: "📄", Practice: "✏️", Assignment: "🧪", Quiz: "❓", Discussion: "💬", Lab: "🔬", Project: "🚀" };

export default function CourseDetail({ course }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const t = encodeURIComponent(course.title);
    Promise.all([
      sbSelect("pf_modules", `course=eq.${t}&order=id`),
      sbSelect("pf_lessons", `course=eq.${t}&order=id`),
      sbSelect("pf_items", `course=eq.${t}&order=id`),
    ]).then(([modules, lessons, items]) => setData({ modules, lessons, items }))
      .catch((e) => setErr(String(e)));
  }, [course.title]);

  return (
    <div>
      <Link href="/catalog" className="text-sm text-brand-400">← Catalog</Link>
      <h1 className="mt-2 text-3xl font-extrabold text-white">{course.title}</h1>
      <div className="mt-3 flex gap-2 text-xs">
        <span className="chip bg-brand-900/60 text-brand-300">{course.domain}</span>
        <span className="chip bg-slate-800 text-slate-300">{course.proficiency}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {course.skills.map((s) => <span key={s} className="chip bg-slate-800 text-slate-300">{s}</span>)}
      </div>

      {err && <p className="mt-8 text-amber-400">Could not load curriculum detail: {err}</p>}
      {!data && !err && <p className="mt-8 animate-pulse text-slate-500">Loading full curriculum with item-level skill tags…</p>}

      {data && (
        <div className="mt-8 space-y-6">
          {data.modules.map((m) => {
            const lessons = data.lessons.filter((l) => l.module_num === m.module_num);
            return (
              <details key={m.id} className="card p-4" open={false}>
                <summary className="cursor-pointer font-bold text-white">
                  Module {m.module_num}: {m.title}
                  <span className="ml-2 text-xs font-normal text-slate-400">{(m.skills || []).slice(0, 4).join(" · ")}</span>
                </summary>
                <div className="mt-3 space-y-3 pl-2">
                  {lessons.map((l) => {
                    const items = data.items.filter((i) => i.module_num === l.module_num && i.lesson_num === l.lesson_num);
                    return (
                      <div key={l.id} className="rounded-lg border border-slate-800 p-3">
                        <p className="text-sm font-semibold text-brand-300">Lesson {l.lesson_num}: {l.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{(l.skills || []).join(" · ")}</p>
                        <ul className="mt-2 space-y-1">
                          {items.map((i) => (
                            <li key={i.id} className="flex items-baseline gap-2 text-sm text-slate-300">
                              <span>{ICON[i.item_type] || "•"}</span>
                              <span className="flex-1">{i.item_type}: {i.title}</span>
                              {i.duration && <span className="text-xs text-slate-500">{i.duration}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
