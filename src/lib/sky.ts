import { ecfToLookAngles, eciToEcf, gstime, jday } from 'satellite.js';
import type { Station } from './orbit';

// Where the sun and the moon are in the sky, for the look-around view. Low-precision formulas
// from the Astronomical Almanac: the sun to about 0.01 degrees, the moon to about 0.3 degrees,
// which is far finer than anyone can point by eye. Refraction is not applied.
const RAD = Math.PI / 180;
const AU_KM = 149597870.7,
  EARTH_RADIUS_KM = 6378.137;
const sin = (degrees: number) => Math.sin(degrees * RAD),
  cos = (degrees: number) => Math.cos(degrees * RAD);

/** Unit vector from the Earth's centre towards the sun, equatorial frame. */
export function sunDirection(date: Date): [number, number, number] {
  const n = jday(date) - 2451545,
    g = 357.528 + 0.9856003 * n,
    lambda = 280.46 + 0.9856474 * n + 1.915 * sin(g) + 0.02 * sin(2 * g),
    obliquity = 23.439 - 0.0000004 * n;
  return [cos(lambda), cos(obliquity) * sin(lambda), sin(obliquity) * sin(lambda)];
}

/** Vector from the Earth's centre to the moon in kilometres, equatorial frame. */
export function moonVector(date: Date): [number, number, number] {
  const n = jday(date) - 2451545,
    t = n / 36525;
  const lambda =
    218.32 +
    481267.881 * t +
    6.29 * sin(135.0 + 477198.87 * t) -
    1.27 * sin(259.3 - 413335.36 * t) +
    0.66 * sin(235.7 + 890534.22 * t) +
    0.21 * sin(269.9 + 954397.74 * t) -
    0.19 * sin(357.5 + 35999.05 * t) -
    0.11 * sin(186.5 + 966404.03 * t);
  const beta =
    5.13 * sin(93.3 + 483202.02 * t) +
    0.28 * sin(228.2 + 960400.89 * t) -
    0.28 * sin(318.3 + 6003.15 * t) -
    0.17 * sin(217.6 - 407332.21 * t);
  const parallax =
    0.9508 +
    0.0518 * cos(135.0 + 477198.87 * t) +
    0.0095 * cos(259.3 - 413335.36 * t) +
    0.0078 * cos(235.7 + 890534.22 * t) +
    0.0028 * cos(269.9 + 954397.74 * t);
  const r = EARTH_RADIUS_KM / sin(parallax),
    obliquity = 23.439 - 0.0000004 * n;
  return [
    r * cos(beta) * cos(lambda),
    r * (cos(obliquity) * cos(beta) * sin(lambda) - sin(obliquity) * sin(beta)),
    r * (sin(obliquity) * cos(beta) * sin(lambda) + cos(obliquity) * sin(beta)),
  ];
}

export type SkyPosition = { az: number; el: number };
function seenFrom(station: Station, date: Date, [x, y, z]: [number, number, number]): SkyPosition {
  const look = ecfToLookAngles(
    { latitude: station.lat * RAD, longitude: station.lon * RAD, height: station.height / 1000 },
    eciToEcf({ x, y, z }, gstime(date)),
  );
  return { az: look.azimuth / RAD, el: look.elevation / RAD };
}
/** Bearing and elevation of the sun from a station. */
export function sunPosition(time: number, station: Station): SkyPosition {
  const date = new Date(time),
    d = sunDirection(date);
  return seenFrom(station, date, [d[0] * AU_KM, d[1] * AU_KM, d[2] * AU_KM]);
}
/** Bearing and elevation of the moon from a station, as seen from the surface (with parallax). */
export function moonPosition(time: number, station: Station): SkyPosition {
  const date = new Date(time);
  return seenFrom(station, date, moonVector(date));
}
