import { compass, type Pass } from '../lib/orbit';
import { horizonAngle, type Horizon } from '../lib/terrain';

export function SkyPlot({
  pass,
  live,
  horizon,
}: {
  pass: Pass;
  live?: { az: number; el: number } | null;
  horizon?: Horizon | null; // optional terrain: shades the ground and dots the hidden part of the track
}) {
  const xy = (p: { az: number; el: number }) => {
    const r = ((90 - Math.max(0, p.el)) / 90) * 94,
      a = (p.az * Math.PI) / 180;
    return [120 + Math.sin(a) * r, 120 - Math.cos(a) * r];
  };
  const a = xy(pass.aos),
    b = xy(pass.los),
    peak = xy(pass.peak),
    path = pass.track.map((p, i) => `${i ? 'L' : 'M'}${xy(p).join(',')}`).join(' '),
    // With terrain: the rim of the plot filled in up to the ground's angle in each direction ...
    ground = horizon
      ? `M120 26A94 94 0 1 1 119.99 26Z` +
        Array.from({ length: 181 }, (_, i) => {
          const az = i * 2;
          return `${i ? 'L' : 'M'}${xy({ az, el: Math.max(0, horizonAngle(horizon, az)) })
            .map((v) => v.toFixed(1))
            .join(',')}`;
        }).join('') +
        'Z'
      : '',
    // ... and the track cut into runs that are above it (solid) and behind it (dotted).
    runs = horizon
      ? pass.track.reduce<{ hidden: boolean; d: string }[]>((list, p, i) => {
          const hidden = p.el <= horizonAngle(horizon, p.az),
            at = xy(p).join(',');
          if (!i || list[list.length - 1].hidden !== hidden) {
            const from = i ? xy(pass.track[i - 1]).join(',') : at;
            list.push({ hidden, d: `M${from}${i ? `L${at}` : ''}` });
          } else list[list.length - 1].d += `L${at}`;
          return list;
        }, [])
      : null,
    current = live && live.el >= 0 ? xy(live) : null;
  return (
    <svg
      className="skyplot"
      viewBox="0 0 240 240"
      role="img"
      aria-label={`Sky path from ${compass(pass.aos.az)} through ${pass.peak.el.toFixed(0)} degrees elevation to ${compass(pass.los.az)}. North at top, east at right.`}
    >
      <circle cx="120" cy="120" r="94" fill="var(--sky)" stroke="var(--line-strong)" />
      {[31.33, 62.67].map((r) => (
        <circle key={r} cx="120" cy="120" r={r} fill="none" stroke="var(--grid)" strokeDasharray="3 4" />
      ))}
      <path d="M26 120H214M120 26V214" stroke="var(--grid)" />
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
      {ground && <path className="sky-ground" d={ground} fillRule="evenodd" />}
      {runs ? (
        runs.map((r, i) => (
          <path
            key={i}
            d={r.d}
            fill="none"
            stroke="var(--green-bright)"
            strokeWidth={r.hidden ? 1.6 : 2.5}
            strokeDasharray={r.hidden ? '1 5' : undefined}
            strokeLinecap="round"
          />
        ))
      ) : (
        <path d={path} fill="none" stroke="var(--green-bright)" strokeWidth="2.5" />
      )}
      <circle cx={a[0]} cy={a[1]} r="4" fill="var(--green-bright)" />
      <circle cx={b[0]} cy={b[1]} r="4" fill="var(--sky)" stroke="var(--green-bright)" strokeWidth="1.8" />
      <circle cx={peak[0]} cy={peak[1]} r="3" fill="var(--green-bright)" />
      {current && (
        <>
          <circle cx={current[0]} cy={current[1]} r="8" fill="var(--green-bright)" opacity=".2" />
          <circle cx={current[0]} cy={current[1]} r="4" fill="var(--ink-deep)" />
        </>
      )}
    </svg>
  );
}
export function Arc({ pass }: { pass: Pass }) {
  const d = pass.track.map((p, i) => `${i ? 'L' : 'M'}${(i / 60) * 74},${36 - (p.el / 90) * 32}`).join(' ');
  return (
    <svg viewBox="0 0 74 42" className="mini-arc" aria-hidden="true">
      <path d="M0 36H74" stroke="var(--grid)" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
