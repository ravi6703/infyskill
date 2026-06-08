"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

const DELIV = {
  Async:       { icon: "▶", label: "Async", cls: "bg-brand-50 text-brand-700 border-brand-200" },
  Sync:        { icon: "🎙", label: "Live Sync", cls: "bg-peel-50 text-peel-700 border-peel-200" },
  Masterclass: { icon: "★", label: "Masterclass", cls: "bg-flame-50 text-flame-700 border-flame-200" },
  Hackathon:   { icon: "🏆", label: "Hackathon", cls: "bg-rose-50 text-rose-600 border-rose-200" },
  Capstone:    { icon: "🎓", label: "Capstone", cls: "bg-teal-50 text-teal-600 border-teal-500/30" },
};
const PILLARS = [["async", "▶", "Async"], ["sync", "🎙", "Sync"], ["masterclass", "★", "Masterclass"], ["hackathon", "🏆", "Hackathon"], ["capstone", "🎓", "Capstone"]];
const BG = { async: "bg-brand-500", sync: "bg-peel-500", masterclass: "bg-flame-500", hackathon: "bg-rose-500", capstone: "bg-teal-500" };

// "Year 1 · Trimester 1" -> { year: 1, tri: "Trimester 1" }
function parse(name) {
  const ym = name.match(/Year\s+(\d+)/i);
  const tm = name.match(/(Trimester\s+\d+|Semester\s+\d+|Term\s+\d+)/i);
  return { year: ym ? +ym[1] : 1, tri: tm ? tm[1] : name };
}

function CourseRow({ c }) {
  const d = DELIV[c.delivery] || DELIV.Async;
  const partial = c.moduleCount && c.selectedCount && c.selectedCount < c.moduleCount;
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`chip border ${d.cls} shrink-0`}>{d.icon} {d.label}</span>
        <div className="min-w-0 flex-1">
          {c.slug
            ? <Link href={`/course/${c.slug}`} className="font-bold text-ink-900 hover:text-brand-600">{c.course}</Link>
            : <span className="font-bold text-ink-900">{c.course}</span>}
          <p className="text-xs text-ink-500">{c.outcome}</p>
        </div>
        {c.hours ? <span className="shrink-0 text-[11px] font-bold text-ink-400">{c.hours} hrs</span> : null}
        {c.skills?.length > 0 && (
          <div className="hidden flex-wrap gap-1 sm:flex">
            {c.skills.slice(0, 3).map((s) => <span key={s} className="chip-gray">{s}</span>)}
          </div>
        )}
      </div>

      {/* module breakdown — collapsible: which modules of the course this trimester uses */}
      {c.modules?.length > 0 && (
        <details className="mt-2.5 border-t border-ink-100 pt-2.5">
          <summary className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-400 hover:text-brand-600">
            <span>{partial ? <>Selected modules <span className="text-peel-600">({c.selectedCount} of {c.moduleCount})</span></> : <>Modules ({c.moduleCount})</>}</span>
            <span className="text-brand-500">▾</span>
          </summary>
          <ol className="mt-2 space-y-1">
            {c.modules.map((m, i) => (
              <li key={i} className="flex items-baseline gap-2 text-xs text-ink-600">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-50 text-[9px] font-black text-brand-600">{i + 1}</span>
                <span className="flex-1">{m.title}</span>
                {m.hours ? <span className="shrink-0 text-[10px] text-ink-400">{m.hours} h</span> : null}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function TriCard({ t, idx, delivery, open, onToggle }) {
  const courses = t.courses || [];
  const recorded = courses.filter((c) => c.delivery === "Async");
  const live = courses.filter((c) => c.delivery !== "Async");
  const { tri } = parse(t.name);
  return (
    <div className="relative">
      <span className={`absolute -left-[31px] top-3 grid h-5 w-5 place-items-center rounded-full text-[10px] font-black text-white transition ${open ? "bg-peel-500 scale-110" : "bg-brand-500"}`}>{idx}</span>
      <div className="card overflow-hidden">
        <button onClick={onToggle} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left hover:bg-ink-50">
          <div>
            <p className="font-black text-ink-900">{tri}</p>
            <p className="text-xs text-ink-500">
              {recorded.length} self-paced course{recorded.length !== 1 ? "s" : ""}{live.length ? <> · {live.length} live element{live.length !== 1 ? "s" : ""}</> : null}
              {t.credits ? <> · {t.credits} credits · {t.hours} hrs</> : null}
              {t.milestone && t.milestone !== "Focused term" && t.milestone !== t.themes?.[0] ? <> · milestone: <b className="text-teal-600">{t.milestone}</b></> : null}
            </p>
          </div>
          <span className="text-sm font-bold text-brand-600">{open ? "Hide ▴" : "View ▾"}</span>
        </button>

        {open && (
          <div className="animate-fadeUp border-t border-ink-100 p-4">
            {recorded.length > 0 && (
              <>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-600">▶ Self-paced courses (recorded)</p>
                <div className="space-y-2">{recorded.map((c, k) => <CourseRow key={k} c={c} />)}</div>
              </>
            )}
            {live.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-peel-700">+ Live &amp; applied layer (on top of the content)</p>
                <div className="space-y-2">{live.map((c, k) => <CourseRow key={k} c={c} />)}</div>
              </>
            )}

            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">How this trimester is delivered</p>
            <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full">
              {PILLARS.map(([k]) => <div key={k} className={BG[k]} style={{ width: `${delivery[k]}%` }} />)}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500">
              {PILLARS.map(([k, icon, label]) => (
                <span key={k}><span className={`mr-1 inline-block h-2 w-2 rounded-full ${BG[k]}`} />{icon} {label} {delivery[k]}%</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DegreeTerms({ terms, delivery }) {
  // group terms into years, preserving order
  const years = useMemo(() => {
    const map = new Map();
    terms.forEach((t, gi) => {
      const { year } = parse(t.name);
      if (!map.has(year)) map.set(year, []);
      map.get(year).push({ ...t, _gi: gi });
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([year, list]) => ({
      year,
      list,
      credits: +list.reduce((s, t) => s + (t.credits || 0), 0).toFixed(1),
      hours: list.reduce((s, t) => s + (t.hours || 0), 0),
    }));
  }, [terms]);

  const [activeYear, setActiveYear] = useState(years[0]?.year ?? 1);
  const cur = years.find((y) => y.year === activeYear) || years[0];
  const [open, setOpen] = useState(cur?.list[0]?._gi ?? 0);

  const YEAR_LABEL = (y) => ["", "Foundations", "Specialization", "Industry & capstone", "Advanced"][y] || "Year";

  function pickYear(y) {
    setActiveYear(y);
    const yr = years.find((x) => x.year === y);
    setOpen(yr?.list[0]?._gi ?? -1); // auto-open that year's first trimester
  }

  return (
    <div className="mt-5">
      {/* year navigation */}
      <div className="grid gap-2 sm:grid-cols-3">
        {years.map((y) => {
          const on = y.year === activeYear;
          return (
            <button key={y.year} onClick={() => pickYear(y.year)}
              className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${on ? "border-brand-500 bg-brand-500 text-white shadow-lift" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-black ${on ? "bg-white/20 text-white" : "bg-brand-50 text-brand-600"}`}>{y.year}</span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-tight">Year {y.year}</span>
                <span className={`block truncate text-[11px] leading-tight ${on ? "text-brand-50" : "text-ink-500"}`}>{YEAR_LABEL(y.year)} · {y.list.length} trimesters</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* active year's trimesters */}
      <div className="relative mt-6 space-y-3 border-l-2 border-brand-100 pl-6">
        <div className="-ml-6 flex items-center gap-2 pl-6 text-xs font-bold uppercase tracking-wider text-ink-400">
          Year {cur.year} · {cur.credits} credits · {cur.hours} learning hours
        </div>
        {cur.list.map((t, i) => (
          <TriCard key={t._gi} t={t} idx={i + 1} delivery={delivery}
            open={open === t._gi} onToggle={() => setOpen(open === t._gi ? -1 : t._gi)} />
        ))}

        {activeYear === years[years.length - 1].year && (
          <div className="relative">
            <span className="absolute -left-[31px] top-3 grid h-5 w-5 place-items-center rounded-full bg-peel-500 text-[10px] text-white">🎓</span>
            <div className="card border-peel-200 bg-peel-50 p-4">
              <p className="font-black text-ink-900">Graduation — industry-ready</p>
              <p className="mt-1 text-sm text-ink-600">Degree + verified skills + capstone portfolio, prepared for the roles below.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
