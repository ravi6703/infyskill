# PathFinder AI — Board Infinity

Skill-tagged content intelligence, AI-era career journeys and university curriculum mapping.

- 259 courses / 866 modules / 2,822 lessons / 16,812 content items, all skill-tagged (~3,650 canonical skills)
- 26 AI-era career journeys (async + sync + masterclass + hackathon + capstone)
- JD → journey analyzer (taxonomy matching engine, no API key needed)
- University curriculum → coverage % and gap analysis (9 degree benchmarks included)

## Stack
Next.js 14 (App Router) · Tailwind CSS · Supabase (Postgres + REST)

## Run locally
```
npm install
npm run dev
```

## Environment
Defaults point to the staging Supabase project. To use your own:
1. Run `supabase/01_schema.sql` in your project's SQL editor
2. `node supabase/seed.mjs https://YOURPROJECT.supabase.co <publishable key>`
3. Run `supabase/02_drop_seed_policies.sql`
4. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Deploy
Push to GitHub and import in Vercel (framework: Next.js, no special config), or `npx vercel`.
