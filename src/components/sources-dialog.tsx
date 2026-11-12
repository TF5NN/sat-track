import type { RefObject } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { htManual } from './orbit-dialog';
import { catalog, frequency, reviewed, sources } from '../lib/catalog';
import { dateYear, span, utcDate, utcTime } from '../lib/time';

type Props = {
  data: { kind: string; provider: string; fetchedAt: string };
  now: number;
  result: { unavailable: number[] };
  modalRef: RefObject<HTMLElement | null>;
  setSourceOpen: (open: boolean) => void;
};
export default function SourcesDialog({ data, now, result, modalRef, setSourceOpen }: Props) {
  return (
    <div className="modal-backdrop" onClick={() => setSourceOpen(false)}>
      <section
        ref={modalRef}
        className="modal source-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sources-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close icon-button"
          aria-label="Close sources"
          onClick={() => setSourceOpen(false)}
        >
          <X size={18} />
        </button>
        <h2 id="sources-title">Sources & prediction notes</h2>
        <p>
          Frequencies and operating restrictions reviewed {dateYear(Date.parse(reviewed))}. Activation labels
          are a dated review, not live reception reports.
        </p>
        <ul className="sources-list">
          {[
            ['AMSAT orbital elements', sources.tle],
            ['SatNOGS supplementary orbital elements', sources.satnogs],
            ['APRS satellite frequencies', sources.packet],
            ['FM frequencies & restrictions', sources.fm],
            ['AMSAT operator reception reports (CC BY 4.0)', sources.status],
            ['ARISS station status', sources.iss],
            ['Dated ISS SSTV event announcements', sources.sstv],
            ['SSTV satellite frequencies', sources.images],
            ['SONATE-2 operator / schedule', sources.sonate],
            ['HT manual · satellite orbital entry', htManual],
            ['VGC radio / HT app guide', sources.radio],
            ['VGC APRS / satellite path setup', sources.radioAprs],
          ].map(([label, url]) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer">
                {label}
                <ArrowUpRight size={13} />
              </a>
            </li>
          ))}
        </ul>
        <h3>Orbital data</h3>
        <p>
          {data.kind === 'published'
            ? 'Published ' + data.provider + ' dataset'
            : data.kind === 'cached'
              ? 'Last successful browser cache'
              : 'Bundled orbital dataset'}
          {data.fetchedAt
            ? ` · retrieved ${utcDate(Date.parse(data.fetchedAt))} ${utcTime(Date.parse(data.fetchedAt))} UTC`
            : ''}
          . Orbital elements are downloaded and validated centrally once a day at 03:17 UTC, using AMSAT and
          SatNOGS, with CelesTrak as a fallback. This app checks the shared published file on opening, hourly
          and when returning after an hour away. Refresh checks that file; it does not contact the
          satellite-data providers. The orbital-data panel uses the same elements as the predictions. If an
          update fails, the last good dataset is retained. Frequencies, tones and operating schedules are a
          separate reviewed catalogue, not live reception reports. Missing or invalid TLEs and elements older
          than 7 days are excluded; an element-age notice starts at 3 days, and a dataset-update notice after
          2 days.
        </p>
        {result.unavailable.length > 0 && <p>Unavailable NORAD IDs: {result.unavailable.join(', ')}.</p>}
        <h3>Reception reports</h3>
        <p>
          The small report line on each service counts operator reports sent to AMSAT’s status page
          (status.amsat.org, licensed CC BY 4.0) over the last 7 days and the share that heard the service. It
          is collected once a day with the orbital data. A “not heard recently” warning means at least three
          reports exist and none heard it. Reports are voluntary and worldwide: no reports does not mean a
          satellite is off, and a good figure does not promise it is on during your pass.
        </p>
        <h3>Which satellites appear</h3>
        <p>
          The worldwide catalogue contains FM voice, 1200-baud AFSK packet and FM SSTV services suitable for a
          2 m / 70 cm FM radio. The guide and satellite choices use the same calculated passes as the planner:
          at least one remaining modeled operating window in the selected 24, 48 or 72 hours, at your minimum
          peak elevation. Missing or stale orbits, unreachable spacecraft, expired events and known service
          blackouts do not appear as choices. Other filters narrow that list further. Unknown activation
          schedules remain explicitly conditional; this is not a live receiver or an exhaustive satellite
          database.
        </p>
        <h3>What the times mean</h3>
        <p>
          SGP4 propagation with satellite.js, WGS-84 observer coordinates. AOS and LOS cross an unobstructed
          0° horizon; the elevation filter selects peak elevation, not a different rise/set threshold.
          Bearings are true north. Terrain, refraction and obstructions are not modeled. Times are
          predictions, displayed to seconds for tuning; use fresh elements and arrive early.
        </p>
        <p>
          AO-91 sunlight windows exclude the modeled Earth shadow with a conservative penumbra margin;
          transitions resolve to 5 seconds. Transmitter schedules are only applied where a dated window is
          known. Unscheduled SSTV passes do not promise images.
        </p>
        {catalog
          .filter((s) => s.event && Date.parse(s.event.end) > now)
          .map((s) => (
            <p key={s.id}>
              {s.name} {s.mode} ({s.subtitle}): {span(s.event!)} on {frequency(s.down)} MHz. This dated
              announcement takes precedence over general tables; check the operator for later changes.
            </p>
          ))}
        {catalog
          .filter((s) => s.blackout && Date.parse(s.blackout.end) > now)
          .map((s) => (
            <p key={s.id}>
              {s.name} {s.mode} is not offered {span(s.blackout!)}.
            </p>
          ))}
        <p>
          Maidenhead entry accepts 4, 6 or 8 characters and uses the grid-cell centre. No GPS permission or
          automatic radio control. Each opening asks you to confirm your remembered station, or the Reykjavík
          default. Station coordinates stay in this browser; requests for the shared data file do not include
          them. No account or backend is required.
        </p>
        <p>
          Visits are counted anonymously with GoatCounter, to see whether the planner is used: page opens by
          country and referring site, plus how often a pass is saved, an event banner is followed or orbital
          data is downloaded. No cookies, no personal profile, and nothing about your station or location is
          sent.
        </p>
        <button className="button" onClick={() => setSourceOpen(false)}>
          Back to planner
        </button>
      </section>
    </div>
  );
}
