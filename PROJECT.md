# InfyAI — Project Instructions & Living Context

> **Purpose of this file:** the single source of truth for the InfyAI project. Read it at the start of any session to get full context. Update it at the end of any session that changes decisions, state, or conventions. Tell Claude *"update the project doc"* and it will sync this file.

_Last updated: 2026-06-12 · current version: v9.38 (all 4 degrees regulatory-verified & release-ready)_

**Project files (in this folder):** `InfyAI_PROJECT.md` (this doc) · `InfyAI_Founder_Demo_Playbook.md` (demo script + not-now list) · `InfyAI_SkillTagging_Verification.md` (skill-tag audit & cluster remediation list) · `InfyAI_Specialization_Journey_Gaps.md` (per-role journey gaps: map vs build) · `InfyAI_Gap_Report.xlsx` (the gap report as a workbook: Summary/Priorities, Journey Gaps, Skill-Cluster Fixes — internal, not on website) · `InfyAI_Journey_Availability_Internal.xlsx` (per-role available-vs-to-build, internal).

**Degree (regulatory) deliverables (v9.20–v9.38):** `BTech_AI_Engineering_Regulatory_Curriculum.docx`, `PGDiploma_AppliedGenAI_Regulatory_Curriculum.docx`, `BSc_DataScience_Regulatory_Curriculum.docx`, `MBA_AIPoweredBusiness_Regulatory_Curriculum.docx` (each: framework basis, credit-compliance, semester tables, PEO/PO/PSO, CO-PO) · `InfyAI_All4Degrees_Gap_Analysis.xlsx` (catalog coverage per degree, internal) · `InfyAI_Content_Gaps_To_Build.xlsx` (**the build backlog** — 25 unique courses to build + 48 to extend, priority-ranked) · `InfyAI_Website_Branch/` (the original ready-to-merge patch). All 4 degrees are regulatory-verified (every category ≥ min) and LIVE on the site.

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
| Specializations | `/specializations` | 20 AI-era job roles (role-centric, no course dump). |
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
- **20** specializations (content-backed; 5 hollow ones removed — see changelog v9.17/v9.18).
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

- **v9.38** — **All 4 degrees brought to full regulatory parity & verified before release.** Audit found B.Tech was solid but the other 3 weren't: **B.Sc DS had a real UGC FYUGP gap (AEC 4 < min 6→8)** and was unbalanced; **MBA was core/elective-light vs the AICTE MBA model**. Fixed: **B.Sc DS → UGC FYUGP** (AEC=8, all baskets ≥ min: Major 88, MDC 12, AEC 8, SEC 10, VAC 6; perfectly balanced 8×20=160); **MBA → AICTE MBA model** (54 core + 42 elective + 12 experiential = **108**, 4×27); PG Diploma confirmed vs UGC PG (44 ≥ 40). **Verified in code: all 4 now meet every category minimum.** `degrees_bi.json` pushed (`0cc356a`) — went LIVE inside the user's `e3b24327` deploy (confirmed: MBA page shows 108/54-core). Added **3 accreditation-grade Word syllabus docs** (PG/DS/MBA) with PEO/PO/PSO + CO-PO matrices, matching the B.Tech doc → folder. Refreshed `InfyAI_All4Degrees_Gap_Analysis.xlsx` (coverage: B.Tech 57% · PG Dip 92% · B.Sc DS 64% · MBA 64% — MBA dropped from 78% because AICTE-compliant core adds faculty/gap courses; honest). Note: Vercel token was revoked mid-session (good) — Claude pushes don't auto-deploy, but the user's subsequent push carried the fix live. Curriculum now release-ready; next = delivery model.
- **v9.35** — **Board Infinity official brand tokens integrated** (from `Final config.json`): primary blue **#0066CC→#148AFF** (full 50–900 scale), success green **#3AAE89→#05C170**, neutral grays to BI/Ant scale (#262626/595959/8C8C8C/BFBFBF/D9D9D9), radius 10, brand-tinted shadows; fixed hardcoded hex in SVG components (Art/Radar/gauges). Diagnostic skill-check 5→4 Qs + lower tokens (~6-7s). DEPLOYED via Vercel API with a fresh user token (team ravis-projects-a1fd7ab2). Font kept as Lato — config only references var(--font-sans), no typeface named. **Revoke all chat tokens when done.**

- **v9.33** — Degree **Regulatory alignment** section made non-confusing: AICTE category buckets now show **AI-contextual labels** (Basic Science → "Mathematical & Computing Foundations", Engineering Science → "Core Computer Science & Engineering", Program Core → "AI & Machine Learning Core", Humanities → "Communication, Ethics & Management"), with the official AICTE name + "min X cr ✓" kept as a subtitle for audit credibility. Each card is now **click-to-expand**, listing the actual AI courses inside it (e.g. Basic Science → Math for AI I/II, Optimization, Discrete Math, Numerical Computing). Data: added `label` + `covers[]` per category in `degrees_bi.json` (internal `regTitle` used to source clean curriculum names, stripped from public JSON). DEPLOYED LIVE: commit `986c727`, Vercel prod `dpl_23VxrRS3…` READY, built on top of v9.29 (your diagnostic/compare work preserved). Triggered via `vercel deploy --prod` (CLI) — Git auto-deploy does not fire for Claude's pushes; revoke the GitHub + Vercel tokens used.

- **v9.30** — Diagnostic conditional rules: experience gated by background (student→no-exp only, etc.); goals filtered by background; experience locked until background chosen.

- **v9.31** — Sped up the skill-check (5 concise Qs, ~half the tokens; warm ~9s) + 22s client timeout → self-rating fallback.

- **v9.32** — Diagnostic **adaptive follow-up**: weak clusters (<50% in round 1) trigger a 2nd harder round on only those areas (`followup` action); rounds merge into the final score. Strong scorers skip it.

- **v9.29** — University tool (`/degrees/compare`) is now a **two-lens gap report**: **Lens A — syllabus gap** (curriculum matched subject-by-subject vs the best-fit ideal program → match % + missing subjects) and **Lens B — job-orientation gap** (AI-era skill readiness gauge + coverage matrix + BI course suggestions + roles). Both presented to the client as one report. (v9.27 degrees untouched.)

- **v9.28** — Career Diagnostic now **suggests a career**: a "✨ Help me find my role" mode asks 3 interest/aptitude questions → OpenAI recommends the top-3 best-fit roles from the 20 specializations (fit % + why) → pick one → into the scored skill-check. New `recommend` action in `/api/diagnostic`. Verified live. Applied safely on top of v9.27 (degrees untouched).

- **v9.27** — All **4 degrees made regulatory (UGC+AICTE) and DEPLOYED LIVE** (commit `324e311` on `main`; Vercel prod `dpl_7CZc66tP…`, READY). Note: Git auto-deploy was off → triggered via `vercel deploy --prod` (CLI) with a user-supplied token; revoke after. Earlier draft said "ready-to-merge branch" — now pushed + deployed. B.Tech in Artificial Intelligence (163cr/8sem), PG Diploma Applied GenAI (44cr/2sem, NHEQF 6.5), B.Sc (Hons.) Data Science (160cr/8sem), MBA AI-Powered Business (101cr/4sem). `data/degrees_bi.json` rebuilt to semester structure + new `regulatory{}` block (award, regulators, NHEQF, category credits+minimums, multiple entry/exit); mapped courses reuse real catalog modules, gap courses render as **faculty-delivered** core (availability kept INTERNAL per v9.25). New **Regulatory alignment** section on `app/degrees/[slug]/page.jsx`; journey relabelled trimester→semester. `npm run build` passes. Deliverables in folder: `InfyAI_Website_Branch/` (patch + changed files + deploy README), `InfyAI_All4Degrees_Gap_Analysis.xlsx` (internal coverage: B.Tech 57% · PG Dip 92% · B.Sc DS 62% · MBA 78%), plus per-degree `BTech_AI_Engineering_Regulatory_Curriculum.docx` + journey HTML. Slugs unchanged (no 404s). Decisions: prep-branch (no token push); replace/upgrade all 4 in place.
- **v9.20** — Regulatory-alignment workstream (Phase 1). Built dual-compliant (**UGC FYUGP + AICTE**) curriculum for **B.Sc. (Hons.) AI Engineering** as the template degree: 4-yr/8-sem, **160 credits** (up from 128), 6 UGC baskets + AICTE category crosswalk, NEP/NCrF/NHEQF mapping, 4 entry/exit awards (Cert/Diploma/Degree/Honours at 40/80/120/160), 38-course semester plan, compliance checklist + gap analysis. Deliverable: `BSc_AI_Engineering_Regulatory_Curriculum.docx`. Decisions: B.Sc. AI Eng first; align to **both** regulators (dual-approved). Sequence: Step 2 delivery-model mapping → Step 3 map the 38 courses to the existing 259-course catalog (Covered/Partial/Gap) → Step 4 build content; then replicate to PG Dip GenAI, B.Sc. DS, MBA.
- **v9.26** — **AI-powered Career Diagnostic is LIVE.** Step 3 is now a real, *scored* skill-check generated by **OpenAI** (server-side `app/api/diagnostic/route.js`, key via `OPENAI_API_KEY` env in Vercel, model `gpt-4o-mini`, never client-side). Questions adapt to the candidate's profile (fresher vs working-pro → different difficulty/wording = branching). Answers are scored per skill cluster (not self-rated) → drives the plan. Step 5 shows an AI capability read (verdict/strengths/gaps/focus). Self-rating retained as automatic fallback if key/API unavailable. Verified live: `/api/diagnostic` returns 6 adapted questions.
- **v9.25** — Spec journey: removed available/to-build/planned **status from the public page** (it's internal — now in `InfyAI_Journey_Availability_Internal.xlsx`); each journey item is **click-to-expand** showing what it covers (async→real modules + View-course link; live/masterclass/etc→agenda). Course **hours bug fixed** (pf_modules has no hours column → compute from local module data). Added secure server-side `/api/diagnostic` route (Anthropic key via `ANTHROPIC_API_KEY` env, not yet wired to UI). **Principle reaffirmed:** content availability / "to build" status is INTERNAL only, never client-facing.
- **v9.24** — Spec view refinements: coaches on spec pages (skill-matched, role-assigned); "% ready today" readiness badge + bar; market context in hero (demand + sectors by family); decluttered (removed redundant delivery-model pillar grid).
- **NEXT (queued):** (a) dual-gap report in `/degrees/compare` — add **syllabus gap vs ideal curriculum** alongside the existing **job-orientation (AI-era skills) gap** + suggestions, as one shareable report; (b) Career Diagnostic — make it **branching** (fresher vs working-pro → different next questions) + add **lightweight skill-check questions** that score real answers instead of self-claims (full adaptive-AI assessment needs an API key — phase 2).
- **v9.23** — Specialization pages: FULL journey week-by-week with the 5-part delivery model + content availability (every element tagged Async/Sync/Masterclass/Hackathon/Capstone/Assessment and marked available-now / BI-to-build / planned; week ranges per stage; mix bar; available-vs-build counts).
- **v9.22** — Holistic course experience: each course page shows the full blended program (self-paced w/ real module topics + live classes on specific topics + masterclass agenda + applied project + hackathon + mentorship + assessment); coach network redesigned, coaches assigned to masterclass/project/mentor.
- **v9.21** — Skill→cluster remediation (100 fixes); merged AI Ethics into "AI Governance & Ethics Officer" (21→20 roles); enriched AI Business Analyst 13→19 skills.
- **v9.20** — Course pages: BI live layer (masterclass + applied project) + "Coaches who can teach this" (dummy skill-mapped profiles, 2-3/course). Gap report delivered as `InfyAI_Gap_Report.xlsx` (internal).
- **v9.19** — Degree hierarchy = **per-course delivery model**: each course in a trimester carries its own blend (async modules + live sync sessions + masterclass for advanced courses + mini-project); Hackathon/Capstone/Mentorship are trimester-level milestones. Added PROJECT.md.
- **Audit (2026-06-07)** — Skill-tagging verification: course→skill tags are clean; the issue is skill→cluster ("Professional & Workplace" is a 2,063-skill catch-all with ~80 mis-bucketed technical/finance skills). See `InfyAI_SkillTagging_Verification.md`. **Fix pending** (data-only, in `data/skills.json`).
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

- **Skill→cluster remediation** (from the verification audit): reassign ~80 mis-bucketed skills out of "Professional & Workplace"; fix vSphere Clustering→ML, Heuristic Evaluation→Finance. Data-only fix in `data/skills.json`. Awaiting go-ahead on a full proposed diff.
- **#2 (done 2026-06-07):** specialization journey-gap doc delivered → `InfyAI_Specialization_Journey_Gaps.md`. Key follow-ups for the user: MAP SQL into 3 data/analyst roles (content exists); BUILD data-eng stack (Spark/Kafka/Airflow/dbt) + vendor-neutral LLM-API course.
- **#3 (done 2026-06-07, v9.20):** course pages now show a BI live layer (masterclass + applied project, BI-delivered) + "Coaches who can teach this" (dummy skill-mapped coach profiles in `data/coaches.json`, matched by skill cluster, 2-3 per course). Coaches are clearly labelled "representative profiles".
- Specialization naming: consider merging "AI Governance & Compliance Officer" + "AI Ethics Officer" (overlap); consider reframing the 5 business-function roles explicitly as "AI-Augmented [Marketing/HR/Finance/Supply-Chain]".
- Grow tagged BI content to raise degree credit coverage.
- **Security housekeeping:** revoke the GitHub PAT and Vercel token that were pasted in the build chat.

---

## How to keep this file updated (your workflow)

1. This file lives in your folder (`InfyAI_PROJECT.md`) **and** a copy is committed in the repo as `PROJECT.md`.
2. At the end of a working session, say **"update the project doc"** — Claude appends to the changelog, updates counts/state, and re-syncs both copies.
3. At the start of a new session, point Claude here: *"read InfyAI_PROJECT.md first."* That restores full context instantly.
4. You can edit it yourself anytime — it's plain Markdown.
