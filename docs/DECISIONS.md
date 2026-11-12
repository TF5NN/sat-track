# Decision log

A record of the review of November 2026: what was suggested, what the owner (TF5NN) decided, and what
was done. Read this before changing defaults or "fixing" something that looks odd; several things here
are deliberate choices.

## Purpose of the app

A simple, easy-to-understand planner that helps new hams get into satellite work with a VGC VR-N76 and a
2 m / 70 cm Yagi. It must not present a massive list of satellites that are in disrepair or unreachable
from the operator's location. Working with other radios is a bonus, not the objective.

## Bugs found and fixed

| Bug | Fix |
|---|---|
| One lost "core" satellite stopped the daily data update for all satellites | Update is blocked only when no core satellite has valid orbit data; a single lost one is logged and hidden |
| "LIVE" clock, Doppler and sky position updated every 15 s | They update every second |
| A code push could fail to deploy because saved orbit data was over 7 days old | Age is a warning; only broken or unlisted data fails the build |
| A device clock set behind the data gave a blank page | The app loads and shows a "device clock looks wrong" banner |
| Typed coordinates were discarded when switching to the grid tab | Coordinates carry over to the grid |
| Downloaded orbit files were named e.g. "OBJECT AY" | They use the catalogue name (AO-123) |
| Footer year and ISS event text were typed into the page | They are built from the catalogue's dates |
| All passes were recalculated every minute (brief freeze on phones) | Recalculated every 10 minutes; a reduction, not a cure |
| Orbit files without name lines were given a data line as the name | Fixed |
| Unused imports and messages that could never appear | Removed; the compiler now flags unused code |

## Suggestions and decisions

| Suggestion | Decision | Outcome |
|---|---|---|
| Shorten the default list (it opened on 121 passes, 91 receive-only) | First set to FM voice at 15°, then judged too strict | Defaults are **Work, all modes, 5°**. The list must not look as if too few passes occur |
| Show satellites you can only listen to | Keep them, but out of the default view | Under All / Listen. A future "advanced" tab could hold every satellite, always hidden by default |
| Show local time with UTC beside it | Accepted | Device-local time by default, UTC alongside, remembered UTC switch |
| Ask for location only once; add "use my location" | Rejected, keep as is | Dialog on every visit, Reykjavík default, no GPS |
| Warn when the hand-written catalogue review is over 30 days old | Not until AMSAT data was checked | Not added. AMSAT reports now cover this need |
| Pull AMSAT's reception reports once a day | Accepted after scoping | One request a day, 7-day window, shown per satellite, AMSAT credited (CC BY 4.0) |
| Time window for AMSAT reports | 7 days | 1–3 days is too thin for quiet satellites; 14–30 days hides recent failures |
| When to show "Not heard recently" | At least 3 reports and none heard | No reports at all is shown quietly, not as a warning |
| AO-91 (0 of 7 heard) | Move under uncertain repeaters | Hidden by default |
| A running ISS SSTV event was invisible in the default Work view | Announce it in a banner, on the guide tab too | Banner per dated event that is reachable but hidden by the filter; "Show passes" switches to it. Event dates are still entered by hand in the catalogue |
| Count visitors, to know whether publishing is worth it | GoatCounter, site code `tf5nn`, private dashboard, no visible counter | Page opens are counted, since reading the page is already using it, plus pass saves, banner clicks and orbit downloads. Flag Counter was considered and not used |
| Larger text and more contrast | Rejected, readable as is | Unchanged |
| Replace jargon (AOS, TCA, CTCSS, TLE) with plain words | Rejected | Unchanged |
| Show Doppler as radio steps instead of 5 decimals | Accepted, and it should show only as many steps as the pass needs | 5 kHz steps, retuned only when drift passes 3.5 kHz; also written into the calendar export |
| Simplify the pass panel | Rejected, clear enough | Unchanged |
| Make the wording radio-neutral | Rejected, the app is made for the VR-N76 | Unchanged |
| Offline / installable app | Rejected, out of scope | "Save pass" already exports what is needed to a calendar |
| Reformat and split `src/App.tsx` | Accepted | Split into components, hooks and time helpers; page proven identical |
| Format the calculation, script and test files; update build tools; add a licence | Accepted | All source is under the format check, the built bundle was byte-identical after formatting, `npm audit` reports no issues, licence is CC BY 4.0 as for the antenna tool |
| Reformat `src/style.css` | Accepted | Reformatted only, rules not reordered; page proven pixel-identical |

## Settings worth knowing

| Setting | Value | Where |
|---|---|---|
| Default filters | Work, all modes, 5° | `defaultFilters` in `src/lib/orbit.ts` |
| AMSAT report window | 7 days (168 hours) | `ACTIVITY_HOURS` in `src/lib/activity.ts` |
| Reports needed for a "not heard" warning | 3 | `NOT_HEARD_MIN_REPORTS` in `src/lib/activity.ts` |
| AMSAT numbers hidden when older than | 3 days | `activityFor` in `src/lib/activity.ts` |
| Doppler step and tolerance | 5 kHz, 3.5 kHz | `tuningSteps` in `src/lib/orbit.ts` |
| Pass recalculation | every 10 minutes | `src/App.tsx` |
| Uncertain repeaters | hidden by default | `uncertain` in `src/lib/catalog.ts` |

## Open items

- The guide's "worth listening to" section is empty until All or Listen is chosen. No decision yet.
- The brief freeze on phones still happens every 10 minutes. Removing it means moving the pass
  calculation to a background worker.
- ISS APRS (437.825 MHz) and ISS SSTV (437.550 MHz) were not verified against the operator's pages.
  AMSAT reports are consistent with both being active.
- The interface snapshot (`npm run test:ui`) is run by hand, not on GitHub.
- A failed format check stops a publish until `npm run format` is run.
- Idea for later: an "advanced" tab listing every satellite that can be heard or worked.
