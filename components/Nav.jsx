"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/journeys", "Career Journeys"],
  ["/catalog", "Course Catalog"],
  ["/skills", "Skills"],
  ["/analyzer", "JD Analyzer"],
  ["/university", "University Mapping"],
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 font-black text-white">P</span>
          <span className="text-lg font-bold text-white">PathFinder<span className="text-brand-400"> AI</span></span>
          <span className="ml-2 hidden rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400 sm:block">by Board Infinity</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href}
              className={`rounded-lg px-3 py-1.5 transition ${path.startsWith(href) ? "bg-brand-600/20 text-brand-300" : "text-slate-300 hover:text-white"}`}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
