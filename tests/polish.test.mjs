import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { parseLocator, locatorFor } from '../src/lib/locator.ts';
import { exportTLE, orbitUsable } from '../src/lib/tle-export.ts';
import { parseTLE } from '../src/lib/orbit.ts';
const close = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`);
const hp4 = parseLocator('HP94');
close(hp4.lat, 64.5);
close(hp4.lon, -21);
const hp6 = parseLocator(' hp94aD ');
assert.equal(hp6.locator, 'HP94AD');
close(hp6.lat, 64.14583333333333);
close(hp6.lon, -21.95833333333333);
const hp8 = parseLocator('HP94ad25');
close(hp8.lat, 64.14791666666666);
close(hp8.lon, -21.97916666666667);
const london = parseLocator('IO91wm');
close(london.lat, 51.520833333333336);
close(london.lon, -0.125);
for (const value of [
  '',
  'AA',
  'HP9',
  'HP94a',
  'HP94ad2',
  'HP94ad2500',
  'SP94ad',
  'HP94yz',
  'HP94ad2X',
  'HP 94',
  'HP-94',
  '<script>',
])
  assert.equal(parseLocator(value), null, `invalid locator ${value}`);
for (const loc of [
  'AA00',
  'AA00aa',
  'AA00aa00',
  'RR99',
  'RR99xx',
  'RR99xx99',
  'HP94ad',
  'IO91wm',
  'QF56oc',
  'BL11bh',
]) {
  const cell = parseLocator(loc);
  assert(cell);
  assert(cell.lat > -90 && cell.lat < 90 && cell.lon > -180 && cell.lon < 180);
  if (loc.length >= 6)
    assert.equal(locatorFor(cell.lat, cell.lon).toUpperCase(), loc.slice(0, 6).toUpperCase());
}
assert.equal(locatorFor(90, 180), 'RR99xx');
assert.equal(locatorFor(-90, -180), 'AA00aa');
const elements = parseTLE(readFileSync('tests/fixtures/orbits-2026-11-10.txt', 'utf8'));
for (const element of elements) {
  const two = exportTLE(element),
    three = exportTLE(element, true);
  assert.equal(two, element.line1 + '\r\n' + element.line2 + '\r\n');
  assert.equal(three, element.name + '\r\n' + two);
  const reimport = parseTLE(three);
  assert.equal(reimport.length, 1);
  assert.equal(reimport[0].norad, element.norad);
  assert.equal(reimport[0].epoch, element.epoch);
  assert.equal(reimport[0].line1, element.line1);
  assert.equal(reimport[0].line2, element.line2);
  assert(orbitUsable(element, element.epoch + 86400000));
  assert(orbitUsable(element, element.epoch + 7 * 86400000));
  assert(!orbitUsable(element, element.epoch + 7 * 86400000 + 1));
  assert(!orbitUsable(element, element.epoch - 86400001));
}
assert(!orbitUsable(undefined, Date.now()));
assert.equal(
  exportTLE(elements[0], true, 'AO-123\n'),
  'AO-123\r\n' + elements[0].line1 + '\r\n' + elements[0].line2 + '\r\n',
  'download uses the catalogue name',
);
const nameless = parseTLE(
  elements
    .slice(0, 3)
    .map((e) => e.line1 + '\n' + e.line2)
    .join('\n'),
);
assert.equal(nameless.length, 3);
assert(
  nameless.every((e) => e.name === ''),
  'name-less files never take an element line as a name',
);
assert.deepEqual(
  parseTLE(
    elements
      .slice(0, 3)
      .map((e) => e.name + '\n' + e.line1 + '\n' + e.line2)
      .join('\n'),
  ).map((e) => e.name),
  elements.slice(0, 3).map((e) => e.name),
);
const original = elements[0],
  updated = { ...original, line1: elements[1].line1, line2: elements[1].line2 };
assert.notEqual(
  exportTLE(original),
  exportTLE(updated),
  'export always reflects the supplied latest element',
);
console.log(
  JSON.stringify(
    {
      result: 'PASS',
      gridFormats: [4, 6, 8],
      knownLocations: ['HP94', 'HP94ad', 'HP94ad25', 'IO91wm'],
      exportRoundTrips: elements.length,
      checks: [
        'cell centres',
        'case and whitespace normalization',
        'invalid locators',
        'polar/date-line boundaries',
        'TLE columns and checksums preserved',
        'fresh/stale export limits',
        'updated element export',
      ],
    },
    null,
    2,
  ),
);
