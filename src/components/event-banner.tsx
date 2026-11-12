import { CalendarClock } from 'lucide-react';
import { activityFor, type Activity } from '../lib/activity';
import type { Satellite } from '../lib/catalog';
import { utcDate, utcTime } from '../lib/time';

type Props = {
  events: { sat: Satellite; count: number }[];
  hours: number;
  now: number;
  activity: Activity | null;
  onShow: (sat: Satellite) => void;
};
// Announces dated events that the current capability filter hides, one line per event.
export default function EventBanner({ events, hours, now, activity, onShow }: Props) {
  return (
    <>
      {events.map(({ sat, count }) => {
        const start = Date.parse(sat.event!.start),
          end = Date.parse(sat.event!.end),
          heard = activityFor(sat, activity, now);
        return (
          <div className="event-banner" role="status" key={sat.id}>
            <CalendarClock size={15} />
            <span>
              <strong>
                {sat.name} {sat.mode} event{' '}
                {now >= start ? 'on now' : `starts ${utcDate(start)} ${utcTime(start)} UTC`}
              </strong>{' '}
              · until {utcDate(end)} {utcTime(end)} UTC · {count} pass{count === 1 ? '' : 'es'} from your
              station in the next {hours} hours
              {heard && heard.total > 0
                ? ` · ${heard.percent}% of ${heard.total} AMSAT reports heard it`
                : ''}
              . Receive only.
            </span>
            <button onClick={() => onShow(sat)}>Show passes</button>
          </div>
        );
      })}
    </>
  );
}
