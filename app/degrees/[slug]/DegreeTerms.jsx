"use client";
import { useState } from "react";
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

export default function DegreeTerms({ terms, delivery }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="relative mt-5 space-y-3 border-l-2 border-brand-100 pl-6">
      {terms.map((t, i) => {
        const isOpen = open === i;
        const courses = t.courses || [];
        return (
          <div key={t.name} className="relative">
            <span className={`absolute -left-[31px] top-3 grid h-5 w-5 place-items-center rounded-full text-[10px] font-black text-white transition ${isOpen ? "bg-peel-500 scale-110" : "bg-brand-500"}`}>{i + 1}</span>
            <div className="card overflow-hidden">
              <button onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left hover:bg-ink-50">
                <div>
                  <p className="font-black text-ink-900">{t.name}</p>
                  <p className="text-xs text-ink-500">
                    {courses.length} subject{courses.length > 1 ? "s" : ""}
                    {t.credits ? <> · {t.credits} credits · {t.hours} hrs</> : null}
                    {t.milestone && t.milestone !== "Focused term" && t.milestone !== t.themes?.[0] ? <> · milestone: <b className="text-teal-600">{t.milestone}</b></> : null}
                  </p>
                </div>
                <span className="text-sm font-bold text-brand-600">{isOpen ? "Hide curriculum ▴" : "View curriculum ▾"}</span>
              </button>

              {isOpen && (
                <div className="animate-fadeUp border-t border-ink-100 p-4">
                  {/* course table — curriculum + delivery + outcome */}
                  <div className="space-y-2">
                    {courses.map((c, k) => {
                      const d = DELIV[c.delivery] || DELIV.Async;
                      return (
                        <div key={k} className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-200 bg-white p-3">
                          <span className={`chip border ${d.cls} shrink-0`}>{d.icon} {d.label}</span>
                          <div className="min-w-0 flex-1">
                            {c.slug
                              ? <Link href={`/course/${c.slug}`} className="font-bold text-ink-900 hover:text-brand-600">{c.course}</Link>
                              : <span className="font-bold text-ink-900">{c.course}</span>}
                            <p className="text-xs text-ink-500">{c.outcome}</p>
                          </div>
                          {c.skills?.length > 0 && (
                            <div className="hidden flex-wrap gap-1 sm:flex">
                              {c.skills.slice(0, 3).map((s) => <span key={s} className="chip-gray">{s}</span>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* term delivery mix */}
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">How this semester is delivered</p>
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
      })}
      <div className="relative">
        <span className="absolute -left-[31px] top-3 grid h-5 w-5 place-items-center rounded-full bg-peel-500 text-[10px] text-white">🎓</span>
        <div className="card border-peel-200 bg-peel-50 p-4">
          <p className="font-black text-ink-900">Graduation — industry-ready</p>
          <p className="mt-1 text-sm text-ink-600">Degree + verified skills + capstone portfolio, prepared for the roles below.</p>
        </div>
      </div>
    </div>
  );
}
