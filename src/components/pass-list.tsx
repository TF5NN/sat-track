import { ChevronRight, Info, Satellite as SatelliteIcon } from 'lucide-react';
import Badge from './badge';
import { Arc } from './sky-plot';
import { activityFor, activityText, type Activity } from '../lib/activity';
import { band } from '../lib/catalog';
import { compass, type Filters, type Pass } from '../lib/orbit';
import { offsetLabel, type Clock } from '../lib/time';

type Props = {
  passes: Pass[];
  picked: Pass | undefined;
  result: { unavailable: number[] };
  filters: Filters;
  activeFilters: Filters;
  hours: number;
  now: number;
  start: number;
  activity: Activity | null;
  countWork: number;
  countListen: number;
  visibleCount: number;
  clock: Clock;
  reset: () => void;
  setSelected: (key: string) => void;
  setMobileDetail: (open: boolean) => void;
  setSourceOpen: (open: boolean) => void;
  setVisibleCount: (update: (count: number) => number) => void;
};
export default function PassList({
  passes,
  picked,
  result,
  filters,
  activeFilters,
  hours,
  now,
  start,
  activity,
  countWork,
  countListen,
  visibleCount,
  clock,
  reset,
  setSelected,
  setMobileDetail,
  setSourceOpen,
  setVisibleCount,
}: Props) {
  const { time, date, zone } = clock;
  const utc = zone === 'UTC';
  const zoneName = () => clock.name;
  return (
    <section className="pass-list" aria-label="Upcoming passes">
      <div className="list-heading">
        <div>
          <h2>
            Upcoming passes <span>{passes.length}</span>
          </h2>
          <p>
            {now ? `${date(now)}–${date(start + hours * 3600000)}` : 'Calculating…'} <span>·</span>{' '}
            {utc ? 'All times UTC' : `All times local (${offsetLabel(now)})`}
          </p>
        </div>
        <span className="list-legend">
          <i /> {countWork} work <i className="rx" /> {countListen} listen
        </span>
      </div>
      <div className="list-hint">
        <Info size={13} />
        <span>
          Only reachable services in your next {hours} hours at {filters.elevation}°+ peak. Activation is not
          guaranteed.
          {activeFilters.status === 'work'
            ? ' Showing satellites you can work; choose All or Listen for receive-only services.'
            : ''}
        </span>
      </div>
      {passes.length === 0 ? (
        <div className="empty">
          <SatelliteIcon size={30} />
          <h3>No passes match these filters</h3>
          <p>
            Try a lower elevation, a longer look ahead or another location. Check the station coordinates if
            the sky seems unexpectedly quiet.
          </p>
          <button className="button" onClick={reset}>
            Reset filters
          </button>
        </div>
      ) : (
        <div>
          {passes.slice(0, visibleCount).map((p, i) => (
            <div key={p.key}>
              {(i === 0 || date(p.aos.time) !== date(passes[i - 1].aos.time)) && (
                <div className="day-heading">
                  {date(p.aos.time)}{' '}
                  <span>
                    {new Date(p.aos.time).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      timeZone: zone,
                    })}
                  </span>
                </div>
              )}
              <button
                className={`pass-row ${picked?.key === p.key ? 'chosen' : ''}`}
                onClick={() => {
                  setSelected(p.key);
                  setMobileDetail(true);
                }}
                aria-pressed={picked?.key === p.key}
                aria-label={`View ${p.sat.name} ${p.sat.mode} pass at ${time(p.aos.time)} ${zoneName()}, peak ${p.peak.el.toFixed(0)} degrees`}
              >
                <div className="pass-time">
                  <strong>{time(p.aos.time)}</strong>
                  <span>{time(p.los.time)}</span>
                </div>
                <div className="pass-name">
                  <div>
                    <h3>{p.sat.name}</h3>
                    <Badge access={p.access} small />
                  </div>
                  <p>
                    {p.sat.mode} <span>·</span> {band(p.sat.up) === 'none' ? 'RX' : band(p.sat.up) + ' →'}{' '}
                    {band(p.sat.down)}
                  </p>
                  <small>
                    {p.sat.daylight
                      ? 'Sunlit window available'
                      : p.sat.event
                        ? 'Scheduled SSTV event'
                        : p.sat.condition}
                  </small>
                  {((a) =>
                    a && (
                      <small className={`activity ${a.notHeard ? 'warn' : ''}`}>
                        {a.notHeard ? '⚠ Not heard recently · ' : ''}
                        {activityText(a)}
                      </small>
                    ))(activityFor(p.sat, activity, now))}
                </div>
                <div className="pass-geometry">
                  <Arc pass={p} />
                  <strong>{p.peak.el.toFixed(0)}°</strong>
                  <span>
                    {compass(p.aos.az)} → {compass(p.los.az)}
                  </span>
                </div>
                <ChevronRight size={16} className="row-chevron" />
              </button>
            </div>
          ))}
        </div>
      )}
      {passes.length > visibleCount && (
        <button className="show-more" onClick={() => setVisibleCount((n) => n + 12)}>
          Show next {Math.min(12, passes.length - visibleCount)} passes{' '}
          <span>{passes.length - visibleCount} more in this window</span>
          <ChevronRight size={14} />
        </button>
      )}
      <div className="list-foot">
        <span>
          <span className="filled-dot" /> Rise
        </span>
        <span>
          <span className="hollow-dot" /> Set
        </span>
        <p>True bearings · clear 0° horizon · no terrain mask</p>
      </div>
      {result.unavailable.length > 0 && (
        <p className="fine missing">
          {result.unavailable.length} spacecraft excluded: missing, invalid, future-dated or older-than-7-day
          elements. <button onClick={() => setSourceOpen(true)}>Data details</button>
        </p>
      )}
    </section>
  );
}
