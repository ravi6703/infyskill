const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rbvoelnmckmibncatpyu.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_xRwj9jVryym4vBztetvkqQ_XAKUrfqq";

export async function sbSelect(table, query) {
  const res = await fetch(`${URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${table}: ${res.status}`);
  return res.json();
}

export async function sbInsert(table, row) {
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}
