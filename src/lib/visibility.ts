import { type Satellite } from './catalog';
import { type Pass, type Station } from './orbit';

// One shared set drives every satellite selector, guide and orbit-data entry.
// Reachable means an unexpired modeled operating window in the chosen look-ahead,
// at or above the chosen minimum pass peak. It does not assert live RF activity.
export function reachableCatalog(catalog: Satellite[], passes: Pass[], now: number, elevation: number): Satellite[] {
  const ids = new Set(passes.filter(p => p.los.time > now && p.peak.el >= elevation
    && p.windows.some(([a,b]) => b > Math.max(a,now))).map(p => p.sat.id));
  return catalog.filter(s => ids.has(s.id));
}

export function localizePasses(passes: Pass[], station: Station, hours: number): Pass[] {
  const iss = passes.filter(p => p.sat.norad === 25544);
  const peak = Math.max(0, ...iss.map(p => p.peak.el));
  if (!iss.length || Math.abs(station.lat) < 55 || peak >= 20) return passes;
  const note = ` From this station, ISS passes peak at ${Math.ceil(peak)}° or lower in the next ${hours} hours. Keep a clear ${station.lat > 0 ? 'southern' : 'northern'} horizon.`;
  return passes.map(p => p.sat.norad === 25544 ? {...p, sat:{...p.sat,notes:p.sat.notes + note}} : p);
}
