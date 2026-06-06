"use client";
// Lightweight SVG radar chart: target (outline) vs plan/current (filled).
export default function Radar({ data, size = 320 }) {
  if (!data || data.length < 3) return null;
  const cx = size / 2, cy = size / 2, R = size * 0.36;
  const N = data.length;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [cx + Math.cos(a) * R * (v / 100), cy + Math.sin(a) * R * (v / 100)];
  };
  const poly = (key) => data.map((d, i) => pt(i, d[key]).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-sm">
      {[25, 50, 75, 100].map((r) => (
        <polygon key={r} points={data.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke="#1e293b" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#1e293b" strokeWidth="1" />;
      })}
      <polygon points={poly("target")} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" />
      <polygon points={poly("plan")} fill="rgba(99,102,241,0.25)" stroke="#818cf8" strokeWidth="2" />
      {data.map((d, i) => {
        const [x, y] = pt(i, 118);
        return (
          <text key={d.cluster} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="10">
            {d.cluster.length > 18 ? d.cluster.slice(0, 17) + "…" : d.cluster}
          </text>
        );
      })}
    </svg>
  );
}
