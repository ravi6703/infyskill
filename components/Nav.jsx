"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/catalog", "Course Catalog"],
  ["/specializations", "Specializations"],
  ["/degrees", "Degree Programs"],
  ["/diagnostic", "Career Diagnostic"],
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/bi-logo.svg" alt="Board Infinity" className="h-8 w-auto" />
          <span className="hidden h-6 w-px bg-ink-200 sm:block" />
          <span className="hidden text-sm font-bold text-ink-700 sm:block">PathFinder <span className="text-brand-500">AI</span></span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm font-bold">
          {links.map(([href, label]) => (
            <Link key={href} href={href}
              className={`rounded-lg px-3 py-1.5 transition ${path.startsWith(href) ? "bg-brand-50 text-brand-600" : "text-ink-600 hover:text-brand-600"}`}>
              {label}
            </Link>
          ))}
          <Link href="/diagnostic" className="ml-2 rounded-lg bg-brand-500 px-3 py-1.5 text-white hover:bg-brand-600">Start free →</Link>
        </nav>
      </div>
    </header>
  );
}
