import { Clock3, Satellite as SatelliteIcon } from 'lucide-react';
import type { Pass } from '../lib/orbit';
import { clockTime, offsetLabel, until, utcTime, type Clock } from '../lib/time';

type Props = {
  passes: Pass[];
  next: Pass | undefined;
  high: number; // passes peaking above 30°
  hours: number;
  now: number;
  clock: Clock;
  toggleZone: () => void;
};
export default function SummaryStrip({ passes, next, high, hours, now, clock, toggleZone }: Props) {
  const { time } = clock;
  const utc = clock.zone === 'UTC';
  const zoneName = () => clock.name;
  return (
    <div className="summary-strip">
      <div className="summary-first">
        <span className="summary-icon">
          <SatelliteIcon size={20} />
        </span>
        <div>
          <span className="eyebrow">NEXT MATCHING PASS</span>
          <strong>
            {next ? (
              <>
                {next.sat.name}{' '}
                <span className="summary-time">
                  {time(next.aos.time)} {zoneName()}
                </span>
              </>
            ) : (
              'Scanning the horizon'
            )}
          </strong>
          <small>
            {next
              ? `${until(next.aos.time, now)} · ${next.peak.el.toFixed(0)}° peak · ${next.sat.mode}`
              : 'Select filters and refresh orbital data'}
          </small>
        </div>
      </div>
      <div className="summary-stat">
        <strong>
          {passes.length}
          <span>passes</span>
        </strong>
        <small>Next {hours} hours · your filters</small>
      </div>
      <div className="summary-stat">
        <strong>
          {high}
          <span>above 30°</span>
        </strong>
        <small>More sky, less obstruction</small>
      </div>
      <div className="summary-clock">
        <Clock3 size={15} />
        <div>
          <strong>
            {now ? time(now, true) : '--:--:--'} <span>{utc ? 'UTC' : 'local'}</span>
          </strong>
          <small>
            {now
              ? utc
                ? `Local ${clockTime(now, false, undefined)}`
                : `${offsetLabel(now)} · UTC ${utcTime(now)}`
              : ''}{' '}
            ·{' '}
            <button className="zone-toggle" onClick={toggleZone} aria-pressed={utc}>
              {utc ? 'Show local times' : 'Show UTC times'}
            </button>
          </small>
        </div>
      </div>
    </div>
  );
}
