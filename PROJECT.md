# InfyAI — Project Instructions & Living Context

> **Purpose of this file:** the single source of truth for the InfyAI project. Read it at the start of any session to get full context. Update it at the end of any session that changes decisions, state, or conventions. Tell Claude *"update the project doc"* and it will sync this file.

_Last updated: 2026-06-07 · current version: v9.18_

---

## 1. What this is (one-liner)

**InfyAI** by Board Infinity — the skill-intelligence layer that turns courses into skills, skills into roles, and university curricula into AI-era programs.

- **Primary buyer:** universities & institutions (B2B2C). Learners are the end-users.
- **Live site:** https://infyskill.vercel.app
- **Repo:** github.com/ravi6703/infyskill (branch `main`)
- **Hosting:** Vercel (project `infyskill`), auto-deploys from `main`.
- **Database:** Supabase project `rbvoelnmckmibncatpyu` — tables prefixed `pf_` (pf_courses, pf_modules, pf_lessons, pf_items, pf_skills, pf_analyses).

---

## 2. The product (live surface)

| Page | Route | What it does |
|---|---|---|
| Home | `/` | University-first hero → "Compare your curriculum". Learner path secondary. |
| Course Catalog | `/catalog` | All 259 skill-tagged courses; each opens a visual roadmap. |
| Course detail | `/course/[slug]` | "Skills & Careers" (skill→roles demand) + "Course Content" (modules/lessons/items, collapsible). |
| Specializations | `/specializations` | 21 AI-era job roles (role-centric, no course dump). |
| Spec detail | `/specializations/[slug]` | Skills, journey, role outcomes, compare CTA. |
| Role compare | `/compare` | Side-by-side role comparison. |
| Degree Programs | `/degrees` | 4 BI degrees + "What your institution gains" (common benefits). |
| Degree detail | `/degrees/[slug]` | Year → Trimester → course → delivery. Credit/hours model. |
| University tool | `/degrees/compare` | Upload syllabus → AI-era readiness gauge + skill-coverage matrix → gaps + BI suggestions → roles. |
| Career Diagnostic | `/diagnostic` | 5-step learner diagnostic → personalized week-plan. |

Everything else (old pages: analyzer, dashboard, nexus, jobs, etc.) **redirects** — do not revive without reason.

---

## 3. Core principles (the "constitution" — do not violate)

1. **Honesty over inflation.** Never show hollow/fake content. Roles must be backed by real catalog content; matches are labeled "indicative, pending academic review"; no unverifiable claims (e.g. "80+ institutions partnered" was removed).
2. **University-first.** The paying buyer is the institution. Homepage and CTAs lead with them; learner is secondary.
3. **One light theme** (Board Infinity brand). No stray dark pages.
4. **Skill graph is the moat.** Catalog, specializations, degrees, and the compare tool are all *views over the same skill-tagged backend*.
5. **Comparison = the curriculum's gaps, not BI's shortcomings.** The university tool shows what *their* curriculum is missing for AI-era jobs + how BI fills it — never a list of what BI can't do.
6. **Delivery model truth:** recorded courses = **Async**. Live/Masterclass/Hackathon/Capstone are a separate layer *on top*, each naming its specific topic.

---

## 4. Current state / counts

- **259** skill-tagged courses · **866** modules · full lesson/video depth in Supabase.
- **21** specializations (content-backed; 5 hollow ones removed — see changelog v9.17/v9.18).
- **4** degree programs: B.Sc. AI Engineering (128cr), PG Diploma Applied GenAI (44cr), B.Sc. Data Science (142cr), MBA AI-Powered Business (96cr).
- Credit model: NCrF (1 credit = 30 notional learning hours), NEP 2020 40% online-credit allowance.
- Degree benchmarks are grounded in real published university structures (names removed from the UI per request; credit totals retained).

---

## 5. Stack & conventions

- **Next.js 14** (App Router) + **Tailwind** + React. Data in `data/*.json` (courses, modules, journeys=specializations, degrees_bi, skills, reference_curricula).
- **Brand:** Lato font; Primary Blue `#0066CC` (brand), Orange Peel `#FCA106` (peel), Fiery Rose `#D13845` (rose), teal/success `#3AAE89`; ink neutrals. Light theme. Classes: `card`, `btn-primary`, `chip-*`, `text-ink-*`.
- **Build/deploy:** push to `main` → POST to Vercel deployments API → auto-build. (Claude handles this.)
- **Matching engine** (`/degrees/compare`): conservative multi-token skill match; weak/single-generic subjects fall to Gap honestly; faculty-vs-build split.

---

## 6. NOT NOW (resist scope creep)

Park these unless a real buyer/pilot demands them: student accounts/auth, payments, a fully conversational AI diagnostic, AI raster imagery, more than 4 degrees, a second homepage persona, healthcare/robotics/digital-twin roles (no content). Rule: if it doesn't make the 2-min demo land harder, it waits.

---

## 7. Changelog (append newest at top)

- **v9.18** — Removed 2 borderline specializations (AI Trainer/Data Annotation, Conversation Designer). 23 → **21**.
- **v9.17** — Removed 3 hollow roles (AI Healthcare Data Analyst, Digital Twin, Robotics) — no domain content.
- **v9.16** — Benefits moved to common `/degrees` page; innovative compare (readiness gauge + skill-coverage matrix).
- **v9.13** — Degree async layer now module-level; compare tool reframed to AI-era-gaps-in-your-curriculum + suggestions; reference-program picker removed (upload-first).
- **v9.12** — Career Diagnostic converted from old dark theme to light theme.
- **v9.11** — Removed/redirected ~13 orphan pages (incl. dark `/university` duplicate).
- **v9.8–v9.10** — Delivery model fixed (recorded=Async; named live/masterclass/hackathon/capstone topics); homepage → university-first; credit card reframed (no internal inventory exposure).
- **v9.2–v9.7** — Verified-curriculum benchmarks; conservative matcher; honesty labels; "Skills & Careers" course view.
- _(Earlier waves: build, brand, catalog, specializations, degrees, diagnostic — see git history.)_

---

## 8. Open items / decisions pending

- Specialization naming: consider merging "AI Governance & Compliance Officer" + "AI Ethics Officer" (overlap); consider reframing the 5 business-function roles explicitly as "AI-Augmented [Marketing/HR/Finance/Supply-Chain]".
- Grow tagged BI content to raise degree credit coverage.
- **Security housekeeping:** revoke the GitHub PAT and Vercel token that were pasted in the build chat.

---

## How to keep this file updated (your workflow)

1. This file lives in your folder (`InfyAI_PROJECT.md`) **and** a copy is committed in the repo as `PROJECT.md`.
2. At the end of a working session, say **"update the project doc"** — Claude appends to the changelog, updates counts/state, and re-syncs both copies.
3. At the start of a new session, point Claude here: *"read InfyAI_PROJECT.md first."* That restores full context instantly.
4. You can edit it yourself anytime — it's plain Markdown.
