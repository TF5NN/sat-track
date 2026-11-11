import { twoline2satrec, propagate } from 'satellite.js';
import { parseTLE, type Element } from './orbit';

export type OrbitBundle = {
  schemaVersion: 1; text: string; fetchedAt: string; provider: string;
  sources: {name: string; url: string; fetchedAt: string}[];
  missing: number[];
};
const DAY = 86400000;
// Fresh enough to predict with: at most 7 days old and at most 1 day in the future.
export const freshOrbit = (element: Element, now: number) =>
  element.epoch <= now + DAY && now - element.epoch <= 7 * DAY;
export const validOrbit = (element: Element, now: number) =>
  freshOrbit(element, now) && plausibleOrbit(element);
// Structurally sound and propagates, whatever its age.
export function plausibleOrbit(element: Element): boolean {
  if (element.norad <= 0) return false;
  const epochDay = Number(element.line1.slice(20,32));
  const inclination = Number(element.line2.slice(8,16));
  const eccentricity = Number('0.' + element.line2.slice(26,33));
  const motion = Number(element.line2.slice(52,63));
  if (!(epochDay >= 1 && epochDay < 367 && inclination >= 0 && inclination <= 180
    && eccentricity >= 0 && eccentricity < 1 && motion > 0 && motion < 18)) return false;
  try {
    const rec = twoline2satrec(element.line1, element.line2);
    return [element.epoch, element.epoch + 3600000].every(time => {
      const state = propagate(rec, new Date(time));
      const position = state?.position;
      return !!position && typeof position !== 'boolean' && Number.isFinite(position.x)
        && Number.isFinite(position.y) && Number.isFinite(position.z)
        && Math.hypot(position.x, position.y, position.z) > 6370;
    });
  } catch { return false; }
}
export function parseBundle(value: unknown, now: number): {bundle: OrbitBundle; elements: Element[]} {
  const b = value as Partial<OrbitBundle> | null;
  if (!b || b.schemaVersion !== 1 || typeof b.text !== 'string' || typeof b.provider !== 'string'
    || !Number.isFinite(Date.parse(b.fetchedAt ?? '')) || Date.parse(b.fetchedAt!) > now + 300000
    || !Array.isArray(b.sources) || !Array.isArray(b.missing)) throw Error('Invalid orbital dataset');
  // Retain expired elements for truthful age diagnostics; the predictor excludes them.
  const elements = parseTLE(b.text);
  if (!elements.length) throw Error('No valid orbital elements');
  return {bundle:b as OrbitBundle,elements};
}
