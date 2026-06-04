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

// Select modules: relevance-scored, dedup by marginal skill gain, skip known clusters.
export function selectModules(targetSkills, allModules, { knownClusters = [], maxHours = 100 } = {}) {
  const target = new Set(targetSkills.map((s) => s.toLowerCase()));
  const known = new Set(knownClusters);
  const scored = [];
  for (const m of allModules) {
    let score = 0;
    const hits = [];
    for (const s of m.skills) {
      const sl = s.toLowerCase();
      if (target.has(sl)) { score += rarity.get(sl) || 1; hits.push(s); }
    }
    if (score === 0) continue;
    const clusters = new Set(m.skills.map((s) => clusterOf.get(s.toLowerCase())).filter(Boolean));
    const allKnown = clusters.size > 0 && [...clusters].every((c) => known.has(c));
    if (allKnown) continue; // learner already has this cluster — skip (diagnostic)
    scored.push({ m, score: score / Math.sqrt(m.hours), hits });
  }
  scored.sort((a, b) => b.score - a.score);

  const covered = new Map(); // skill -> times covered
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
  return picked;
}

const PHASES = ["Foundation", "Core Build", "Specialization", "Career Launch"];

export function buildWeekPlan(targetSkills, allModules, opts = {}) {
  const { knownClusters = [], hoursPerWeek = 10, roleName = "your target role" } = opts;
  const asyncBudgetPerWeek = hoursPerWeek * 0.4;
  const maxAsync = asyncBudgetPerWeek * 20; // cap ~20 content weeks
  const mods = selectModules(targetSkills, allModules, { knownClusters, maxHours: maxAsync });
  if (mods.length === 0) return null;

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
  const hackathonAfter = Math.max(2, Math.round(contentWeeks * 0.65));

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
      async: wmods.map((m) => ({ id: m.id, course: m.course, num: m.num, title: m.title, hours: m.hours, skills: m.skills.slice(0, 4), lessons: m.lessons, videos: m.videos })),
      asyncHours: Math.round(wmods.reduce((a, m) => a + m.hours, 0) * 10) / 10,
      sync: [
        { title: `Live lab: ${dom[0] || wmods[0].title} — guided practice & doubt-solving`, hours: 1.5 },
        ...(syncPerWeek > 1 ? [{ title: `Mentor circle: apply ${dom[1] || dom[0] || "this week's skills"} to a mini-case`, hours: 1.5 }] : []),
      ],
      deliverable: `Mini-build: apply ${dom[0] || "this week's skills"} — submit for peer + mentor review`,
      addons: [],
    };
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
          { kind: "resume", label: "AI Resume Builder — auto-draft resume from your journey evidence (Infy Resume Copilot)" },
          { kind: "interview", label: "AI Mock Interview — role-specific interview simulation (Infy Interview)" },
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
  };
}
