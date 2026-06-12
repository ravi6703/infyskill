"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import courses from "../../data/courses.json";
import specs from "../../data/journeys.json";

const clean = (t) => t.replace(/^[:\s]+/, "");
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_CHIP = { Beginner: "chip-green", Intermediate: "chip-blue", Advanced: "chip-peel" };

// ---- DEMAND ENGINE: rank courses by how many AI-era roles actually hire for their skills ----
// skill -> set of role slugs that list it (same signal used in the course roadmap)
const SKILL_ROLES = (() => {
  const m = {};
  specs.forEach((sp) => (sp.skills || []).forEach((s) => {
    const k = s.toLowerCase(); (m[k] = m[k] || new Set()).add(sp.slug);
  }));
  return m;
})();
function demandOf(c) {
  const roles = new Set(); let hits = 0;
  (c.skills || []).forEach((s) => { const set = SKILL_ROLES[s.toLowerCase()]; if (set) { hits += set.size; set.forEach((r) => roles.add(r)); } });
  return { roles: roles.size, hits };
}
// attach demand, then rank by roles-reached, then total hits, then title
const RANKED = courses
  .map((c) => ({ ...c, _d: demandOf(c) }))
  .sort((a, b) => (b._d.roles - a._d.roles) || (b._d.hits - a._d.hits) || a.title.localeCompare(b.title));
const MAX_ROLES = Math.max(1, ...RANKED.map((c) => c._d.roles));

const byDomainCount = {};
const byDomainDemand = {};
RANKED.forEach((c) => {
  byDomainCount[c.domain] = (byDomainCount[c.domain] || 0) + 1;
  byDomainDemand[c.domain] = (byDomainDemand[c.domain] || 0) + c._d.hits;
});
// domains ordered by aggregate hiring demand (most in-demand category first)
const domains = [...new Set(courses.map((c) => c.domain))]
  .sort((a, b) => (byDomainDemand[b] || 0) - (byDomainDemand[a] || 0) || byDomainCount[b] - byDomainCount[a]);

export default function Catalog() {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [level, setLevel] = useState("");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return RANKED.filter((c) =>
      (!domain || c.domain === domain) &&
      (!level || c.proficiency === level) &&
      (!ql || c.title.toLowerCase().includes(ql) || c.skills.some((s) => s.toLowerCase().includes(ql)))
    );
  }, [q, domain, level]);

  return (
    <div>
      <h1 className="text-3xl font-black text-ink-900">Course Catalog</h1>
      <p className="mt-2 text-ink-500">{courses.length} courses across {domains.length} categories, <b className="text-ink-700">ranked by AI-era hiring demand</b> — the skills our tracked roles hire for surface first. Every course is skill-tagged; open one for its visual roadmap.</p>

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

      <p className="mt-4 text-sm text-ink-500">{filtered.length} courses · most in-demand first</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c, i) => {
          const top = !q && !domain && !level && i < 3;            // genuine top-of-catalog by demand
          const hot = c._d.roles >= 3;                              // hired-for across many roles
          return (
          <Link key={c.slug} href={`/course/${c.slug}`} className="card group relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
            <div className="flex items-start justify-between gap-2">
              <span className="chip-blue">{c.domain}</span>
              <span className={LEVEL_CHIP[c.proficiency] || "chip-gray"}>{c.proficiency}</span>
            </div>
            <h3 className="mt-3 line-clamp-2 font-black text-ink-900 group-hover:text-brand-600">{clean(c.title)}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.skills.slice(0, 4).map((s) => <span key={s} className="chip-gray">{s}</span>)}
              {c.skills.length > 4 && <span className="chip-gray">+{c.skills.length - 4}</span>}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-brand-600 group-hover:underline">View roadmap →</span>
              {c._d.roles > 0 && (
                <span className={`text-[11px] font-bold ${hot ? "text-teal-600" : "text-ink-400"}`}>
                  {hot ? "🔥 " : ""}{c._d.roles} AI-era role{c._d.roles > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {(top || hot) && (
              <span className="absolute -top-2 left-4 rounded-full bg-peel-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-card">
                {top ? "Top demand" : "In demand"}
              </span>
            )}
          </Link>
        );})}
      </div>
    </div>
  );
}
