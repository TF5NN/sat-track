import { horizonAngle, type Horizon } from './terrain';

// The look-around view: the sky as seen from the station, turned towards `yaw` (true bearing)
// and tilted up by `pitch`, both in degrees. A stereographic projection keeps shapes natural
// even well away from the centre, so a wide view does not look stretched.
export type Camera = { yaw: number; pitch: number };
export type Frame = { width: number; height: number; scale: number };
const RAD = Math.PI / 180;
/** Directions further than about 154 degrees from the view centre are far off screen and dropped. */
const BEHIND = -0.9;

/** A frame whose width shows `fieldDegrees` of sky. */
export const frame = (width: number, height: number, fieldDegrees = 110): Frame => ({
  width,
  height,
  scale: width / 2 / (2 * Math.tan((fieldDegrees / 4) * RAD)),
});

/** Where a direction lands in the frame, or null when it is behind the viewer. */
export function project(camera: Camera, f: Frame, az: number, el: number): [number, number] | null {
  const d = (az - camera.yaw) * RAD,
    e = el * RAD,
    p = camera.pitch * RAD;
  const x = Math.cos(e) * Math.sin(d),
    up = Math.sin(e),
    ahead = Math.cos(e) * Math.cos(d);
  const y = up * Math.cos(p) - ahead * Math.sin(p),
    z = up * Math.sin(p) + ahead * Math.cos(p);
  if (z < BEHIND) return null;
  const k = (2 * f.scale) / (1 + z);
  return [f.width / 2 + x * k, f.height / 2 - y * k];
}

const pt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

/** SVG path through a list of directions, lifted wherever a point is behind the viewer. */
export function line(camera: Camera, f: Frame, points: { az: number; el: number }[]): string {
  let d = '',
    pen = false;
  for (const p of points) {
    const at = project(camera, f, p.az, p.el);
    if (at) d += `${pen ? 'L' : 'M'}${pt(at)}`;
    pen = !!at;
  }
  return d;
}

/** SVG path of the ground: everything below the terrain's skyline, all the way round. */
export function ground(camera: Camera, f: Frame, horizon: Horizon): string {
  // Built from small four-cornered pieces, so that a piece partly behind the viewer can simply be
  // left out: such pieces are always far off screen. One fine row follows the skyline; coarser
  // rows fill in below it, overlapping slightly so no gap shows.
  let d = '';
  const piece = (az: number, width: number, top: (az: number) => number, bottom: number) => {
    const corners = [
      project(camera, f, az, top(az)),
      project(camera, f, az + width, top(az + width)),
      project(camera, f, az + width, bottom),
      project(camera, f, az, bottom),
    ];
    if (corners.every(Boolean)) d += 'M' + corners.map((c) => pt(c!)).join('L') + 'Z';
  };
  const skyline = (az: number) => Math.max(-8, horizonAngle(horizon, az));
  for (let step = -180; step < 180; step++) piece(camera.yaw + step, 1, skyline, -10);
  for (const [top, bottom] of [
    [-9, -25],
    [-24, -45],
    [-44, -70],
  ])
    for (let step = -180; step < 180; step += 5) piece(camera.yaw + step, 5, () => top, bottom);
  return d;
}

/** A pass track cut into runs above the terrain (visible) and behind it (hidden). */
export function trackRuns(
  camera: Camera,
  f: Frame,
  track: { az: number; el: number }[],
  horizon: Horizon,
): { hidden: boolean; d: string }[] {
  const runs: { hidden: boolean; points: { az: number; el: number }[] }[] = [];
  track.forEach((p, i) => {
    const hidden = p.el <= horizonAngle(horizon, p.az),
      last = runs[runs.length - 1];
    if (!last || last.hidden !== hidden) runs.push({ hidden, points: i ? [track[i - 1], p] : [p] });
    else last.points.push(p);
  });
  return runs.map((r) => ({ hidden: r.hidden, d: line(camera, f, r.points) })).filter((r) => r.d);
}
