# Northbound — TF5NN Satellite Planner

A small, static amateur-satellite planner designed for the VGC VR-N76 and a 2 m / 70 cm Yagi. Pass, frequency and Doppler guidance also applies to other FM half-duplex dual-band radios.

**App:** https://tf5nn.github.io/sat-track/

## What it does

- Asks for a Maidenhead grid square (4, 6 or 8 characters) on opening, with coordinates as a second tab. A first visit starts with an empty field; "Use my location" fills in the device's 6-character square and keeps the exact position with it, and Reykjavík is offered as a default. The last station is remembered in that browser and shown as a grid square.
- Calculates passes on the visitor's device with satellite.js / SGP4.
- Opens on the services the station can work (FM voice and APRS) from a 5° peak; receive-only services are one tap away under All / Listen.
- Shows pass times in device-local time with UTC alongside, with a switch to UTC; the choice is remembered.
- Announces a dated event (such as an ISS SSTV week) in a banner on both tabs when it is reachable but hidden by the Work view; the banner disappears when the event ends.
- Shows AMSAT reception reports for each service (report count and % heard over 7 days) and warns when a service has at least three reports and none ("Not heard recently") or fewer than half ("Rarely heard") of them heard it.
- Lists Doppler settings as 5 kHz radio steps, only as many as the pass needs (retune when the drift passes 3.5 kHz).
- Uses one reachable-service set for pass lists, satellite choices, the guide and orbital-data controls. A service needs a remaining modeled operating window in the selected 24/48/72 hours at the selected minimum peak elevation.
- Separates compatible FM voice / 1200-baud AFSK APRS operation from receive-only APRS and FM SSTV.
- **Show satellites for other radios** (off by default) adds linear transponders, data digipeaters, telemetry beacons and picture downlinks, marked "Other radio". Their frequencies come from the SatNOGS database, not from the hand-checked catalogue.
- Optional extras that load nothing until asked for: a **Map** tab for choosing an exact spot, and, in Iceland, **Check terrain**, which shades the ground on the sky plot, dots the part of the track behind it and gives the times the satellite clears and drops behind the terrain. The terrain data and calculation live in [TF5NN/terrain](https://github.com/TF5NN/terrain).
- During a pass, shows the live heading and elevation in large figures beside the sky plot, with whether the satellite is rising or falling.
- Shows UTC timing, true bearings, sky paths, frequencies, CTCSS, Doppler guidance and concise source-linked notes.
- Exports calendar events with the station's grid square, radio settings, operating notes and source links, plus current TLE lines for manual entry in the HT app.

APRS requires compatible packet/TNC support and configuration; SSTV requires an audio decoder. A geometric pass does not establish that a satellite is transmitting. Unscheduled activations remain conditional. There is no automatic radio control or live receiver.

## Run locally

Use Node.js 24 (see `.nvmrc`).

```sh
npm ci
npm run dev
```

Open the URL Vite prints, including `/sat-track/`.

```sh
npm test
npm run validate:data
npm run build
npm run preview
```

`npm run build` first checks that the source, scripts, tests and stylesheet are formatted with Prettier; run `npm run format` to fix a failure.

Design decisions, the reasons behind the defaults and open items are recorded in [`docs/DECISIONS.md`](docs/DECISIONS.md). Read it before changing defaults.

## Code layout

- `src/App.tsx` holds the page's state and wires the pieces together.
- `src/components/` has one file per part of the page: filters, pass list, pass briefing, satellite guide, summary strip, data status and the three dialogs.
- `src/hooks/` loads and refreshes the orbital data and handles keyboard focus inside dialogs.
- `src/lib/` is the calculation and data code (orbits, catalogue, time formatting, AMSAT reports, calendar and TLE export), covered by `npm test`.

`npm run test:ui -- write` records the built app's HTML across 67 steps (dialogs, filters, a live pass, phone layout, clock and data warnings) with a frozen clock; `npm run test:ui -- check` compares a later build against it. Use it around changes that must not alter the page. It needs Playwright with Chromium and is not part of `npm test` or CI.

The build is ordinary static HTML/CSS/JavaScript in `dist/`. It needs no backend, accounts, database or runtime secrets.

## Daily orbital-data update

`.github/workflows/pages.yml` runs at **03:17 UTC every day**, and can be run manually from GitHub Actions. It downloads:

- AMSAT: https://www.amsat.org/tle/current/nasabare.txt
- SatNOGS supplementary TLEs: https://db.satnogs.org/api/tle/
- AMSAT status report summary (CC BY 4.0), 7-day window, one request: https://status.amsat.org/api/v1/summary.php
- SatNOGS transmitter database (CC BY-SA 4.0), for the satellites in `src/lib/extras.ts`: https://db.satnogs.org/api/transmitters/
- CelesTrak amateur elements if AMSAT fails: https://celestrak.org/NORAD/elements/gp.php?GROUP=amateur&FORMAT=tle

The updater validates TLE checksums and matching IDs, epoch age, plausible orbital parameters and successful propagation. It resolves followed SatNOGS IDs from the TLE columns and retains the newest valid set per listed spacecraft. Previous valid elements fill gaps in partial downloads. Failed downloads do not overwrite the published dataset. Publication is blocked only when none of the core spacecraft has valid elements. Any individual spacecraft without valid elements, core or not, is recorded, logged as a warning and hidden in the app, so a re-entered or untracked satellite cannot stop the daily update.

A successful workflow tests, builds, commits `public/data/orbits.json`, and deploys the matching static artifact directly. The bot commit does not need to trigger a second workflow. Only the small curated dataset is sent to visitors. A copy is bundled into the app as a fallback, and the last successful dataset is cached in browser storage.

The app checks the shared published file on opening, hourly and when returning after an hour away. **Refresh checks the published file; it does not download from providers.** Element-age warnings start after 3 days, elements older than 7 days or over 1 day in the future are excluded, and a dataset-update warning appears after 2 days. Check the element epoch as well as the download timestamp. GitHub schedules are best-effort, so monitor failures and data age; inactive public repositories can have schedules disabled by GitHub.

To update locally:

```sh
npm run sync:orbits
npm run validate:data
```

## Catalogue maintenance

`src/lib/catalog.ts` is a separately reviewed list of compatible services, frequencies, tones, operating restrictions and primary source links. Daily TLE synchronisation does **not** verify RF activity or update frequencies, tones or event schedules. Review operator / AMSAT announcements when editing it. Dated events and blackouts are applied to predictions automatically. Do not add SSB/CW, incompatible digital modulation or microwave-only services to this FM handheld catalogue.

Tests use the fixed November 2026 fixture in `tests/fixtures/`; daily published data changes do not alter historical prediction tests. JAMX01 has a catalogue entry but is hidden until a valid current orbit is available. CelesTrak's TLE feed cannot supply all newer six-digit IDs; additional format support may be needed for future catalogue expansion.

### Satellites for other radios

`src/lib/extras.ts` holds one line per extra service: which AMSAT status entry corresponds to which entry in the SatNOGS database. Nothing else about them is typed in. The daily job reads frequency, mode and passband for those entries from SatNOGS and saves them in `public/data/orbits.json` under `extras`; that part of the file is derived from SatNOGS data and is under CC BY-SA 4.0. An entry SatNOGS marks inactive drops out by itself, and one without current orbital elements is hidden.

To add a satellite, add its line with the SatNOGS transmitter `uuid`. `docs/satellite-links.json` records how the current links were checked (17 November 2026), including the ones held back: three with typed frequencies and unconfirmed catalogue numbers (AO-129, SO-131, PARUS-6U1), six marked unsure, and the music, microwave and geostationary entries left out on purpose.

## GitHub Pages and domain

Enable **Settings → Pages → Source: GitHub Actions**. The workflow publishes `dist/` at `/sat-track/`. Vite's `base` and all data/asset paths use that same prefix. Opening or reloading the app at that URL requires no SPA fallback rewrite.

A later personal-site domain can retain `/sat-track/`; changing the hostname does not require changing the base path. Domain/DNS setup is separate. Use HTTPS for clipboard access. A new origin gets a separate local station preference.

## Data and privacy

Station coordinates and pass calculations stay in the browser. The shared data-file request contains no station coordinates. The Map tab fetches OpenStreetMap tiles for the area viewed, and "Check terrain" fetches terrain files around the station from `tf5nn.github.io/terrain`; neither happens unless the visitor opens the map or presses the button. The device's location is requested only when "Use my location" is pressed; the exact position is kept in the browser, shown as a 6-character grid square, and never sent anywhere. No authentication is used. A light or dark theme chosen with the button in the header is remembered in the browser too (as `tf5nn-theme`, shared by the TF5NN apps on this site); without a choice the page follows the device.

Visits are counted anonymously with [GoatCounter](https://www.goatcounter.com/) (site code `tf5nn`, private dashboard): page opens by country and referring site, plus seven actions (`save-pass`, `event-show-passes`, `download-tle`, the header links `main-site-from-northbound` and `github-from-northbound`, `use-my-location`, which records the press only, never the location, and `look-around`). No cookies are set and nothing about the station is sent. The counter script loads separately from the app, so the planner works the same if it is blocked. Local previews are not counted. To leave your own visits out, open the app once with `#toggle-goatcounter` at the end of the address in each browser you use. The fonts (DM Sans and IBM Plex Mono, SIL Open Font License) are files in `src/fonts/`, bundled with the app, so nothing is fetched from Google.

Orbital and frequency data come from the linked providers and operators; their acknowledgements and applicable terms remain separate from this application's source. Source publication does not imply that all satellite payloads are currently active. Bearings assume a clear horizon; terrain, refraction and obstructions are not modeled.

## License

Creative Commons Attribution 4.0 International (CC BY 4.0), the same licence as the HF Antenna Impedance Visualizer. See [`LICENSE`](LICENSE). Orbital elements, frequency information and AMSAT reception reports belong to their providers and keep their own terms.
