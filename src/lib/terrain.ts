import type { Station } from './orbit';

// Optional terrain check, for Iceland only. The terrain layers and the horizon calculation live
// in a separate repository (github.com/TF5NN/terrain) and are loaded from its published copy
// only when the visitor asks for the check, so the planner itself stays as small as it was.
export const TERRAIN_BASE = 'https://tf5nn.github.io/terrain/v1/';
/** The antenna is taken to be this far above the ground at the spot. */
export const ANTENNA_METRES = 2;

/** The terrain's elevation angle, in degrees, on every `stepDegrees` of true bearing from north. */
export type Horizon = {
  angles: ArrayLike<number>;
  stepDegrees: number;
  groundMetres: number;
  nearestMetres?: number; // ground closer than this was left out
};
/** How close to the station the ground starts to count: 10 m with the 10 m terrain data, 100 m without. */
export const nearestGround = (h: Horizon) => h.nearestMetres ?? 100;

type TerrainModule = {
  openTerrain: (base: string) => Promise<{
    covers: (lat: number, lon: number) => Promise<boolean>;
    horizon: (at: {
      lat: number;
      lon: number;
      antennaMetres: number;
      closeDetail?: boolean;
    }) => Promise<Horizon>;
  }>;
};
let opened: ReturnType<TerrainModule['openTerrain']> | null = null;
const cache = new Map<string, Promise<Horizon>>();

/** A quick box around Iceland: whether to offer the check at all. Nothing is loaded for this. */
export const inIceland = (s: Station) => s.lat > 63.2 && s.lat < 66.7 && s.lon > -24.8 && s.lon < -13.2;

/** A station given only as a grid square is the square's centre, which is too vague for terrain. */
export const exactSpot = (s: Station) => !s.locator || s.exact === true;

/** The horizon around a station. Loads the terrain code and the few tiles it needs on first use. */
export function loadHorizon(station: Station): Promise<Horizon> {
  const key = `${station.lat.toFixed(5)},${station.lon.toFixed(5)}`;
  if (!cache.has(key)) {
    const pending = (async () => {
      opened ??= (import(/* @vite-ignore */ `${TERRAIN_BASE}horizon.js`) as Promise<TerrainModule>).then(
        (m) => m.openTerrain(TERRAIN_BASE),
      );
      const terrain = await opened;
      if (!(await terrain.covers(station.lat, station.lon)))
        throw new Error('No terrain data for this spot.');
      // closeDetail: the ground under the station and the closest 500 m from the 10 m data, counted
      // from 10 m out. Without it the nearest 100 m is left out, and on a hilltop or slope the
      // hillside beside the station, which is the real horizon there, goes missing.
      return terrain.horizon({
        lat: station.lat,
        lon: station.lon,
        antennaMetres: ANTENNA_METRES,
        closeDetail: true,
      });
    })();
    pending.catch(() => {
      cache.delete(key);
      opened = null;
    });
    cache.set(key, pending);
  }
  return cache.get(key)!;
}

/** The horizon's angle on any bearing, blended between the two nearest directions. */
export function horizonAngle(h: Horizon, bearing: number): number {
  const n = h.angles.length,
    f = (((bearing % 360) + 360) % 360) / h.stepDegrees,
    i = Math.floor(f) % n,
    t = f - Math.floor(f);
  return h.angles[i] * (1 - t) + h.angles[(i + 1) % n] * t;
}

export type TerrainView = {
  verdict: 'clear' | 'partly' | 'blocked';
  clears: number | null; // first moment the satellite is above the terrain
  behind: number | null; // last such moment
  visibleSeconds: number;
  totalSeconds: number;
};
// A few seconds lost at the very edge of a pass is not worth calling "blocked".
const CLEAR_WITHIN_SECONDS = 5;

/** What the terrain does to a pass, from positions sampled once a second. */
export function terrainView(samples: { time: number; az: number; el: number }[], h: Horizon): TerrainView {
  const visible = samples.map((s) => s.el > horizonAngle(h, s.az));
  const first = visible.indexOf(true),
    last = visible.lastIndexOf(true),
    seen = visible.filter(Boolean).length;
  return {
    verdict: seen === 0 ? 'blocked' : samples.length - seen <= CLEAR_WITHIN_SECONDS ? 'clear' : 'partly',
    clears: first < 0 ? null : samples[first].time,
    behind: last < 0 ? null : samples[last].time,
    visibleSeconds: seen,
    totalSeconds: samples.length,
  };
}
