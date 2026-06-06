import { redirect } from "next/navigation";

// /university was an older, off-brand (dark) duplicate of the university funnel.
// Consolidated into the live, on-brand tool at /degrees/compare.
export default function University() {
  redirect("/degrees/compare");
}
