"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import courses from "../../data/courses.json";
import upcoming from "../../data/upcoming.json";

const domains = [...new Set(courses.map((c) => c.domain))].sort();

export default function Catalog() {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [level, setLevel] = useState("");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return courses.filter((c) =>
      (!domain || c.domain === domain) &&
      (!level || c.proficiency === level) &&
      (!ql || c.title.toLowerCase().includes(ql) || c.skills.some((s) => s.toLowerCase().includes(ql)))
    );
  }, [q, domain, level]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">Course Catalog</h1>
      <p className="mt-2 text-slate-400">{courses.length} recorded courses, searchable by title or any of 3,650 skill tags. {upcoming.length} more in production.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <input className="input max-w-md" placeholder="Search by title or skill (e.g. LangGraph, Power BI, RAG)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="">All domains</option>
          {domains.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className="input w-auto" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          {["Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <p className="mt-4 text-sm text-slate-500">{filtered.length} courses</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link key={c.slug} href={`/course/${c.slug}`} className="card group p-5 transition hover:border-brand-500">
            <h3 className="line-clamp-2 font-bold text-white group-hover:text-brand-300">{c.title}</h3>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="chip bg-brand-900/60 text-brand-300">{c.domain}</span>
              <span className="chip bg-slate-800 text-slate-300">{c.proficiency}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.skills.slice(0, 5).map((s) => <span key={s} className="chip bg-slate-800/70 text-slate-400">{s}</span>)}
            </div>
          </Link>
        ))}
      </div>
      <section className="mt-12">
        <h2 className="text-xl font-bold text-white">In production (upcoming 30)</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((u) => (
            <div key={u} className="card border-sky-900/50 px-4 py-2.5 text-sm text-sky-200">{u}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
