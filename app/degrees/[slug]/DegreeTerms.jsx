"use client";
import { useState } from "react";

const PILLARS = [["async", "▶", "Async", "bg-brand-500"], ["sync", "🎙", "Sync", "bg-peel-500"], ["masterclass", "★", "Masterclass", "bg-flame-500"], ["hackathon", "🏆", "Hackathon", "bg-rose-500"], ["capstone", "🎓", "Capstone", "bg-brand-300"]];

export default function DegreeTerms({ terms, delivery }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="relative mt-5 space-y-3 border-l-2 border-brand-100 pl-6">
      {terms.map((t, i) => {
        const isOpen = open === i;
        return (
          <div key={t.name} className="relative">
            <span className={`absolute -left-[31px] top-2 grid h-5 w-5 place-items-center rounded-full text-[10px] font-black text-white transition ${isOpen ? "bg-peel-500 scale-110" : "bg-brand-500"}`}>{i + 1}</span>
            <button onClick={() => setOpen(isOpen ? -1 : i)} className="card w-full p-4 text-left transition hover:shadow-lift">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-black text-ink-900">{t.name}</p>
                <span className="text-sm font-bold text-teal-600">🎯 {t.milestone} {isOpen ? "▴" : "▾"}</span>
              </div>
              {!isOpen && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.themes.map((th) => <span key={th} className="chip-gray">{th}</span>)}
                </div>
              )}
              {isOpen && (
                <div className="mt-4 animate-fadeUp">
                  {/* mini roadmap of the term */}
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">What you learn, in order</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {t.themes.map((th, k) => (
                      <span key={th} className="flex items-center gap-1.5">
                        <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{th}</span>
                        {k < t.themes.length - 1 && <span className="text-ink-300">→</span>}
                      </span>
                    ))}
                    <span className="text-ink-300">→</span>
                    <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-600">🎯 {t.milestone}</span>
                  </div>

                  {/* delivery mix for the term */}
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">How this term is delivered</p>
                  <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full">
                    {PILLARS.map(([k, , , bg]) => <div key={k} className={bg} style={{ width: `${delivery[k]}%` }} />)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500">
                    {PILLARS.map(([k, icon, label, bg]) => (
                      <span key={k}><span className={`mr-1 inline-block h-2 w-2 rounded-full ${bg}`} />{icon} {label} {delivery[k]}%</span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          </div>
        );
      })}
      <div className="relative">
        <span className="absolute -left-[31px] top-2 grid h-5 w-5 place-items-center rounded-full bg-peel-500 text-[10px] text-white">🎓</span>
        <div className="card border-peel-200 bg-peel-50 p-4">
          <p className="font-black text-ink-900">Graduation — industry-ready</p>
          <p className="mt-1 text-sm text-ink-600">Degree + verified skills + capstone portfolio, prepared for the roles below.</p>
        </div>
      </div>
    </div>
  );
}
