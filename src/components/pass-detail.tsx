import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Download,
  Info,
  Satellite as SatelliteIcon,
  Sun,
  X,
} from 'lucide-react';
import { twoline2satrec } from 'satellite.js';
import Badge from './badge';
import { SkyPlot } from './sky-plot';
import { activityFor, activityText, type Activity } from '../lib/activity';
import { createPassCalendar } from '../lib/calendar';
import { band, frequency, sources } from '../lib/catalog';
import { compass, doppler, pointAt, tuningSteps, type Pass, type Station } from '../lib/orbit';
import { offsetLabel, utcDate, utcTime, type Clock } from '../lib/time';
import { countUse } from '../lib/usage';

function ics(pass: Pass, station: Station) {
  const tuning = tuningSteps(
    twoline2satrec(pass.element.line1, pass.element.line2),
    station,
    pass.sat.up,
    pass.sat.down,
    pass.aos.time,
    pass.los.time,
  ).map(
    (s) =>
      `${utcTime(s.time, true)} UTC  RX ${s.rx.toFixed(3)}${s.tx === null ? '' : `  TX ${s.tx.toFixed(3)}`}`,
  );
  const content = createPassCalendar({
    key: pass.key,
    sat: pass.sat,
    start: pass.aos.time,
    end: pass.los.time,
    peakElevation: pass.peak.el,
    riseDirection: compass(pass.aos.az),
    setDirection: compass(pass.los.az),
    tuning,
  });
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' })),
    a = document.createElement('a');
  a.href = url;
  a.download = `${pass.sat.id}-pass.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function PassDetail({
  pass,
  station,
  now,
  activity,
  onClose,
  onOrbit,
  clock,
}: {
  pass: Pass;
  station: Station;
  now: number;
  activity: Activity | null;
  onClose: () => void;
  onOrbit: () => void;
  clock: Clock;
}) {
  const { time, zone } = clock;
  const zoneName = () => clock.name;
  const heard = activityFor(pass.sat, activity, now);
  const [t, setT] = useState(0);
  useEffect(() => setT(0), [pass.key]);
  const rec = useMemo(() => twoline2satrec(pass.element.line1, pass.element.line2), [pass.element]);
  const inPass = now >= pass.aos.time && now < pass.los.time;
  const sample = pass.aos.time + ((pass.los.time - pass.aos.time) * t) / 100;
  const live = pointAt(rec, inPass ? now : sample, station);
  const d = doppler(rec, inPass ? now : sample, station, pass.sat.up, pass.sat.down);
  const points = [pass.aos, pass.peak, pass.los];
  const steps = useMemo(
    () => tuningSteps(rec, station, pass.sat.up, pass.sat.down, pass.aos.time, pass.los.time),
    [rec, station, pass.sat.up, pass.sat.down, pass.aos.time, pass.los.time],
  );
  const at = inPass ? now : sample,
    current = steps.reduce((c, s) => (s.time <= at ? s : c), steps[0]);
  return (
    <aside className="detail" aria-label="Selected pass details">
      <div className="detail-top">
        <span className="eyebrow">PASS BRIEFING</span>
        <button className="icon-button mobile-close" onClick={onClose} aria-label="Close pass details">
          <X size={18} />
        </button>
      </div>
      <div className="detail-title">
        <div>
          <h2>{pass.sat.name}</h2>
          <p>{pass.sat.subtitle}</p>
        </div>
        <Badge access={pass.access} />
      </div>
      <div className="plot-wrap">
        <SkyPlot pass={pass} live={live} />
        <span className="plot-caption">
          {compass(pass.aos.az)} <ArrowRight size={12} /> {compass(pass.los.az)} <span>·</span>{' '}
          {pass.peak.el.toFixed(0)}° peak
        </span>
      </div>
      <div className="timing">
        {points.map((p, i) => (
          <div key={i}>
            <span>{['AOS · RISE', 'MAX · TCA', 'LOS · SET'][i]}</span>
            <strong>{time(p.time, true)}</strong>
            <small>
              {Math.round(p.az)}° {compass(p.az)}
              {i === 1 ? ` · ${pass.peak.el.toFixed(1)}° el` : ''}
            </small>
          </div>
        ))}
      </div>
      {!zone && (
        <p className="fine utc-beside">
          Local time ({offsetLabel(pass.aos.time)}). In UTC: {utcTime(pass.aos.time, true)}–
          {utcTime(pass.los.time, true)}.
        </p>
      )}
      <div className="detail-section">
        <div className="section-label">
          RADIO SETUP <span>{pass.sat.mode}</span>
        </div>
        <div className="frequency-row">
          <div>
            <span>
              <ArrowDown size={12} /> Downlink · RX · {band(pass.sat.down)}
            </span>
            <strong>
              {frequency(pass.sat.down)} <small>MHz</small>
            </strong>
          </div>
          <div>
            <span>
              <ArrowUp size={12} /> Uplink · TX · {band(pass.sat.up) === 'none' ? '—' : band(pass.sat.up)}
            </span>
            <strong>
              {frequency(pass.sat.up)} {pass.sat.up && <small>MHz</small>}
            </strong>
          </div>
        </div>
        <p className="tone">
          TX tone <strong>{pass.sat.tone}</strong> <span>· RX tone off</span>
        </p>
      </div>
      <div className="detail-section">
        <div className="section-label">
          DOPPLER TUNING <span>{inPass ? 'LIVE' : time(sample, true) + ' ' + zoneName()}</span>
        </div>
        {!inPass && (
          <label className="scrubber">
            <span>Rise</span>
            <input
              type="range"
              aria-label="Preview Doppler across pass"
              min="0"
              max="100"
              value={t}
              onChange={(e) => setT(Number(e.target.value))}
            />
            <span>Set</span>
          </label>
        )}
        <div className="tuned">
          <div>
            <span>Receive</span>
            <strong>{current.rx.toFixed(3)}</strong>
          </div>
          <div>
            <span>{pass.sat.up ? 'Transmit' : 'No uplink'}</span>
            <strong>{current.tx?.toFixed(3) ?? '—'}</strong>
          </div>
        </div>
        <p className="fine">
          Radio setting in MHz. Exact: RX {d.rx.toFixed(5)}
          {d.tx !== null ? ` / TX ${d.tx.toFixed(5)}` : ''}.{' '}
          {live && `${Math.round(live.az)}° ${compass(live.az)} / ${live.el.toFixed(1)}° el.`}
        </p>
        <table className="doppler-table">
          <thead>
            <tr>
              <th>From ({zoneName()})</th>
              <th>RX MHz</th>
              <th>TX MHz</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => (
              <tr key={s.time} className={s === current ? 'current' : ''}>
                <td>{time(s.time, true)}</td>
                <td>{s.rx.toFixed(3)}</td>
                <td>{s.tx?.toFixed(3) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fine">
          {steps.length === 1
            ? 'No retuning needed on this pass: the Doppler drift stays within 3.5 kHz.'
            : `${steps.length} settings for this pass.`}{' '}
          The radio is retuned in 5 kHz steps only when the drift passes 3.5 kHz, so lower passes need fewer
          changes and 2 m rarely needs any. HT app Doppler control is available with compatible firmware.
        </p>
      </div>
      {heard?.notHeard && (
        <div className="not-heard" role="note">
          <Info size={15} />
          <p>
            <strong>Not heard recently.</strong> None of the {heard.total} AMSAT report
            {heard.total === 1 ? '' : 's'} in the last {heard.days} days heard this service. Listen before you
            plan around it.
          </p>
        </div>
      )}
      <div className="operating-note">
        <Info size={15} />
        <div>
          <strong>{pass.sat.condition}</strong>
          <p>{pass.sat.notes}</p>
          {heard && <p className="activity">{activityText(heard)}</p>}
          {pass.sat.daylight && (
            <p className="sun-window">
              <Sun size={13} />{' '}
              {`TX in sunlight only: ${pass.windows.map((w) => time(w[0], true) + '–' + time(w[1], true)).join(', ')} ${zoneName()}`}
            </p>
          )}
          {pass.sat.event && (
            <p>
              Scheduled opportunity:{' '}
              {pass.windows.map((w) => time(w[0], true) + '–' + time(w[1], true)).join(', ')} {zoneName()}.
            </p>
          )}
          <a href={pass.sat.source} target="_blank" rel="noreferrer">
            Operator / frequency source <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
      <div className="orbit-entry">
        <button className="button" onClick={onOrbit}>
          <SatelliteIcon size={14} /> HT app orbital data
        </button>
        <span>Same daily orbital data as the predictions</span>
      </div>
      <div className="detail-actions">
        <button
          className="button"
          onClick={() => {
            countUse('save-pass');
            ics(pass, station);
          }}
        >
          <Download size={14} /> Save pass
        </button>
        <a className="text-link" href={sources.status} target="_blank" rel="noreferrer">
          Check live reports <ArrowUpRight size={13} />
        </a>
      </div>
      <p className="fine element-age">
        Orbit epoch {utcDate(pass.element.epoch)} {utcTime(pass.element.epoch)} UTC ·{' '}
        {Math.max(0, (now - pass.element.epoch) / 86400000).toFixed(1)} days old
      </p>
    </aside>
  );
}
