// Usage: node supabase/seed.mjs https://YOURPROJECT.supabase.co sb_publishable_xxx
// Seeds pf_* tables from supabase/seed_data.json (run 01_schema.sql first).
import fs from "fs";
const [URL, KEY] = process.argv.slice(2);
if (!URL || !KEY) { console.error("Usage: node seed.mjs <SUPABASE_URL> <KEY>"); process.exit(1); }
const data = JSON.parse(fs.readFileSync(new URL("./seed_data.json", import.meta.url)));
async function post(table, rows) {
  const res = await fetch(`${URL}/rest/v1/${table}`, { method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(rows) });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
}
for (const [table, rows, bs] of [["pf_courses", data.courses, 300], ["pf_skills", data.skills, 1000],
  ["pf_modules", data.modules, 500], ["pf_lessons", data.lessons, 800], ["pf_items", data.items, 1000]]) {
  for (let i = 0; i < rows.length; i += bs) await post(table, rows.slice(i, i + bs));
  console.log(table, rows.length, "rows");
}
console.log("Done. Now run supabase/02_drop_seed_policies.sql in the SQL editor.");
