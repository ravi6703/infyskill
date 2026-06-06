"use client";
// SVG charts for plan insights — no chart libraries.

export function WeeklyLoadChart({ weeks, hoursPerWeek }) {
  const W = Math.max(560, weeks.length * 34), H = 150, pad = 26;
  const maxH = Math.max(hoursPerWeek, ...weeks.map((w) =>
    w.asyncHours + (w.sync || []).reduce((a, s) => a + s.hours, 0) + (w.project?.hours || 0) + (w.masterclass?.hours || 0)));
  const bw = (W - pad * 2) / weeks.length;
  const y = (h) => (H - 30) * (h / maxH);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: W }} className="w-full">
        {weeks.map((w, i) => {
          const segs = [
            ["#6366f1", w.asyncHours],
            ["#8b5cf6", (w.sync || []).reduce((a, s) => a + s.hours, 0)],
            ["#f43f5e", w.project?.hours || 0],
            ["#d946ef", (w.masterclass?.hours || 0) + (w.assessment?.hours || 0)],
          ];
          let cy = H - 24;
          return (
            <g key={w.n}>
              {segs.map(([c, h], k) => {
                if (!h) return null;
                const hh = y(h); cy -= hh;
                return <rect key={k} x={pad + i * bw + 3} y={cy} width={bw - 6} height={hh} fill={c} rx="2" />;
              })}
              {w.type !== "content" && (
                <text x={pad + i * bw + bw / 2} y={12} textAnchor="middle" fontSize="9" fill={w.type === "hackathon" ? "#fb923c" : "#fb7185"}>
                  {w.type === "hackathon" ? "🏆" : "🎓"}
                </text>
              )}
              <text x={pad + i * bw + bw / 2} y={H - 10} textAnchor="middle" fontSize="8.5" fill="#8C8C8C">W{w.n}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function PhaseChart({ weeks }) {
  const phases = {};
  for (const w of weeks) {
    const h = w.asyncHours + (w.sync || []).reduce((a, s) => a + s.hours, 0) + (w.project?.hours || 0) + (w.masterclass?.hours || 0);
    phases[w.phase] = (phases[w.phase] || 0) + h;
  }
  const entries = Object.entries(phases);
  const total = entries.reduce((a, [, h]) => a + h, 0);
  const COLORS = { "Foundation": "#0ea5e9", "Core Build": "#6366f1", "Specialization": "#8b5cf6", "Career Launch": "#f43f5e" };
  return (
    <div className="space-y-2">
      {entries.map(([p, h]) => (
        <div key={p} className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-ink-500">{p}</span>
          <div className="h-3 flex-1 overflow-hidden rounded bg-ink-100">
            <div className="h-full rounded" style={{ width: `${(h / total) * 100}%`, background: COLORS[p] }} />
          </div>
          <span className="w-14 text-right text-xs text-ink-700">{Math.round(h)}h</span>
        </div>
      ))}
    </div>
  );
}

export function ScoreRing({ value, label, size = 110 }) {
  const r = size / 2 - 10, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E6F7FF" strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#g)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <defs><linearGradient id="g"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#1F1F1F" fontSize="20" fontWeight="800">{value}</text>
      </svg>
      <span className="mt-1 text-xs text-ink-500">{label}</span>
    </div>
  );
}
