"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import skills from "../../data/skills.json";
import courses from "../../data/courses.json";
import modules from "../../data/modules.json";

const clusters = [...new Set(skills.map((s) => s.cluster))].sort(
  (a, b) => skills.filter((s) => s.cluster === b).length - skills.filter((s) => s.cluster === a).length
);

export default function Skills() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(clusters[0]);

  const byCluster = useMemo(() => {
    const ql = q.toLowerCase();
    const m = new Map();
    for (const s of skills) {
      if (ql && !s.name.toLowerCase().includes(ql)) continue;
      if (!m.has(s.cluster)) m.set(s.cluster, []);
      m.get(s.cluster).push(s);
    }
    return m;
  }, [q]);

  const selCourses = useMemo(() => sel ? courses.filter((c) => c.skills.includes(sel)).slice(0, 12) : [], [sel]);
  const selModules = useMemo(() => sel ? modules.filter((m) => m.skills.includes(sel)).slice(0, 12) : [], [sel]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Skill Taxonomy</h1>
      <p className="mt-2 max-w-3xl text-slate-400">
        {skills.length.toLocaleString()} canonical skills, governed and organized into {clusters.length} clusters
        (junk pseudo-tags removed, synonyms merged). Click a skill to see exactly which courses <span className="text-brand-300">and modules</span> teach it.
      </p>
      <input className="input mt-6 max-w-md" placeholder="Search skills…" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="mt-6 space-y-3">
        {clusters.map((cl) => {
          const list = byCluster.get(cl) || [];
          if (!list.length) return null;
          const isOpen = open === cl || q.length > 1;
          return (
            <div key={cl} className="card p-4">
              <button onClick={() => setOpen(isOpen ? null : cl)} className="flex w-full items-center justify-between text-left">
                <span className="font-bold text-white">{cl} <span className="ml-2 text-xs font-normal text-slate-500">{list.length} skills</span></span>
                <span className="text-slate-500">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {list.slice(0, 120).map((s) => (
                    <button key={s.name} onClick={() => setSel(s.name)}
                      className={`chip border transition ${sel === s.name ? "border-brand-500 bg-brand-900/60 text-brand-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-brand-600"}`}>
                      {s.name} <span className="opacity-50">×{s.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sel && (
        <section className="card mt-8 border-brand-700 p-5">
          <h2 className="text-lg font-bold text-white">“{sel}” — where it&apos;s taught</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">Courses ({selCourses.length})</p>
              <div className="mt-2 space-y-1.5">
                {selCourses.map((c) => (
                  <Link key={c.slug} href={`/course/${c.slug}`} className="block rounded-lg bg-slate-950/60 px-3 py-2 text-sm text-slate-200 hover:text-brand-300">{c.title}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Specific modules ({selModules.length})</p>
              <div className="mt-2 space-y-1.5">
                {selModules.map((m) => (
                  <div key={m.id} className="rounded-lg bg-slate-950/60 px-3 py-2 text-sm">
                    <span className="text-slate-200">Module {m.num}: {m.title}</span>
                    <span className="ml-2 text-xs text-slate-500">{m.hours}h · {m.course}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
