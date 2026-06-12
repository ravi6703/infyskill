// On-brand vector illustrations (Board Infinity blue/peel/teal) to break up text-heavy screens.
// Lightweight inline SVG — no external assets, no load cost.

export function HeroArt({ className = "" }) {
  return (
    <svg viewBox="0 0 480 360" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="ha-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FCA106" /><stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      {/* path: course -> skill -> career */}
      <path d="M40 300 C 150 300, 150 180, 240 180 S 340 60, 440 60" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" />
      {/* nodes */}
      {[[40,300,"📘"],[240,180,"⚡"],[440,60,"🚀"]].map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r="30" fill="rgba(255,255,255,0.12)" />
          <circle cx={x} cy={y} r="22" fill="rgba(255,255,255,0.22)" />
          <text x={x} y={y+7} textAnchor="middle" fontSize="22">{["📘","⚡","🚀"][i]}</text>
        </g>
      ))}
      {/* floating skill chips */}
      {[[120,90,"Python"],[330,250,"GenAI"],[210,300,"RAG"],[360,150,"MLOps"]].map(([x,y,t],i)=>(
        <g key={i} opacity="0.9">
          <rect x={x} y={y} width={String(t).length*8+22} height="26" rx="13" fill="rgba(255,255,255,0.16)" />
          <text x={x+12} y={y+17} fontSize="12" fill="#fff" fontWeight="700">{t}</text>
        </g>
      ))}
      {/* accent orb */}
      <circle cx="430" cy="60" r="46" fill="url(#ha-g)" opacity="0.25" />
    </svg>
  );
}

// Small motif per product card / section. variant: catalog | specialization | degree | diagnostic | university
export function Motif({ variant = "catalog", className = "" }) {
  const C = { blue: "#148AFF", peel: "#FCA106", teal: "#05C170", rose: "#D13845", ink: "#C1C8D1" };
  const wrap = (children) => (
    <svg viewBox="0 0 120 90" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>{children}</svg>
  );
  if (variant === "catalog") return wrap(<>
    {[0,1,2].map(i=>(<rect key={i} x={12+i*34} y={20+ i*6} width="28" height="50" rx="5" fill={i===1?C.blue:"#F5FAFF"} stroke={C.blue} strokeWidth="1.5"/>))}
    <circle cx="92" cy="24" r="9" fill={C.peel}/>
  </>);
  if (variant === "specialization") return wrap(<>
    <path d="M20 70 L45 70 L60 40 L80 40 L100 18" stroke={C.blue} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {[[20,70],[60,40],[100,18]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="7" fill={i===2?C.peel:C.blue}/>))}
    <circle cx="100" cy="18" r="13" fill="none" stroke={C.peel} strokeWidth="1.5" opacity="0.5"/>
  </>);
  if (variant === "degree") return wrap(<>
    <path d="M60 18 L100 34 L60 50 L20 34 Z" fill={C.blue}/>
    <path d="M38 42 L38 60 Q60 72 82 60 L82 42" stroke={C.peel} strokeWidth="2.5" fill="none"/>
    <line x1="100" y1="34" x2="100" y2="54" stroke={C.peel} strokeWidth="2.5"/>
    <circle cx="100" cy="56" r="4" fill={C.peel}/>
  </>);
  if (variant === "diagnostic") return wrap(<>
    <circle cx="48" cy="45" r="26" fill="none" stroke={C.blue} strokeWidth="3"/>
    <line x1="67" y1="64" x2="92" y2="80" stroke={C.blue} strokeWidth="4" strokeLinecap="round"/>
    <path d="M38 45 L46 53 L60 36" stroke={C.teal} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </>);
  if (variant === "university") return wrap(<>
    <rect x="24" y="34" width="72" height="40" rx="4" fill="#F5FAFF" stroke={C.blue} strokeWidth="1.5"/>
    <path d="M24 34 L60 16 L96 34 Z" fill={C.blue}/>
    {[36,54,72].map((x,i)=>(<rect key={i} x={x} y="46" width="10" height="28" fill="#fff" stroke={C.blue} strokeWidth="1"/>))}
  </>);
  return null;
}

// Decorative band of neural nodes for section backgrounds
export function NodeBand({ className = "" }) {
  return (
    <svg viewBox="0 0 600 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden preserveAspectRatio="none">
      {Array.from({ length: 7 }).map((_, i) => {
        const x = 50 + i * 85, y = 20 + (i % 2) * 40;
        return <g key={i}>
          {i < 6 && <line x1={x} y1={y} x2={x + 85} y2={20 + ((i + 1) % 2) * 40} stroke="#A3DDFF" strokeWidth="1.5" />}
          <circle cx={x} cy={y} r="5" fill="#148AFF" />
        </g>;
      })}
    </svg>
  );
}
