import { compass, type Pass } from '../lib/orbit';

export function SkyPlot({ pass, live }: { pass: Pass; live?: { az: number; el: number } | null }) {
  const xy = (p: { az: number; el: number }) => {
    const r = ((90 - Math.max(0, p.el)) / 90) * 94,
      a = (p.az * Math.PI) / 180;
    return [120 + Math.sin(a) * r, 120 - Math.cos(a) * r];
  };
  const a = xy(pass.aos),
    b = xy(pass.los),
    peak = xy(pass.peak),
    path = pass.track.map((p, i) => `${i ? 'L' : 'M'}${xy(p).join(',')}`).join(' '),
    current = live && live.el >= 0 ? xy(live) : null;
  return (
    <svg
      className="skyplot"
      viewBox="0 0 240 240"
      role="img"
      aria-label={`Sky path from ${compass(pass.aos.az)} through ${pass.peak.el.toFixed(0)} degrees elevation to ${compass(pass.los.az)}. North at top, east at right.`}
    >
      <circle cx="120" cy="120" r="94" fill="#f4f7f2" stroke="#cfdad4" />
      {[31.33, 62.67].map((r) => (
        <circle key={r} cx="120" cy="120" r={r} fill="none" stroke="#d6dfd8" strokeDasharray="3 4" />
      ))}
      <path d="M26 120H214M120 26V214" stroke="#d6dfd8" />
      <text x="120" y="14" textAnchor="middle" className="sky-cardinal">
        N
      </text>
      <text x="228" y="124" textAnchor="middle" className="sky-cardinal">
        E
      </text>
      <text x="120" y="234" textAnchor="middle" className="sky-cardinal">
        S
      </text>
      <text x="12" y="124" textAnchor="middle" className="sky-cardinal">
        W
      </text>
      <text x="124" y="61" className="sky-degree">
        30°
      </text>
      <text x="124" y="93" className="sky-degree">
        60°
      </text>
      <path d={path} fill="none" stroke="#21806a" strokeWidth="2.5" />
      <circle cx={a[0]} cy={a[1]} r="4" fill="#21806a" />
      <circle cx={b[0]} cy={b[1]} r="4" fill="#f8faf5" stroke="#21806a" strokeWidth="1.8" />
      <circle cx={peak[0]} cy={peak[1]} r="3" fill="#21806a" />
      {current && (
        <>
          <circle cx={current[0]} cy={current[1]} r="8" fill="#21806a" opacity=".2" />
          <circle cx={current[0]} cy={current[1]} r="4" fill="#142f32" />
        </>
      )}
    </svg>
  );
}
export function Arc({ pass }: { pass: Pass }) {
  const d = pass.track.map((p, i) => `${i ? 'L' : 'M'}${(i / 60) * 74},${36 - (p.el / 90) * 32}`).join(' ');
  return (
    <svg viewBox="0 0 74 42" className="mini-arc" aria-hidden="true">
      <path d="M0 36H74" stroke="#d7dfd8" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
