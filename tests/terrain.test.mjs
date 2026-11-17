import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { exactSpot, horizonAngle, inIceland, terrainView } from '../src/lib/terrain.ts';

// A made-up horizon: a 10 degree wall to the north, flat elsewhere, one value per 90 degrees.
const wall = { angles: [10, 0, 0, 0], stepDegrees: 90, groundMetres: 50 };

test('the terrain check is offered only inside Iceland and only for an exact spot', () => {
  assert(inIceland({ lat: 64.13, lon: -21.92, height: 30 }));
  assert(!inIceland({ lat: 51.5, lon: -0.12, height: 30 }), 'London');
  assert(!inIceland({ lat: 62.0, lon: -6.8, height: 30 }), 'Faroe Islands');
  assert(exactSpot({ lat: 64.13, lon: -21.92, height: 30 }));
  assert(
    !exactSpot({ lat: 64.13, lon: -21.92, height: 30, locator: 'HP94AD' }),
    'a grid square is not exact',
  );
});

test('the horizon is blended between directions and wraps at north', () => {
  assert.equal(horizonAngle(wall, 0), 10);
  assert.equal(horizonAngle(wall, 45), 5);
  assert.equal(horizonAngle(wall, 315), 5);
  assert.equal(horizonAngle(wall, 180), 0);
  assert.equal(horizonAngle(wall, -45), 5);
});

// A pass rising in the north and setting in the south, one sample per second.
const pass = (peak) =>
  Array.from({ length: 601 }, (_, i) => ({
    time: 1_000_000 + i * 1000,
    az: i < 300 ? 0 : 180,
    el: peak * Math.sin((Math.PI * i) / 600) + 0.01,
  }));

test('a pass over a wall is partly blocked, with the time it clears', () => {
  const v = terrainView(pass(40), wall);
  assert.equal(v.verdict, 'partly');
  // sin(pi i / 600) * 40 > 10 from i = 49 onward
  assert.equal(v.clears, 1_000_000 + 49 * 1000);
  assert.equal(v.behind, 1_000_000 + 600 * 1000, 'the southern half is open to the horizon');
  assert.equal(v.totalSeconds, 601);
  assert.equal(v.visibleSeconds, 601 - 49);
});

test('a pass that never tops the wall is blocked; an open sky is clear', () => {
  const low = Array.from({ length: 300 }, (_, i) => ({
    time: i * 1000,
    az: 0,
    el: 6 * Math.sin((Math.PI * i) / 299),
  }));
  const blocked = terrainView(low, wall);
  assert.deepEqual(
    [blocked.verdict, blocked.clears, blocked.behind, blocked.visibleSeconds],
    ['blocked', null, null, 0],
  );
  const open = { angles: [-0.1, -0.1, -0.1, -0.1], stepDegrees: 90, groundMetres: 0 };
  assert.equal(terrainView(pass(40), open).verdict, 'clear');
  const nearly = { angles: [0.2, 0, 0, 0], stepDegrees: 90, groundMetres: 0 };
  assert.equal(terrainView(pass(40), nearly).verdict, 'clear', 'a second or two at the edge is still clear');
});
