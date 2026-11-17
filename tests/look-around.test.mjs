import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { frame, ground, line, project, trackRuns } from '../src/lib/panorama.ts';
import { moonPosition, moonVector, sunDirection, sunPosition } from '../src/lib/sky.ts';

const DEG = 180 / Math.PI;
const reykjavik = { lat: 64.1466, lon: -21.9426, height: 30 };

test('the sun and moon formulas match textbook positions', () => {
  // Meeus, Astronomical Algorithms, example 25.a: 1992 October 13, RA 198.38, Dec -7.785.
  const s = sunDirection(new Date(Date.UTC(1992, 9, 13)));
  assert(Math.abs(((Math.atan2(s[1], s[0]) * DEG + 360) % 360) - 198.38) < 0.05);
  assert(Math.abs(Math.asin(s[2]) * DEG + 7.785) < 0.05);
  // Example 47.a: 1992 April 12, moon RA 134.688, Dec 13.768, 368410 km away.
  const m = moonVector(new Date(Date.UTC(1992, 3, 12))),
    r = Math.hypot(...m);
  assert(Math.abs(((Math.atan2(m[1], m[0]) * DEG + 360) % 360) - 134.688) < 0.3);
  assert(Math.abs(Math.asin(m[2] / r) * DEG - 13.768) < 0.3);
  assert(Math.abs(r - 368410) < 1500);
});

test('the sun is due south and at the expected height at Reykjavik noon', () => {
  const june = sunPosition(Date.parse('2026-06-21T13:30:00Z'), reykjavik);
  assert(Math.abs(june.az - 180) < 1, `bearing ${june.az}`);
  assert(Math.abs(june.el - (90 - 64.1466 + 23.44)) < 0.2, `height ${june.el}`);
  const night = sunPosition(Date.parse('2026-11-17T00:00:00Z'), reykjavik);
  assert(night.el < -30, 'well below the horizon at midnight in November');
  const moon = moonPosition(Date.parse('2026-11-17T13:13:00Z'), reykjavik);
  assert(moon.az >= 0 && moon.az < 360 && Math.abs(moon.el) <= 90);
});

test('the look-around view puts directions where they belong', () => {
  const f = frame(400, 300),
    north = { yaw: 0, pitch: 0 };
  assert.deepEqual(project(north, f, 0, 0), [200, 150], 'straight ahead is the centre');
  assert(project(north, f, 30, 0)[0] > 200, 'east of north is to the right');
  assert(project(north, f, 0, 30)[1] < 150, 'higher is further up');
  assert(Math.abs(project(north, f, 55, 0)[0] - 400) < 0.01, 'the frame is 110 degrees wide');
  assert.equal(project(north, f, 180, 0), null, 'directly behind is not drawn');
  assert.deepEqual(project({ yaw: 350, pitch: 20 }, f, 350, 20), [200, 150]);
  // A line that passes behind the viewer is drawn in pieces, never across the screen.
  const all = Array.from({ length: 73 }, (_, i) => ({ az: i * 5, el: 0 }));
  assert((line(north, f, all).match(/M/g) ?? []).length >= 2);
});

test('the ground and the hidden part of a pass follow the terrain', () => {
  const f = frame(400, 300),
    camera = { yaw: 0, pitch: 20 },
    wall = { angles: [10, 0, 0, 0], stepDegrees: 90, groundMetres: 50 };
  const d = ground(camera, f, wall);
  assert(d.startsWith('M') && d.endsWith('Z') && !d.includes('NaN'));
  const track = [
    { az: 0, el: 2 },
    { az: 0, el: 8 },
    { az: 0, el: 14 },
    { az: 0, el: 20 },
  ];
  assert.deepEqual(
    trackRuns(camera, f, track, wall).map((r) => r.hidden),
    [true, false],
  );
});
