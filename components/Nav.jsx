"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primary = [
  ["/university", "For Universities"],
  ["/diagnostic", "Diagnostic"],
  ["/journeys", "Journeys"],
  ["/analyzer", "JD Analyzer"],
  ["/dashboard", "Dashboard"],
];
const more = [
  ["/catalog", "Course Catalog"], ["/skills", "Skill Taxonomy"], ["/compare", "Compare Journeys"],
  ["/partners", "Partner Dashboard"], ["/outcomes", "Outcomes & Trust"], ["/portfolio", "My Portfolio"],
  ["/pricing", "Founding Cohort"],
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 font-black text-white">P</span>
          <span className="text-lg font-bold text-white">PathFinder<span className="text-brand-400"> AI</span></span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {primary.map(([href, label]) => (
            <Link key={href} href={href}
              className={`rounded-lg px-3 py-1.5 transition ${path.startsWith(href) ? "bg-brand-600/20 text-brand-300" : "text-slate-300 hover:text-white"}`}>
              {label}
            </Link>
          ))}
          <div className="relative">
            <button onClick={() => setOpen(!open)} className="rounded-lg px-3 py-1.5 text-slate-300 hover:text-white">More ▾</button>
            {open && (
              <div className="absolute right-0 top-9 z-50 grid w-[360px] grid-cols-2 gap-1 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl" onMouseLeave={() => setOpen(false)}>
                {more.map(([href, label]) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={`rounded-lg px-3 py-2 text-xs ${path.startsWith(href) ? "bg-brand-600/20 text-brand-300" : "text-slate-300 hover:bg-slate-800"}`}>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
