import "./globals.css";
import Link from "next/link";
import Nav from "../components/Nav";
import FeedbackWidget from "../components/FeedbackWidget";

export const metadata = {
  title: "PathFinder AI — Board Infinity",
  description: "Dynamic, module-level AI-era career journeys: diagnostic, week-by-week plans, JD matching and university curriculum mapping.",
  manifest: "/manifest.json",
};

const footerCols = [
  ["Learn", [["/diagnostic", "Diagnostic"], ["/journeys", "Career Journeys"], ["/catalog", "Course Catalog"], ["/calendar", "Cohort Calendar"], ["/mentors", "Coaches"]]],
  ["Tools", [["/analyzer", "JD Analyzer"], ["/compare", "Compare Roles"], ["/skills", "Skill Taxonomy"], ["/nexus", "NEXUS Feed"], ["/pricing", "Pricing & ROI"]]],
  ["For Organizations", [["/university", "University Mapping"], ["/partners", "Partner Dashboard"], ["/employers", "Hire Talent"], ["/outcomes", "Outcomes & Trust"]]],
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-slate-800 print:hidden">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-4">
            <div>
              <p className="font-bold text-white">PathFinder AI</p>
              <p className="mt-2 text-xs text-slate-500">by Board Infinity — Asia&apos;s career-first ecosystem. CII, NSDC & NASSCOM approved.</p>
            </div>
            {footerCols.map(([title, links]) => (
              <div key={title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
                <ul className="mt-2 space-y-1.5">
                  {links.map(([href, label]) => (
                    <li key={href}><Link href={href} className="text-sm text-slate-400 hover:text-brand-300">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </footer>
        <FeedbackWidget />
      </body>
    </html>
  );
}
