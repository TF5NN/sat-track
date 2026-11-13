import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { parseTLE } from '../src/lib/orbit.ts';
import { parseBundle, validOrbit, plausibleOrbit, freshOrbit } from '../src/lib/orbital-data.ts';
import { prepareDataset } from '../scripts/sync-orbits.ts';
const now = Date.parse('2026-11-10T14:30:00Z');
const elements = parseTLE(readFileSync('tests/fixtures/orbits-2026-11-10.txt', 'utf8'));
const good = elements.find((e) => e.norad === 25544);
const bundle = {
  schemaVersion: 1,
  text: `ISS\n${good.line1}\n${good.line2}\n`,
  fetchedAt: new Date(now).toISOString(),
  provider: 'fixture',
  sources: [],
  missing: [],
};
test('dataset validates both TLE checksums and metadata', () => {
  assert.equal(parseBundle(bundle, now).elements[0].norad, 25544);
  for (const change of [
    { schemaVersion: 2 },
    { text: 'error page' },
    { fetchedAt: 'yesterday' },
    { fetchedAt: new Date(now + 86400000).toISOString() },
  ])
    assert.throws(() => parseBundle({ ...bundle, ...change }, now));
});
test('plausible fresh elements propagate and stale or future sets are rejected', () => {
  assert(validOrbit(good, now));
  assert(!validOrbit({ ...good, epoch: now - 8 * 86400000 }, now));
  assert(!validOrbit({ ...good, epoch: now + 2 * 86400000 }, now));
  assert(
    !validOrbit({ ...good, line2: good.line2.slice(0, 52) + '00.00000000' + good.line2.slice(63) }, now),
  );
});
test('partial downloads retain last good spacecraft and never downgrade epochs', () => {
  const fresh = elements.filter((e) => [25544, 27607].includes(e.norad));
  const result = prepareDataset([[{ ...good, epoch: good.epoch - 86400000 }]], fresh, now);
  assert(result.some((e) => e.norad === 27607));
  assert.equal(result.find((e) => e.norad === 25544).epoch, good.epoch);
  assert.equal(
    prepareDataset([[{ ...good, epoch: now + 2 * 86400000 }]], fresh, now).find((e) => e.norad === 25544)
      .epoch,
    good.epoch,
  );
  assert.equal(
    prepareDataset([elements], [], now).some((e) => e.norad === 7530),
    false,
    'only curated compatible spacecraft are published',
  );
});

test('all download failures leave the saved file byte-for-byte unchanged', async () => {
  const { mkdtemp, writeFile, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const { syncOrbits } = await import('../scripts/sync-orbits.ts');
  const dir = await mkdtemp(join(tmpdir(), 'sat-track-test-'));
  const file = pathToFileURL(join(dir, 'orbits.json'));
  const text = JSON.stringify(bundle);
  try {
    await writeFile(file, text);
    await assert.rejects(
      () =>
        syncOrbits({
          now,
          datasetPath: file,
          fetchImpl: async () => new Response('Unavailable', { status: 503 }),
        }),
      /All sources failed/,
    );
    assert.equal(await readFile(file, 'utf8'), text);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('one core spacecraft without elements does not block the daily update', async () => {
  const { mkdtemp, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const { syncOrbits } = await import('../scripts/sync-orbits.ts');
  const { elementText } = await import('../src/lib/elements.ts');
  const core = [25544, 27607, 43017, 61781, 59112];
  const feed = (ids) => async (url) =>
    String(url).includes('satnogs')
      ? Response.json([])
      : new Response(elementText(elements.filter((e) => !ids.includes(e.norad))));
  const dir = await mkdtemp(join(tmpdir(), 'sat-track-test-'));
  const file = pathToFileURL(join(dir, 'orbits.json'));
  try {
    await syncOrbits({ now, datasetPath: file, fetchImpl: feed([59112]) });
    const saved = JSON.parse(await readFile(file, 'utf8'));
    assert(saved.missing.includes(59112), 're-entered spacecraft is recorded as missing');
    assert(
      parseBundle(saved, now).elements.some((e) => e.norad === 25544),
      'other spacecraft are still published',
    );
    const text = await readFile(file, 'utf8');
    // With nothing saved to fall back on, a feed with no core spacecraft at all must not publish.
    const empty = pathToFileURL(join(dir, 'none.json'));
    await assert.rejects(
      () => syncOrbits({ now, datasetPath: empty, fetchImpl: feed(core) }),
      /No core spacecraft/,
    );
    await assert.rejects(() => readFile(empty, 'utf8'), /ENOENT/);
    assert.equal(await readFile(file, 'utf8'), text);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('age and plausibility are judged separately, and bundled data loads on a slow clock', () => {
  const stale = { ...good, epoch: now - 8 * 86400000 };
  assert(
    plausibleOrbit(stale) && !freshOrbit(stale, now) && !validOrbit(stale, now),
    'an old but sound orbit is a warning, not corrupt data',
  );
  assert(!plausibleOrbit({ ...good, line2: good.line2.slice(0, 52) + '00.00000000' + good.line2.slice(63) }));
  assert.throws(
    () => parseBundle(bundle, now - 86400000),
    'downloads dated in the future are still rejected',
  );
  assert.equal(
    parseBundle(bundle, Infinity).elements[0].norad,
    25544,
    'the bundled copy is accepted whatever the device clock says',
  );
});

test('AMSAT reception reports are summarised per catalogue service and never block orbits', async () => {
  const { mkdtemp, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const { syncOrbits } = await import('../scripts/sync-orbits.ts');
  const { elementText } = await import('../src/lib/elements.ts');
  const { catalog } = await import('../src/lib/catalog.ts');
  const { activityFor, activityText, parseActivity, summarizeReports } =
    await import('../src/lib/activity.ts');
  assert(
    catalog.every((s) => /^[A-Za-z0-9.-]+_\[[A-Za-z_]+\]$/.test(s.amsat)),
    'every service names its AMSAT status entry',
  );
  assert.equal(new Set(catalog.map((s) => s.amsat)).size, catalog.length, 'one AMSAT entry per service');
  const row = (name, report, report_count) => ({ name, report, report_count });
  const summary = {
    meta: { hours: 168 },
    data: [
      row('SO-50_[FM]', 'Heard', 89),
      row('SO-50_[FM]', 'Not Heard', 3),
      row('AO-91_[FM]', 'Not Heard', 5),
      row('AO-91_[FM]', 'Telemetry Only', 2),
      row('RS18S_[SSTV]', 'Not Heard', 2),
      row('RS40S_[SSTV]', 'Heard', 6),
      row('RS40S_[SSTV]', 'Telemetry Only', 12),
      row('RS38S_[SSTV]', 'Heard', 2),
      row('RS38S_[SSTV]', 'Not Heard', 2),
      row('AO-7_[U/v]', 'Heard', 40),
      row('ISS_[FM]', 'Heard', 'many'),
    ],
  };
  const feed = (status) => async (url) =>
    String(url).includes('summary.php')
      ? status()
      : String(url).includes('satnogs')
        ? Response.json([])
        : new Response(elementText(elements));
  const dir = await mkdtemp(join(tmpdir(), 'sat-track-test-'));
  const file = pathToFileURL(join(dir, 'orbits.json'));
  try {
    await syncOrbits({ now, datasetPath: file, fetchImpl: feed(() => Response.json(summary)) });
    const saved = JSON.parse(await readFile(file, 'utf8'));
    assert.deepEqual(
      saved.activity.reports,
      {
        'SO-50_[FM]': { heard: 89, total: 92 },
        'AO-91_[FM]': { heard: 0, total: 7 },
        'RS18S_[SSTV]': { heard: 0, total: 2 },
        'RS40S_[SSTV]': { heard: 6, total: 18 },
        'RS38S_[SSTV]': { heard: 2, total: 4 },
      },
      'only catalogue services, only valid counts',
    );
    const activity = parseActivity(saved.activity),
      sat = (id) => catalog.find((s) => s.id === id);
    const so = activityFor(sat('so50'), activity, now),
      ao = activityFor(sat('ao91'), activity, now),
      quiet = activityFor(sat('po101'), activity, now);
    assert.deepEqual([so.total, so.percent, so.warning, so.days], [92, 97, null, 7]);
    assert.equal(activityText(so), '92 AMSAT reports · 97% heard · 7 days');
    assert.equal(ao.warning, 'Not heard recently', 'three or more reports and none heard');
    assert.equal(activityFor(sat('rs40'), activity, now).warning, 'Rarely heard', '6 of 18 is under half');
    assert.equal(activityFor(sat('rs38'), activity, now).warning, null, 'exactly half is not a warning');
    const few = activityFor(sat('rs18'), activity, now);
    assert(!few.warning && few.total === 2 && few.percent === 0, 'fewer than three reports never warn');
    const { uncertain } = await import('../src/lib/catalog.ts');
    assert(uncertain(sat('ao91')), 'AO-91 is listed with the uncertain repeaters');
    assert(
      !quiet.warning && quiet.total === 0 && activityText(quiet) === 'No AMSAT reports in 7 days',
      'silence is unknown, not a warning',
    );
    assert.equal(
      activityFor(sat('so50'), activity, now + 4 * 86400000),
      null,
      'a summary older than three days is not shown',
    );
    assert.equal(activityFor(sat('so50'), null, now), null);
    assert.equal(parseActivity({ hours: 168 }), null);
    assert.throws(() => summarizeReports({ error: 'x' }, [], 168, now));
    // The next day AMSAT is down: orbits still publish and yesterday's summary is kept.
    await syncOrbits({
      now: now + 3600000,
      datasetPath: file,
      fetchImpl: feed(() => new Response('Unavailable', { status: 503 })),
    });
    const next = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(next.fetchedAt, new Date(now + 3600000).toISOString());
    assert.deepEqual(next.activity, saved.activity);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
