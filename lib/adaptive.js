// Adaptive (CAT-lite) capability engine — runs entirely client-side from the pre-built difficulty pool.
// Per cluster: start at a seeded level, step UP on correct / DOWN on wrong, bracket the ability in ~2-3 items.
// Output: a level per cluster (Novice/Developing/Proficient/Advanced) + confidence, with no API call.

export const LEVELS = ["Novice", "Developing", "Proficient", "Advanced"]; // index 0..3
export const LEVEL_COLOR = { Novice: "rose", Developing: "peel", Proficient: "brand", Advanced: "teal" };

// pick an unused question from pool[cluster][level], falling back to nearest level that has items
function pick(poolC, level, used) {
  const order = [level, level + 1, level - 1, level + 2, level - 2];
  for (const L of order) {
    const arr = poolC?.[String(L)] || [];
    const q = arr.find((x) => !used.has(x.q));
    if (q) return { q, level: L };
  }
  // everything used — allow reuse at requested level
  for (const L of order) {
    const arr = poolC?.[String(L)] || [];
    if (arr.length) return { q: arr[0], level: L };
  }
  return null;
}

// seedByCluster: optional { cluster: 1|2|3 } starting difficulty (from experience tier / résumé)
export function buildAdaptive(rolePool, clusters, seedByCluster = {}, opts = {}) {
  const maxPerCluster = opts.maxPerCluster || 3;
  const list = clusters.filter((c) => rolePool.pool[c]); // only clusters we have items for
  let ci = 0;
  const state = {}; // cluster -> { asked:[{level,correct,sure}], used:Set, curLevel, done }
  for (const c of list) state[c] = { asked: [], used: new Set(), curLevel: Math.max(1, Math.min(3, seedByCluster[c] || 1)), done: false };
  let cur = null; // { cluster, q, level }

  function loadNext() {
    while (ci < list.length) {
      const c = list[ci];
      const s = state[c];
      if (s.done) { ci++; continue; }
      const picked = pick(rolePool.pool[c], s.curLevel, s.used);
      if (!picked) { s.done = true; ci++; continue; }
      s.used.add(picked.q.q);
      cur = { cluster: c, q: picked.q, level: picked.level };
      return cur;
    }
    cur = null;
    return null;
  }

  function answer(optionIdx, sure) {
    if (!cur) return;
    const c = cur.cluster, s = state[c];
    const correct = optionIdx === cur.q.correct;
    s.asked.push({ level: cur.level, correct, sure: !!sure });
    // routing decision
    const n = s.asked.length;
    if (correct && cur.level < 3 && n < maxPerCluster) s.curLevel = cur.level + 1;       // probe higher (find ceiling)
    else if (!correct && cur.level > 1 && n < maxPerCluster) s.curLevel = cur.level - 1; // probe lower (find floor)
    else s.done = true;                                                                  // ceiling/floor/cap reached
    // also stop early if bracketed: a correct then an immediate wrong one level up
    if (!s.done && n >= 2) {
      const hasCorrect = s.asked.some((a) => a.correct);
      const hasWrongAbove = s.asked.some((a) => !a.correct && a.level > Math.max(0, ...s.asked.filter((x) => x.correct).map((x) => x.level)));
      if (hasCorrect && hasWrongAbove) s.done = true;
    }
    loadNext();
  }

  function totalAskedSoFar() { return list.reduce((a, c) => a + state[c].asked.length, 0); }

  function result() {
    const perCluster = list.map((c) => {
      const a = state[c].asked;
      const correctLevels = a.filter((x) => x.correct).map((x) => x.level);
      const maxCorrect = correctLevels.length ? Math.max(...correctLevels) : 0; // 0..3
      // label index: 0 None→Novice, 1→Developing, 2→Proficient, 3→Advanced
      let idx = maxCorrect; // 0..3 maps directly onto LEVELS
      // confidence: was the deciding correct answer marked 'sure'? any high-confidence wrong at/below it?
      const decider = a.find((x) => x.correct && x.level === maxCorrect);
      const shaky = maxCorrect > 0 && decider && decider.sure === false;
      const sureWrong = a.some((x) => !x.correct && x.sure && x.level <= maxCorrect);
      const confidence = maxCorrect === 0 ? "n/a" : (shaky || sureWrong) ? "low" : "solid";
      // if shaky, soften the label by half a notch conceptually (flag it, keep idx)
      return { cluster: c, label: LEVELS[idx], score: maxCorrect, confidence, items: a.length, uncertain: confidence === "low" };
    });
    const readiness = perCluster.length
      ? Math.round((perCluster.reduce((s, p) => s + p.score, 0) / (perCluster.length * 3)) * 100)
      : 0;
    return { perCluster, readiness, totalItems: totalAskedSoFar() };
  }

  loadNext();
  return {
    current: () => cur,
    answer,
    done: () => cur === null,
    progress: () => ({ asked: totalAskedSoFar(), clustersDone: list.filter((c) => state[c].done).length, clusters: list.length }),
    result,
    clusters: list,
  };
}

// map experience tier → base seed difficulty (1..3)
export function tierSeed(exp) {
  if (exp === "0") return 1;
  if (exp === "1-3") return 2;
  return 2; // 3-7 / 7+ start mid then climb (so we still confirm, not assume)
}
// résumé evidence → seed per cluster (verify claims: 'advanced' starts high to confirm)
export function resumeSeed(areas = {}) {
  const map = { none: 1, basic: 1, intermediate: 2, advanced: 3 };
  const out = {};
  for (const [c, v] of Object.entries(areas)) out[c] = map[v] || 1;
  return out;
}
