// PathFinder dynamic journey engine.
// Composes module-level, week-by-week personalized plans at runtime.
// Blend targets (grounded in hybrid cohort-course practice + 70-20-10):
// ~40% async, ~25% sync/live, ~20% project (hackathon+capstone), ~10% masterclass+coaching, ~5% assessment.

import skillsData from "../data/skills.json";

const clusterOf = new Map(skillsData.map((s) => [s.name.toLowerCase(), s.cluster]));
const rarity = new Map(skillsData.map((s) => [s.name.toLowerCase(), 1 + Math.min(3, 60 / (s.count + 8))]));

export function clustersFor(skills) {
  const c = new Map();
  for (const s of skills) {
    const cl = clusterOf.get(s.toLowerCase());
    if (cl) c.set(cl, (c.get(cl) || 0) + 1);
  }
  return [...c.entries()].sort((a, b) => b[1] - a[1]);
}

function dominantSkills(mods, n = 3) {
  const c = new Map();
  for (const m of mods) for (const s of m.skills) c.set(s, (c.get(s) || 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([s]) => s);
}

// Select modules: relevance-scored, dedup by marginal skill gain, with ABILITY-GRADED depth per cluster.
// clusterAbility: { cluster: 0..3 } — 3 Advanced (skip the cluster), 2 Proficient (skip its basics),
// 0-1 Novice/Developing (keep all, boost foundations). Returns the picked array; total candidate hours on `._full`.
export function selectModules(targetSkills, allModules, { knownClusters = [], knownSkills = [], maxHours = 100, fastTrack = false, clusterAbility = {} } = {}) {
  const target = new Set(targetSkills.map((s) => s.toLowerCase()));
  const known = new Set(knownClusters);
  const ab = (c) => (clusterAbility[c] === undefined ? null : clusterAbility[c]);
  const scored = [];
  let fullHours = 0;
  for (const m of allModules) {
    let score = 0;
    const hits = [];
    for (const s of m.skills) {
      const sl = s.toLowerCase();
      if (target.has(sl)) { score += rarity.get(sl) || 1; hits.push(s); }
    }
    if (score === 0) continue;
    const clusters = [...new Set(m.skills.map((s) => clusterOf.get(s.toLowerCase())).filter(Boolean))];
    const allKnown = clusters.length > 0 && clusters.every((c) => known.has(c));
    if (allKnown) continue; // learner already has this cluster — skip (legacy known set)
    // graded depth
    const rated = clusters.filter((c) => ab(c) !== null);
    if (m.level < 2 && rated.length && rated.every((c) => ab(c) >= 3)) continue; // Advanced → skip beginner+intermediate, keep advanced
    if (m.level === 0 && rated.length && rated.every((c) => ab(c) >= 2)) continue; // Proficient+ → skip basics only
    let s = score / Math.sqrt(m.hours);
    if (fastTrack && m.level === 0) s *= 0.45;                                 // experienced: bias off beginner
    if (clusters.some((c) => ab(c) === 0) && m.level <= 1) s *= 1.35;          // Novice → prioritise foundations
    fullHours += m.hours;
    scored.push({ m, score: s, hits });
  }
  scored.sort((a, b) => b.score - a.score);

  const covered = new Map(); // skill -> times covered
  for (const s of knownSkills) covered.set(s.toLowerCase(), 2); // learner already has these — modules teaching them are redundant
  const picked = [];
  let hours = 0;
  for (const { m, hits } of scored) {
    if (hours >= maxHours) break;
    const newGain = hits.filter((s) => (covered.get(s.toLowerCase()) || 0) < 2).length;
    if (newGain === 0) continue; // fully redundant module — dedup
    if (newGain / hits.length < 0.34 && picked.length > 4) continue;
    picked.push(m);
    hours += m.hours;
    for (const s of hits) covered.set(s.toLowerCase(), (covered.get(s.toLowerCase()) || 0) + 1);
  }
  // order: Beginner -> Advanced, then course, then module number
  picked.sort((a, b) => a.level - b.level || a.course.localeCompare(b.course) || parseFloat(a.num) - parseFloat(b.num));
  picked._full = fullHours;     // total candidate hours (before the deadline budget cap) — for feasibility
  picked._capped = hours >= maxHours;
  return picked;
}

const PHASES = ["Foundation", "Core Build", "Specialization", "Career Launch"];

export function buildWeekPlan(targetSkills, allModules, opts = {}) {
  const { knownClusters = [], knownSkills = [], hoursPerWeek = 10, roleName = "your target role",
          maxWeeks = 26, fastTrack = false, projectFirst = false, clusterAbility = {}, goal = "switch" } = opts;
  const asyncBudgetPerWeek = hoursPerWeek * 0.4;
  // upskillers go advanced-only (less foundation time); first-jobbers keep more runway for fundamentals
  const reserve = goal === "upskill" ? 0.78 : goal === "first" ? 0.68 : 0.72;
  const maxContentWeeks = Math.max(4, Math.min(34, Math.floor(maxWeeks * reserve)));
  const maxAsync = asyncBudgetPerWeek * maxContentWeeks;
  let mods = selectModules(targetSkills, allModules, { knownClusters, knownSkills, maxHours: maxAsync, fastTrack, clusterAbility });
  // safety: if graded depth skipped everything (e.g. Advanced across the board), fall back to a lean advanced set
  if (mods.length === 0) mods = selectModules(targetSkills, allModules, { knownSkills, maxHours: maxAsync, fastTrack });
  if (mods.length === 0) return null;
  // feasibility: did the deadline force us to trim? (full coverage hours vs what fits)
  const fullHours = mods._full || mods.reduce((a, m) => a + m.hours, 0);
  const neededContentWeeks = Math.ceil(fullHours / Math.max(1, asyncBudgetPerWeek));
  const neededWeeks = Math.round(neededContentWeeks / Math.max(0.5, reserve));
  const feasibility = { neededWeeks, tight: !!mods._capped && neededWeeks > maxWeeks, fullHours: Math.round(fullHours) };

  // pack modules into weeks by async budget
  const weeks = [];
  let cur = [], curH = 0;
  for (const m of mods) {
    if (curH + m.hours > asyncBudgetPerWeek * 1.25 && cur.length) {
      weeks.push(cur); cur = []; curH = 0;
    }
    cur.push(m); curH += m.hours;
  }
  if (cur.length) weeks.push(cur);

  // append project weeks: 1 hackathon week mid-journey + capstone weeks (~18% of total)
  const contentWeeks = weeks.length;
  const capstoneWeeks = Math.max(2, Math.round(contentWeeks * 0.22));
  const hackathonAfter = Math.max(2, Math.round(contentWeeks * (projectFirst ? 0.4 : 0.65)));

  const plan = [];
  let wn = 0;
  const syncPerWeek = hoursPerWeek >= 10 ? 2 : 1;
  const syncH = syncPerWeek * 1.5;

  weeks.forEach((wmods, i) => {
    wn++;
    const dom = dominantSkills(wmods);
    const week = {
      n: wn, type: "content",
      theme: dom.slice(0, 2).join(" & ") || wmods[0].title,
      async: wmods.map((m) => ({ id: m.id, course: m.course, num: m.num, title: m.title, hours: m.hours, skills: m.skills.slice(0, 4), lessons: m.lessons, videos: m.videos, level: m.level })),
      asyncHours: Math.round(wmods.reduce((a, m) => a + m.hours, 0) * 10) / 10,
      sync: [
        { title: `Live lab: ${dom[0] || wmods[0].title} — guided practice & doubt-solving`, hours: 1.5 },
        ...(syncPerWeek > 1 ? [{ title: `Mentor circle: apply ${dom[1] || dom[0] || "this week's skills"} to a mini-case`, hours: 1.5 }] : []),
      ],
      deliverable: `Mini-build: apply ${dom[0] || "this week's skills"} — submit for peer + mentor review`,
      addons: [],
    };
    // STYLE — project-first: a build task every week (learn by doing, not just watching)
    if (projectFirst) week.addons.push({ kind: "project", label: `Build: ship a small ${dom[0] || "feature"} project this week` });
    // GOAL — first-job: interview prep ramps in from ~55% of content; switcher: positioning near the end
    const frac = (i + 1) / weeks.length;
    if (goal === "first" && frac >= 0.55 && wn % 2 === 0) week.addons.push({ kind: "interview", label: `Interview prep: ${dom[0] || roleName} fundamentals — practice Q&A` });
    if (goal === "switch" && frac >= 0.8) week.addons.push({ kind: "resume", label: `Positioning: frame your ${roleName} pivot story for recruiters` });
    if (wn % 3 === 0) week.masterclass = { title: `Industry masterclass: ${dom[0] || "applied AI"} in production (guest expert)`, hours: 1 };
    if (wn % 4 === 0) week.assessment = { title: `Skill checkpoint ${Math.floor(wn / 4)}: ${dom.join(", ")}`, hours: 0.75 };
    plan.push(week);

    if (i + 1 === hackathonAfter) {
      wn++;
      plan.push({
        n: wn, type: "hackathon",
        theme: "Hackathon week",
        async: [], asyncHours: 0,
        sync: [{ title: "Hackathon kickoff + team formation (live)", hours: 1 }, { title: "Demo day: present to industry judges", hours: 2 }],
        project: { title: `48-hour build sprint: ship a working ${roleName} project`, hours: Math.round(hoursPerWeek * 0.7) },
        deliverable: "Working demo + repo + 3-min pitch video (portfolio asset #1)",
        addons: [{ kind: "coach", label: "1:1 coach session — project scoping & team strategy" }],
      });
    }
  });

  for (let c = 1; c <= capstoneWeeks; c++) {
    wn++;
    const last = c === capstoneWeeks;
    plan.push({
      n: wn, type: "capstone",
      theme: `Capstone ${c}/${capstoneWeeks}${last ? " — final review" : ""}`,
      async: [], asyncHours: 0,
      sync: [{ title: last ? "Capstone defense: present to expert panel (live)" : "Capstone studio: mentor working session", hours: 1.5 }],
      project: { title: last ? "Polish, document and publish your capstone" : `Capstone build sprint ${c}: production-grade ${roleName} project`, hours: Math.round(hoursPerWeek * 0.6) },
      deliverable: last ? "Published capstone + case-study write-up (portfolio asset #2)" : `Capstone milestone ${c} reviewed by mentor`,
      addons: [
        { kind: "coach", label: "1:1 coach session — personal project guidance" },
        ...(last ? [
          { kind: "resume", label: "AI Resume Builder — role-targeted resume from your journey evidence (Infy Resume Copilot)" },
          { kind: "interview", label: "AI Mock Interview — simulation built from real JDs for this role (Infy Interview)" },
          { kind: "jobs", label: "Placement: profile listed in employer talent pool + live job matches (InfyTalent)" },
        ] : []),
      ],
    });
  }

  // phase labels
  const total = plan.length;
  for (const w of plan) {
    if (w.type === "capstone") w.phase = "Career Launch";
    else if (w.type === "hackathon") w.phase = "Specialization";
    else w.phase = PHASES[Math.min(2, Math.floor(((w.n - 1) / total) * 3))];
  }

  // blend stats
  let aH = 0, sH = 0, pH = 0, mH = 0, asH = 0;
  for (const w of plan) {
    aH += w.asyncHours;
    sH += (w.sync || []).reduce((a, s) => a + s.hours, 0);
    pH += w.project ? w.project.hours : 0;
    mH += (w.masterclass ? w.masterclass.hours : 0) + (w.addons || []).filter((x) => x.kind === "coach").length * 0.75;
    asH += w.assessment ? w.assessment.hours : 0;
  }
  const T = aH + sH + pH + mH + asH;
  const pct = (x) => Math.round((x / T) * 100);

  // radar: cluster coverage of plan vs target
  const planSkills = new Set();
  for (const w of plan) for (const a of w.async || []) for (const s of a.skills) planSkills.add(s);
  const targetClusters = clustersFor(targetSkills).slice(0, 8);
  const radar = targetClusters.map(([cl, weight]) => {
    const got = clustersFor([...planSkills]).find(([c]) => c === cl);
    return { cluster: cl, target: 100, plan: Math.min(100, Math.round(((got ? got[1] : 0) / weight) * 100)) };
  });

  return {
    weeks: plan, totalWeeks: plan.length, hoursPerWeek,
    totalHours: Math.round(T),
    moduleCount: mods.length,
    courseCount: new Set(mods.map((m) => m.course)).size,
    blend: { async: pct(aH), sync: pct(sH), project: pct(pH), masterclassCoaching: pct(mH), assessment: pct(asH) },
    radar,
    feasibility,
  };
}

// Alternatives for a module: other modules teaching overlapping skills (for "swap module").
export function alternativesFor(moduleId, allModules, targetSkills, limit = 3) {
  const cur = allModules.find((m) => m.id === moduleId);
  if (!cur) return [];
  const target = new Set(targetSkills.map((s) => s.toLowerCase()));
  const curSkills = new Set(cur.skills.map((s) => s.toLowerCase()));
  return allModules
    .filter((m) => m.id !== moduleId && m.course !== cur.course)
    .map((m) => {
      const overlap = m.skills.filter((s) => curSkills.has(s.toLowerCase())).length;
      const rel = m.skills.filter((s) => target.has(s.toLowerCase())).length;
      return { m, score: overlap * 2 + rel };
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.m);
}

// Composite placement-readiness score from progress + diagnostic readiness.
export function placementScore({ progressPct = 0, startReadiness = 0, hackathonDone = false, capstoneDone = false }) {
  return Math.min(100, Math.round(startReadiness * 0.25 + progressPct * 0.45 + (hackathonDone ? 12 : 0) + (capstoneDone ? 18 : 0)));
}

// Cluster -> concrete skills for a given role's skill profile (for explainable self-assessment).
export function skillsByCluster(skills) {
  const m = new Map();
  for (const s of skills) {
    const cl = clusterOf.get(s.toLowerCase());
    if (!cl) continue;
    if (!m.has(cl)) m.set(cl, []);
    m.get(cl).push(s);
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}
