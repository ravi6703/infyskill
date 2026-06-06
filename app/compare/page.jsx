"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import specs from "../../data/journeys.json";
import skillMeta from "../../data/skills.json";

const COLORS = ["#0066CC", "#3AAE89", "#FCA106"];
const CLUSTER_OF = Object.fromEntries(skillMeta.map((s) => [s.name.toLowerCase(), s.cluster]));
const shortName = (r) => r.replace(/ \(.*\)/, "").replace(/ \/.*/, "").replace(/AI[- ]?/i, "").trim().split(" ").slice(0, 2).join(" ") || r;
const salaryHigh = (s) => parseFloat((s?.india || "0").replace(/[^\d–-]/g, "").split(/[–-]/).pop() || 0);

function topCluster(skills) {
  const c = {};
  for (const s of skills) { const cl = CLUSTER_OF[s.toLowerCase()]; if (cl) c[cl] = (c[cl] || 0) + 1; }
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
}

export default function Compare() {
  const [sel, setSel] = useState(() => {
    if (typeof window !== "undefined") {
      const w = new URLSearchParams(window.location.search).get("with");
      if (w && specs.some((s) => s.slug === w)) return [w];
    }
    return [];
  });
  function toggle(slug) {
    setSel((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length < 3 ? [...s, slug] : s));
  }
  const picked = sel.map((s) => specs.find((j) => j.slug === s));

  const analysis = useMemo(() => {
    if (picked.length < 2) return null;
    const sets = picked.map((p) => new Set(p.skills.map((s) => s.toLowerCase())));
    const shared = picked[0].skills.filter((s) => sets.every((set) => set.has(s.toLowerCase())));
    const unique = picked.map((p, i) => p.skills.filter((s) => !sets.some((set, j) => j !== i && set.has(s.toLowerCase()))));
    const pairs = [];
    for (let i = 0; i < picked.length; i++) for (let j = i + 1; j < picked.length; j++) {
      const a = sets[i], b = picked[j].skills;
      const inter = b.filter((s) => a.has(s.toLowerCase())).length;
      const pct = Math.round((inter / Math.min(picked[i].skills.length, picked[j].skills.length)) * 100);
      pairs.push({ a: picked[i], b: picked[j], pct, shared: inter });
    }
    return { shared, unique, pairs };
  }, [picked]);

  const ROWS = [
    ["Career family", (p) => p.bucket],
    ["Level", (p) => p.level],
    ["Typical duration", (p) => `${p.weeks} weeks`],
    ["Salary — India", (p) => p.salary?.india, "text-teal-600 font-bold"],
    ["Salary — global", (p) => p.salary?.global],
    ["Demand signal", (p) => p.salary?.growth, "text-xs text-ink-500"],
    ["Total skills", (p) => p.skills.length],
    ["Primary focus area", (p) => topCluster(p.skills)],
    ["Distinctive skills", (p, i) => `${analysis?.unique[i].length}`],
  ];

  // best-in-row highlight for salary & duration
  const bestSalary = analysis ? Math.max(...picked.map((p) => salaryHigh(p.salary))) : 0;
  const fastest = analysis ? Math.min(...picked.map((p) => p.weeks)) : 0;

  return (
    <div>
      <h1 className="text-3xl font-black text-ink-900">Compare Specializations</h1>
      <p className="mt-2 max-w-3xl text-ink-500">Pick up to 3 roles. Compare on skills, outcomes and how easily you can pivot between them — salary is just one parameter.</p>

      <div className="card mt-6 p-4">
        <div className="flex flex-wrap gap-2">
          {specs.map((j) => {
            const i = sel.indexOf(j.slug);
            return (
              <button key={j.slug} onClick={() => toggle(j.slug)}
                className={`chip border transition ${i >= 0 ? "text-white" : "chip-gray hover:bg-brand-50"}`}
                style={i >= 0 ? { background: COLORS[i], borderColor: COLORS[i] } : {}}>
                {i >= 0 ? "✓ " : ""}{j.role}
              </button>
            );
          })}
        </div>
        {sel.length > 0 && <p className="mt-2 text-xs text-ink-400">{sel.length}/3 selected{sel.length < 2 ? " — pick at least 2 to compare" : ""}</p>}
      </div>

      {analysis && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap gap-4">
            {picked.map((p, i) => (
              <span key={p.slug} className="flex items-center gap-2 text-sm font-bold text-ink-700">
                <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i] }} />{p.role}
              </span>
            ))}
          </div>

          {/* PARAMETER MATRIX */}
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-500">Parameter</th>
                  {picked.map((p, i) => (
                    <th key={p.slug} className="px-4 py-3 text-left">
                      <Link href={`/specializations/${p.slug}`} className="font-black hover:underline" style={{ color: COLORS[i] }}>{p.role}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, fn, cls]) => (
                  <tr key={label} className="border-b border-ink-100">
                    <td className="px-4 py-2.5 text-xs font-bold text-ink-500">{label}</td>
                    {picked.map((p, i) => {
                      const val = fn(p, i);
                      const win = (label === "Salary — India" && salaryHigh(p.salary) === bestSalary) || (label === "Typical duration" && p.weeks === fastest);
                      return (
                        <td key={p.slug} className={`px-4 py-2.5 ${cls || "text-ink-800"}`}>
                          {val} {win && <span className="ml-1 chip-green">★ best</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SHARED CORE */}
          <div className="card border-teal-500/30 bg-teal-50 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-black text-ink-900">🔗 Shared core — your transferable foundation</h2>
              <span className="chip bg-white text-teal-600">{analysis.shared.length} in common</span>
            </div>
            <p className="mt-1 text-sm text-ink-600">Learn these once — they count toward every role you picked.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {analysis.shared.length ? analysis.shared.map((s) => <span key={s} className="chip bg-white text-teal-600">{s}</span>)
                : <p className="text-sm text-ink-500">Little overlap — these are quite different paths.</p>}
            </div>
          </div>

          {/* DISTINCTIVE per role */}
          <div className={`grid gap-4 ${picked.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {picked.map((p, i) => (
              <div key={p.slug} className="card border-t-4 p-5" style={{ borderTopColor: COLORS[i] }}>
                <p className="font-black text-ink-900">{p.role}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-ink-500">Only in this role ({analysis.unique[i].length})</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {analysis.unique[i].slice(0, 12).map((s) => <span key={s} className="chip-gray">{s}</span>)}
                  {analysis.unique[i].length > 12 && <span className="chip-gray">+{analysis.unique[i].length - 12}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* PIVOT — fixed labels */}
          <div className="card border-brand-200 p-5">
            <h2 className="text-lg font-black text-ink-900">↔ How easily can you pivot?</h2>
            <p className="mt-1 text-sm text-ink-500">Skill overlap between each pair — higher means an easier switch.</p>
            <div className="mt-4 space-y-3">
              {analysis.pairs.map((pr, k) => (
                <div key={k} className="flex flex-wrap items-center gap-3">
                  <span className="w-56 shrink-0 text-xs font-bold text-ink-700">{shortName(pr.a.role)} <span className="text-ink-400">↔</span> {shortName(pr.b.role)}</span>
                  <div className="h-3 min-w-[120px] flex-1 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-teal-500" style={{ width: `${pr.pct}%` }} />
                  </div>
                  <span className="w-28 text-right text-xs font-bold text-ink-800">{pr.pct}% · {pr.pct >= 50 ? "short hop" : pr.pct >= 30 ? "moderate" : "big jump"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
