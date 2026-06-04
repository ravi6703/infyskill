import "./globals.css";
import Nav from "../components/Nav";

export const metadata = {
  title: "PathFinder AI — Board Infinity",
  description: "Skill-tagged content intelligence, AI-era career journeys and university curriculum mapping by Board Infinity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-slate-800 py-8 text-center text-sm text-slate-500">
          PathFinder AI · Board Infinity · 259 courses · 16,812 tagged content items · 3,650 skills
        </footer>
      </body>
    </html>
  );
}
