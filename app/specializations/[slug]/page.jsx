import Link from "next/link";
import specs from "../../../data/journeys.json";
import SpecDetail from "./SpecDetail";

export function generateStaticParams() {
  return specs.map((s) => ({ slug: s.slug }));
}
export function generateMetadata({ params }) {
  const s = specs.find((x) => x.slug === params.slug);
  return { title: `${s ? s.role : "Specialization"} — PathFinder AI` };
}

export default function Page({ params }) {
  const spec = specs.find((x) => x.slug === params.slug);
  if (!spec) return <p>Not found.</p>;
  return <SpecDetail spec={spec} />;
}
