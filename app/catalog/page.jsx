"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import courses from "../../data/courses.json";

const domains = [...new Set(courses.map((c) => c.domain))].sort();
const byDomainCount = Object.fromEntries(domains.map((d) => [d, courses.filter((c) => c.domain === d).length]));
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_CHIP = { Beginner: "chip-green", Intermediate: "chip-blue", Advanced: "chip-peel" };

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
      <h1 className="text-3xl font-black text-ink-900">Course Catalog</h1>
      <p className="mt-2 text-ink-500">{courses.length} courses across {domains.length} categories. Every course is skill-tagged — open one to see its visual learning roadmap.</p>

      <div className="card mt-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <input className="input" placeholder="Search course or skill…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-full font-bold sm:w-40" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <button onClick={() => { setQ(""); setDomain(""); setLevel(""); }}
          disabled={!(domain || level || q)}
          className="rounded-full border border-ink-300 px-4 py-2 text-sm font-bold text-ink-600 transition hover:border-brand-500 hover:text-brand-600 disabled:opacity-40">
          Clear
        </button>
      </div>

      {/* category pills (single source of category filtering) */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setDomain("")} className={`chip ${!domain ? "bg-brand-500 text-white" : "chip-gray"}`}>All <span className="opacity-60">{courses.length}</span></button>
        {domains.map((d) => (
          <button key={d} onClick={() => setDomain(d)} className={`chip ${domain === d ? "bg-brand-500 text-white" : "chip-gray"}`}>
            {d} <span className="opacity-60">{byDomainCount[d]}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-ink-500">{filtered.length} courses</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link key={c.slug} href={`/course/${c.slug}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
            <div className="flex items-start justify-between gap-2">
              <span className="chip-blue">{c.domain}</span>
              <span className={LEVEL_CHIP[c.proficiency] || "chip-gray"}>{c.proficiency}</span>
            </div>
            <h3 className="mt-3 line-clamp-2 font-black text-ink-900 group-hover:text-brand-600">{c.title}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.skills.slice(0, 4).map((s) => <span key={s} className="chip-gray">{s}</span>)}
              {c.skills.length > 4 && <span className="chip-gray">+{c.skills.length - 4}</span>}
            </div>
            <span className="mt-4 text-sm font-bold text-brand-600 group-hover:underline">View roadmap →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
