"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import skills from "../../data/skills.json";
import courses from "../../data/courses.json";

const domains = [...new Set(skills.map((s) => s.domain))].filter(Boolean).sort();

export default function Skills() {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [sel, setSel] = useState(null);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return skills.filter((s) => (!domain || s.domain === domain) && (!ql || s.name.toLowerCase().includes(ql))).slice(0, 300);
  }, [q, domain]);

  const selCourses = useMemo(() => {
    if (!sel) return [];
    return courses.filter((c) => c.skills.some((s) => s === sel)).slice(0, 20);
  }, [sel]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Skill Taxonomy</h1>
      <p className="mt-2 text-slate-400">{skills.length.toLocaleString()} canonical skills tagged across the library. Click a skill to see which courses teach it.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <input className="input max-w-md" placeholder="Search skills…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="">All domains</option>
          {domains.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {filtered.map((s) => (
          <button key={s.name} onClick={() => setSel(s.name)}
            className={`chip border transition ${sel === s.name ? "border-brand-500 bg-brand-900/60 text-brand-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-brand-600"}`}>
            {s.name} <span className="opacity-50">×{s.count}</span>
          </button>
        ))}
      </div>
      {sel && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-white">Courses teaching “{sel}”</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {selCourses.map((c) => (
              <Link key={c.slug} href={`/course/${c.slug}`} className="card px-4 py-2.5 text-sm text-slate-200 transition hover:border-brand-500">{c.title}</Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
