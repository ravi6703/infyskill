"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import specs from "../../data/journeys.json";

const COLORS = ["#0066CC", "#3AAE89", "#FCA106"];
const TINT = ["bg-brand-50 text-brand-700 border-brand-200", "bg-teal-50 text-teal-600 border-teal-500/30", "bg-peel-50 text-peel-700 border-peel-200"];

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
    // shared by ALL
    const shared = picked[0].skills.filter((s) => sets.every((set) => set.has(s.toLowerCase())));
    // unique to each (not in any other pick)
    const unique = picked.map((p, i) =>
      p.skills.filter((s) => !sets.some((set, j) => j !== i && set.has(s.toLowerCase())))
    );
    // pairwise overlap % (for pivot insight) — use first two
    const overlapPct = picked.map((p, i) => picked.map((q, j) => {
      if (i === j) return 100;
      const a = new Set(p.skills.map((s) => s.toLowerCase()));
      const inter = q.skills.filter((s) => a.has(s.toLowerCase())).length;
      return Math.round((inter / Math.min(p.skills.length, q.skills.length)) * 100);
    }));
    return { shared, unique, overlapPct };
  }, [picked]);

  return (
    <div>
      <h1 className="text-3xl font-black text-ink-900">Compare Specializations</h1>
      <p className="mt-2 max-w-3xl text-ink-500">Pick up to 3 roles. We compare them on <b className="text-ink-800">skills</b> — your transferable core vs each role&apos;s distinctive edge. Salary is secondary.</p>

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
          {/* role chips legend */}
          <div className="flex flex-wrap gap-3">
            {picked.map((p, i) => (
              <Link key={p.slug} href={`/specializations/${p.slug}`} className="flex items-center gap-2 text-sm font-bold text-ink-700 hover:text-brand-600">
                <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i] }} />{p.role}
              </Link>
            ))}
          </div>

          {/* shared core */}
          <div className="card border-teal-500/30 bg-teal-50 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-black text-ink-900">🔗 Shared core — your transferable foundation</h2>
              <span className="chip bg-white text-teal-600">{analysis.shared.length} skills in common</span>
            </div>
            <p className="mt-1 text-sm text-ink-600">Learn these once — they count toward <b>every</b> role you picked. This is what makes pivoting cheap.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {analysis.shared.length ? analysis.shared.map((s) => <span key={s} className="chip bg-white text-teal-600">{s}</span>)
                : <p className="text-sm text-ink-500">These roles share little — they&apos;re quite different career paths.</p>}
            </div>
          </div>

          {/* unique columns */}
          <div className={`grid gap-4 ${picked.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {picked.map((p, i) => (
              <div key={p.slug} className={`card border-t-4 p-5`} style={{ borderTopColor: COLORS[i] }}>
                <p className="font-black text-ink-900">{p.role}</p>
                <p className="mt-0.5 text-xs text-ink-500">{p.bucket}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-ink-500">Distinctive skills ({analysis.unique[i].length})</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {analysis.unique[i].slice(0, 14).map((s) => <span key={s} className="chip-gray">{s}</span>)}
                </div>
                <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-400">💰 {p.salary?.india} · {p.weeks} wks typical</p>
                <Link href={`/specializations/${p.slug}`} className="mt-2 inline-block text-sm font-bold text-brand-600 hover:underline">Open specialization →</Link>
              </div>
            ))}
          </div>

          {/* pivot insight */}
          <div className="card border-brand-200 p-5">
            <h2 className="text-lg font-black text-ink-900">↔ How close are these careers?</h2>
            <p className="mt-1 text-sm text-ink-500">Skill overlap between each pair — higher means an easier switch.</p>
            <div className="mt-4 space-y-2">
              {picked.map((p, i) => picked.map((q, j) => {
                if (j <= i) return null;
                const pct = analysis.overlapPct[i][j];
                return (
                  <div key={`${i}-${j}`} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 truncate text-xs font-bold text-ink-700">{p.role.split(" ")[0]} ↔ {q.role.split(" ")[0]}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-teal-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-24 text-right text-xs font-bold text-ink-800">{pct}% shared {pct >= 50 ? "· short hop" : pct >= 30 ? "· moderate" : "· big jump"}</span>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
