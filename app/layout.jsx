import "./globals.css";
import Link from "next/link";
import Nav from "../components/Nav";

export const metadata = {
  title: "PathFinder AI — Board Infinity",
  description: "Skill-tagged course catalog, AI-era specializations and Board Infinity degree programs with a blended delivery model.",
  icons: { icon: "/favicon.svg" },
};

const footerCols = [
  ["Explore", [["/catalog", "Course Catalog"], ["/specializations", "Specializations"], ["/degrees", "Degree Programs"], ["/diagnostic", "Career Diagnostic"]]],
  ["Board Infinity", [["https://www.boardinfinity.com", "About"], ["https://www.boardinfinity.com/college", "For Higher-Ed"], ["https://www.boardinfinity.com/programs", "All Courses"]]],
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-ink-200 bg-white print:hidden">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
            <div>
              <img src="/bi-logo.svg" alt="Board Infinity" className="h-9 w-auto" />
              <p className="mt-3 text-xs text-ink-500">Asia&apos;s #1 career-first learning ecosystem. PathFinder AI — skill intelligence, specializations & degree programs.</p>
            </div>
            {footerCols.map(([title, items]) => (
              <div key={title}>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500">{title}</p>
                <ul className="mt-2 space-y-1.5">
                  {items.map(([href, label]) => (
                    <li key={href}><Link href={href} className="text-sm text-ink-600 hover:text-brand-600">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">© Board Infinity 2026 · CII · NSDC · NASSCOM approved</p>
        </footer>
      </body>
    </html>
  );
}
