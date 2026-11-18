import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { X } from 'lucide-react';
import { useModalFocus } from '../hooks/use-modal-focus';
import { compass, type Pass, type Station } from '../lib/orbit';
import { frame, ground, line, project, trackRuns, type Camera } from '../lib/panorama';
import { moonPosition, sunPosition } from '../lib/sky';
import { ANTENNA_METRES, nearestGround, type Horizon } from '../lib/terrain';
import type { Clock } from '../lib/time';

const WIDTH = 400,
  HEIGHT = 300,
  view = frame(WIDTH, HEIGHT),
  MAX_PITCH = 75;
const turn = (degrees: number) => ((degrees % 360) + 360) % 360;
const ring = (el: number) => Array.from({ length: 121 }, (_, i) => ({ az: i * 3, el }));
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// The optional look-around view: the terrain's skyline as seen from the station, with the pass
// drawn across it, the sun and the moon, and direction and elevation marks. Dragging turns the view.
export default function LookAround({
  pass,
  station,
  horizon,
  live,
  now,
  clock,
  onClose,
}: {
  pass: Pass;
  station: Station;
  horizon: Horizon;
  live: { az: number; el: number } | null; // the satellite right now, during the pass
  now: number;
  clock: Clock;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLElement>(null);
  useModalFocus(modalRef, true, onClose, []);
  const [camera, setCamera] = useState<Camera>(() => ({
    yaw: turn(live ? live.az : pass.aos.az),
    pitch: 20,
  }));
  const drag = useRef<{ x: number; y: number; camera: Camera; perPixel: number } | null>(null);
  const move = (yaw: number, pitch: number) =>
    setCamera({ yaw: turn(yaw), pitch: Math.max(0, Math.min(MAX_PITCH, pitch)) });
  const down = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    // Degrees turned per pixel dragged, so the scene follows the finger near the centre.
    const perPixel = (WIDTH / e.currentTarget.getBoundingClientRect().width / view.scale) * (180 / Math.PI);
    drag.current = { x: e.clientX, y: e.clientY, camera, perPixel };
  };
  const dragged = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (d)
      move(d.camera.yaw - (e.clientX - d.x) * d.perPixel, d.camera.pitch + (e.clientY - d.y) * d.perPixel);
  };
  const key = (e: KeyboardEvent) => {
    const step = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }[e.key];
    if (!step) return;
    e.preventDefault();
    move(camera.yaw + step[0], camera.pitch + step[1]);
  };

  // During the pass the sun and moon are where they are now; before it, where they will be at its middle.
  const skyTime = live ? now : pass.peak.time;
  const { sun, moon } = useMemo(
    () => ({ sun: sunPosition(skyTime, station), moon: moonPosition(skyTime, station) }),
    [Math.round(skyTime / 10000), station],
  );
  const at = (az: number, el: number) => {
    const p = project(camera, view, az, el);
    return p && p[0] > -30 && p[0] < WIDTH + 30 && p[1] > -30 && p[1] < HEIGHT + 30 ? p : null;
  };
  const runs = trackRuns(camera, view, pass.track, horizon);
  const marks = [
    { p: at(pass.aos.az, pass.aos.el), label: `Rise ${clock.time(pass.aos.time)}`, hollow: false },
    { p: at(pass.los.az, pass.los.el), label: `Set ${clock.time(pass.los.time)}`, hollow: true },
  ];
  const peak = at(pass.peak.az, pass.peak.el),
    dot = live && live.el >= 0 ? at(live.az, live.el) : null,
    sunAt = sun.el > -1 ? at(sun.az, sun.el) : null,
    moonAt = moon.el > -1 ? at(moon.az, moon.el) : null,
    zenith = at(0, 90);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={modalRef}
        className="modal look-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="look-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close icon-button" aria-label="Close look around" onClick={onClose}>
          <X size={18} />
        </button>
        <span className="eyebrow">LOOK AROUND</span>
        <h2 id="look-title">{pass.sat.name}</h2>
        <svg
          className="look-view"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          tabIndex={0}
          aria-label={`View from your spot towards ${compass(camera.yaw)}, tilted ${Math.round(camera.pitch)} degrees up. The pass rises in the ${compass(pass.aos.az)} and sets in the ${compass(pass.los.az)}. Drag or use the arrow keys to look around.`}
          onPointerDown={down}
          onPointerMove={dragged}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={key}
        >
          <rect width={WIDTH} height={HEIGHT} className="look-sky" />
          {[30, 60].map((el) => (
            <path key={el} d={line(camera, view, ring(el))} className="look-grid" strokeDasharray="3 4" />
          ))}
          {[0, 90, 180, 270].map((az) => (
            <path
              key={az}
              d={line(
                camera,
                view,
                Array.from({ length: 31 }, (_, i) => ({ az, el: i * 3 })),
              )}
              className="look-grid"
            />
          ))}
          {[30, 60].map((el) => {
            const p = at(camera.yaw, el);
            return (
              p && (
                <text key={el} x={p[0] + 4} y={p[1] - 3} className="look-degree">
                  {el}°
                </text>
              )
            );
          })}
          {[0, 90, 180, 270].map((az) => {
            const p = at(az, 76);
            return (
              p && (
                <text key={az} x={p[0] + 3} y={p[1]} className="look-degree">
                  {DIRECTIONS[az / 45]}
                </text>
              )
            );
          })}
          {zenith && (
            <text x={zenith[0]} y={zenith[1] - 5} textAnchor="middle" className="look-degree">
              overhead
            </text>
          )}
          {sunAt && (
            <g>
              <circle cx={sunAt[0]} cy={sunAt[1]} r="7" className="look-sun" />
              <text x={sunAt[0]} y={sunAt[1] - 11} textAnchor="middle" className="look-body">
                Sun
              </text>
            </g>
          )}
          {moonAt && (
            <g>
              <circle cx={moonAt[0]} cy={moonAt[1]} r="6" className="look-moon" />
              <text x={moonAt[0]} y={moonAt[1] - 10} textAnchor="middle" className="look-body">
                Moon
              </text>
            </g>
          )}
          <path d={ground(camera, view, horizon)} className="look-ground" />
          <path d={line(camera, view, ring(0))} className="look-level" />
          {Array.from({ length: 24 }, (_, i) => i * 15).map((az) => {
            const a = at(az, 0),
              b = at(az, -1.5),
              label = at(az, -5);
            return (
              a &&
              b && (
                <g key={az}>
                  <path d={`M${a[0]},${a[1]}L${b[0]},${b[1]}`} className="look-tick" />
                  {label && (
                    <text
                      x={label[0]}
                      y={label[1] + 3}
                      textAnchor="middle"
                      className={az % 45 ? 'look-bearing' : 'look-cardinal'}
                    >
                      {az % 45 ? `${az}°` : DIRECTIONS[az / 45]}
                    </text>
                  )}
                </g>
              )
            );
          })}
          {runs.map((r, i) => (
            <path
              key={i}
              d={r.d}
              fill="none"
              stroke="var(--green-bright)"
              strokeWidth={r.hidden ? 1.6 : 2.5}
              strokeDasharray={r.hidden ? '1 5' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {marks.map(
            (m) =>
              m.p && (
                <g key={m.label}>
                  <circle
                    cx={m.p[0]}
                    cy={m.p[1]}
                    r="4"
                    fill={m.hollow ? 'var(--sky)' : 'var(--green-bright)'}
                    stroke="var(--green-bright)"
                    strokeWidth="1.8"
                  />
                  <text
                    x={Math.max(26, Math.min(WIDTH - 26, m.p[0]))}
                    y={m.p[1] - 9}
                    textAnchor="middle"
                    className="look-mark"
                  >
                    {m.label}
                  </text>
                </g>
              ),
          )}
          {peak && <circle cx={peak[0]} cy={peak[1]} r="3" fill="var(--green-bright)" />}
          {dot && (
            <>
              <circle cx={dot[0]} cy={dot[1]} r="9" fill="var(--green-bright)" opacity=".2" />
              <circle cx={dot[0]} cy={dot[1]} r="4.5" fill="var(--ink-deep)" />
            </>
          )}
        </svg>
        <p className="look-facing">
          Looking <strong>{compass(camera.yaw)}</strong> · {Math.round(camera.yaw) % 360}° ·{' '}
          {Math.round(camera.pitch)}° up
          {live && (
            <>
              {' '}
              · satellite at <strong>{Math.round(live.az) % 360}°</strong> {compass(live.az)},{' '}
              <strong>{Math.max(0, live.el).toFixed(0)}°</strong> up
            </>
          )}
        </p>
        <p>
          Drag to look around. This is the terrain’s skyline from {ANTENNA_METRES} m above the ground at your
          spot, with the pass drawn across it; the dotted part is behind terrain. Sun and moon are shown{' '}
          {live ? 'where they are now' : `where they will be at ${clock.time(pass.peak.time)}, mid-pass`}.
          Buildings, trees and ground closer than {nearestGround(horizon)} m are not included.
        </p>
      </section>
    </div>
  );
}
