// Interface safety net. Drives the built app through its main paths with a frozen clock and
// records the page's HTML at each step. Use it around changes that must not alter the page:
//
//   npm run build && node tests/ui/snapshot.mjs write    (before the change)
//   npm run build && node tests/ui/snapshot.mjs check    (after the change)
//
// Needs Playwright with Chromium available to Node; it is not part of `npm test` or CI.
// The snapshot depends on public/data/orbits.json, so do not refresh the data in between.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const mode = process.argv[2] === 'write' ? 'write' : 'check';
const file = new URL('./.snapshot.json', import.meta.url);
const shots = new URL('./.shots/', import.meta.url);
const port = 4317,
  url = `http://localhost:${port}/sat-track/`;
const fetchedAt = Date.parse(
  JSON.parse(readFileSync(new URL('../../public/data/orbits.json', import.meta.url), 'utf8')).fetchedAt,
);
const clockAt = fetchedAt + 3600000; // one hour after the dataset was published

const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
  stdio: 'ignore',
  detached: true,
});
const stop = () => {
  try {
    process.kill(-server.pid);
  } catch {
    /* already stopped */
  }
};
process.on('exit', stop);
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(url)).ok) break;
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 200));
}

const result = {};
const browser = await chromium.launch();
async function open(name, options = {}, time = clockAt, prepare) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    timezoneId: 'Europe/Berlin',
    locale: 'en-GB',
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write'],
    ...options,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => {
    result[`${name}: page error ${Object.keys(result).length}`] = e.message;
  });
  if (prepare) await prepare(page);
  await page.clock.install({ time });
  await page.clock.pauseAt(time + 1000);
  await page.goto(url, { waitUntil: 'networkidle' });
  const snap = async (label) => {
    await page.waitForTimeout(150);
    result[`${name}: ${label}`] = await page.evaluate(() => {
      const a = document.activeElement;
      const focus =
        !a || a === document.body
          ? 'body'
          : `${a.tagName.toLowerCase()}|${a.getAttribute('aria-label') ?? ''}|${(a.textContent ?? '').trim().slice(0, 40)}`;
      return (
        `<!-- focus: ${focus} | scroll locked: ${getComputedStyle(document.body).overflow} -->\n` +
        document.getElementById('root').innerHTML.replaceAll(' style=""', '')
      ); // screenshots can leave an empty style attribute
    });
    if (mode === 'write' || process.argv.includes('--shots')) {
      mkdirSync(shots, { recursive: true });
      await page.screenshot({
        path: new URL(`${mode}-${name}-${label}`.replace(/[^a-z0-9-]+/gi, '_') + '.png', shots).pathname,
        fullPage: true,
      });
    }
  };
  const download = async (label, click) => {
    const [d] = await Promise.all([page.waitForEvent('download'), click()]);
    result[`${name}: ${label}`] = d.suggestedFilename() + '\n' + readFileSync(await d.path(), 'utf8');
  };
  const tick = async (ms) => {
    await page.clock.runFor(ms);
  };
  return { page, snap, download, tick, close: () => context.close() };
}

// ---- Desktop: the full walk-through
{
  const { page, snap, download, tick, close } = await open('desktop');
  await snap('01 opening dialog');
  await page.keyboard.press('Shift+Tab');
  await snap('02 shift-tab wraps inside dialog');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await snap('03 escape cannot skip first confirmation');
  await page.getByRole('tab', { name: 'Maidenhead grid' }).click();
  await snap('04 grid tab');
  await page.getByLabel('Maidenhead locator').fill('ZZ');
  await page.getByRole('button', { name: /Use this location/ }).click();
  await snap('05 invalid grid');
  await page.getByRole('tab', { name: 'Coordinates' }).click();
  await page.getByLabel('Latitude').fill('95');
  await page.getByRole('button', { name: /Use this location/ }).click();
  await snap('06 invalid latitude');
  await page.getByLabel('Latitude').fill('64.1466');
  await page.getByLabel('Longitude').fill('-21.9426');
  await page.getByRole('button', { name: /Use this location/ }).click();
  await tick(1000);
  await snap('07 planner defaults');
  await tick(3000);
  await snap('08 clock advanced 3 s');
  await page.locator('.pass-row').nth(2).click();
  await snap('09 third pass selected');
  await page.getByLabel('Preview Doppler across pass').fill('50');
  await snap('10 doppler scrubbed to middle');
  await download('11 calendar file', () => page.getByRole('button', { name: /Save pass/ }).click());
  await page.getByRole('button', { name: /HT app orbital data/ }).click();
  await snap('12 orbit dialog');
  await page.getByRole('button', { name: 'Copy TLE line 1' }).click();
  await snap('13 line copied');
  await page.getByRole('button', { name: /Copy both TLE lines/ }).click();
  await snap('14 both copied');
  await download('15 tle file', () => page.getByRole('button', { name: /Download .tle/ }).click());
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await snap('16 tab inside orbit dialog');
  await page.keyboard.press('Escape');
  await snap('17 orbit dialog closed by escape');
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await snap('18 status all');
  await page.getByRole('button', { name: /Show next/ }).click();
  await snap('19 show more');
  await page.getByLabel('Mode').selectOption('SSTV');
  await snap('20 mode sstv');
  await page.getByLabel('Downlink band').selectOption('70cm');
  await snap('21 downlink 70cm');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByLabel(/Include uncertain repeaters/).check();
  await snap('22 uncertain repeaters');
  await page.getByLabel('Satellite', { exact: true }).selectOption('ao91');
  await snap('23 ao91 with not-heard warning');
  await page.getByLabel('Look ahead').selectOption('72');
  await snap('24 look ahead 72 h');
  await page.getByLabel('Minimum peak elevation').fill('30');
  await snap('25 minimum peak 30');
  await page.getByLabel('Minimum peak elevation').fill('90');
  await snap('26 nothing matches');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await snap('27 reset from empty state');
  await page.getByRole('button', { name: 'Listen', exact: true }).click();
  await snap('28 listen only');
  await page.getByRole('button', { name: 'Satellite guide' }).click();
  await snap('29 guide, listen');
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await snap('30 guide, all');
  await page
    .locator('.guide-card')
    .nth(1)
    .getByRole('button', { name: /Orbital data for/ })
    .click();
  await snap('31 orbit dialog from guide');
  await page.getByRole('button', { name: 'Close orbital data' }).click();
  await page
    .locator('.guide-card')
    .nth(5)
    .getByRole('button', { name: /View passes/ })
    .click();
  await snap('32 view passes from guide');
  await page.getByRole('button', { name: /Sources & prediction notes/ }).click();
  await snap('33 sources dialog');
  await page.keyboard.press('Escape');
  await snap('34 sources closed by escape');
  await page.getByRole('button', { name: 'Data details' }).click();
  await page.getByRole('button', { name: 'Back to planner' }).click();
  await snap('35 sources via data details and back');
  await page.getByRole('button', { name: 'Show UTC times' }).click();
  await snap('36 utc times');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  // Jump three minutes into the first listed pass to see the live state.
  await page.locator('.pass-row').first().click();
  const label = await page.locator('.pass-row').first().getAttribute('aria-label');
  const [h, m] = label
    .match(/at (\d\d):(\d\d) UTC/)
    .slice(1)
    .map(Number);
  const now = await page.evaluate(() => Date.now());
  let aos = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
    h,
    m,
  );
  if (aos < now) aos += 86400000;
  await page.clock.fastForward(aos - now + 240000);
  await tick(1000);
  await snap('37 live during a pass');
  await tick(2000);
  await snap('38 live two seconds later');
  await page.locator('.station-summary').click();
  await snap('39 station dialog reopened');
  await page.keyboard.press('Escape');
  await snap('40 station dialog closed by escape');
  await page.locator('.station-summary').click();
  await page.getByRole('tab', { name: 'Maidenhead grid' }).click();
  await page.getByLabel('Maidenhead locator').fill('OI33kd');
  await page.getByRole('button', { name: /Save station/ }).click();
  await tick(1000);
  await snap('41 station moved to OI33kd');
  await page.getByRole('button', { name: 'Refresh orbital data' }).click();
  await snap('42 after manual refresh');
  await page.reload({ waitUntil: 'networkidle' });
  await snap('43 reload remembers station and utc');
  await page.getByRole('button', { name: /Use this location/ }).click();
  await tick(1000);
  await snap('44 after reload confirmed');
  await close();
}
// ---- Phone layout
{
  const { page, snap, tick, close } = await open('phone', {
    ...devices['iPhone 13'],
    timezoneId: 'America/St_Johns',
  });
  await page.getByRole('button', { name: 'Use Reykjavík default' }).click();
  await tick(1000);
  await snap('01 planner');
  await page.locator('.pass-row').nth(1).click();
  await snap('02 pass panel open');
  await page.getByRole('button', { name: 'Close pass details' }).click();
  await snap('03 pass panel closed');
  await page.getByRole('button', { name: 'Satellite guide' }).click();
  await snap('04 guide');
  await close();
}
// ---- Event banner: a dated event hidden by the Work view
{
  const { page, snap, tick, close } = await open('event');
  await page.getByRole('button', { name: 'Use Reykjavík default' }).click();
  await tick(1000);
  await snap('01 banner in work view');
  await page.getByRole('button', { name: 'Satellite guide' }).click();
  await snap('02 banner on guide');
  // The banner only exists while the catalogue has a dated event running.
  if (await page.locator('.event-banner').count()) {
    await page.locator('.event-banner').getByRole('button', { name: 'Show passes' }).click();
    await snap('03 show passes from banner');
  }
  await close();
}
// ---- Optional extras: the Map tab and, in Iceland, the terrain check.
// Map tiles are replaced by a blank image and the terrain comes from a made-up module,
// so the result does not depend on outside services.
{
  const blank = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  const fakeTerrain = `export async function openTerrain() { return {
    covers: async () => true,
    horizon: async () => ({ stepDegrees: 90, groundMetres: 71, angles: [12, 3, 0, 6] }) }; }`;
  const { page, snap, tick, close } = await open('extras', {}, clockAt, async (p) => {
    await p.route('**/tile.openstreetmap.org/**', (r) =>
      r.fulfill({ contentType: 'image/png', body: blank }),
    );
    await p.route('**/tf5nn.github.io/terrain/**', (r) =>
      r.fulfill({
        contentType: 'text/javascript',
        headers: { 'access-control-allow-origin': '*' },
        body: fakeTerrain,
      }),
    );
  });
  await page.getByRole('tab', { name: 'Map' }).click();
  await tick(1000); // the map appears after a short timer, and this clock is frozen
  await page.locator('.map-picker.leaflet-container').waitFor();
  await page.getByRole('button', { name: /Use this location/ }).click();
  await snap('01 map tab needs a pin');
  const box = await page.locator('.map-picker').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await tick(500);
  result['extras: 02 pin placed'] = await page.locator('.map-picker + .grid-help').innerText();
  await page.getByRole('button', { name: 'Use Reykjavík default' }).click();
  await tick(1000);
  await page.locator('.terrain-toggle[aria-pressed]').click();
  await page.locator('.terrain-strip strong').waitFor();
  await snap('03 terrain shown for the open pass');
  await page.getByRole('button', { name: 'Look around' }).click();
  await snap('03b look around');
  await page.locator('.look-view').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await snap('03c look around, turned');
  await page.keyboard.press('Escape');
  await snap('03d look around closed');
  await page.locator('.terrain-toggle[aria-pressed]').click();
  await snap('04 terrain hidden again');
  await page.locator('.station-summary').click();
  await page.getByRole('tab', { name: 'Maidenhead grid' }).click();
  await page.getByLabel('Maidenhead locator').fill('HP94ad');
  await page.getByRole('button', { name: /Save station/ }).click();
  await tick(1000);
  await page.locator('.terrain-toggle[aria-pressed]').click();
  await snap('05 a grid square is not exact enough');
  await close();
}
// ---- Light and dark: follows the device, and the header button switches and remembers
{
  const { page, snap, tick, close } = await open('theme');
  await page.getByRole('button', { name: 'Use Reykjavík default' }).click();
  await tick(1000);
  result['theme: 01 follows the device (light here)'] = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  await page.getByRole('button', { name: 'Switch to the dark theme' }).click();
  result['theme: 02 dark after the button'] = await page.evaluate(
    () => `${document.documentElement.dataset.theme} / remembered ${localStorage.getItem('tf5nn-theme')}`,
  );
  await snap('03 dark');
  await page.reload();
  await tick(1000);
  result['theme: 04 still dark after reloading'] = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  await page.getByRole('button', { name: /Use this location/ }).click(); // each opening asks to confirm the station
  await tick(1000);
  await page.getByRole('button', { name: 'Switch to the light theme' }).click();
  result['theme: 05 light again'] = await page.evaluate(() => document.documentElement.dataset.theme);
  await close();
}
// ---- Satellites for other radios: off by default, then switched on
{
  const { page, snap, tick, close } = await open('other radios');
  await page.getByRole('button', { name: 'Use Reykjavík default' }).click();
  await tick(1000);
  await page.getByLabel(/Show satellites for other radios/).check();
  await snap('01 switched on');
  await page.getByLabel('Mode').selectOption('Linear SSB/CW');
  await snap('02 linear transponders only');
  await page.getByRole('button', { name: 'Satellite guide' }).click();
  await snap('03 guide');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await snap('04 reset switches it off');
  await close();
}
// ---- "Use my location": the device reports London; then a device that refuses
{
  const { page, snap, tick, close } = await open('location', {
    geolocation: { latitude: 51.5074, longitude: -0.1278 },
    permissions: ['geolocation'],
  });
  await snap('01 first visit, empty grid');
  await page.getByRole('button', { name: 'Use my location' }).click();
  await snap('02 device location found');
  await page.getByRole('button', { name: /Use this location/ }).click();
  await tick(1000);
  await snap('03 planner for IO91WM');
  await close();
}
{
  const { page, snap, close } = await open('location refused', { permissions: [] });
  await page.getByRole('button', { name: 'Use my location' }).click();
  await snap('01 permission declined');
  await close();
}
// ---- Device clock two days behind the data
{
  const { page, snap, tick, close } = await open('slow clock', {}, fetchedAt - 2 * 86400000);
  await page.getByRole('button', { name: 'Use Reykjavík default' }).click();
  await tick(1000);
  await snap('01 clock warning');
  await close();
}
// ---- Published data unreachable, and data eight days old
{
  const { page, snap, tick, close } = await open('offline', {}, clockAt, (p) =>
    p.route('**/data/orbits.json', (r) => r.abort()),
  );
  await page.getByRole('button', { name: 'Use Reykjavík default' }).click();
  await tick(1000);
  await snap('01 saved data notice');
  await close();
}
{
  const { page, snap, tick, close } = await open('old data', {}, fetchedAt + 8 * 86400000);
  await page.getByRole('button', { name: 'Use Reykjavík default' }).click();
  await tick(1000);
  await snap('01 everything expired');
  await page.getByRole('button', { name: 'Data details' }).click();
  await snap('02 unavailable ids in sources');
  await close();
}
await browser.close();
stop();

const steps = Object.keys(result);
if (mode === 'write') {
  writeFileSync(file, JSON.stringify(result, null, 1));
  console.log(`Recorded ${steps.length} steps.`);
  process.exit(0);
}
if (!existsSync(file)) {
  console.error('No recorded snapshot. Run with "write" on the known-good build first.');
  process.exit(1);
}
const before = JSON.parse(readFileSync(file, 'utf8'));
const changed = [...new Set([...Object.keys(before), ...steps])].filter((k) => before[k] !== result[k]);
for (const k of changed.slice(0, 5)) {
  const a = before[k] ?? '(missing)',
    b = result[k] ?? '(missing)';
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  console.error(
    `\nDIFFERENT: ${k}\n  before: …${a.slice(Math.max(0, i - 120), i + 160)}\n  after:  …${b.slice(Math.max(0, i - 120), i + 160)}`,
  );
}
console.log(
  changed.length
    ? `${changed.length} of ${steps.length} steps differ.`
    : `All ${steps.length} steps identical.`,
);
process.exit(changed.length ? 1 : 0);
