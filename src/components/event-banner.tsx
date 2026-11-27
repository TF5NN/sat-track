import { CalendarClock, Radio } from 'lucide-react';
import { activityFor, crewHeard, type Activity } from '../lib/activity';
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

// The ISS crew are not on a schedule: this says that someone heard them in the last week,
// with the frequencies to listen and answer on. Shown only when AMSAT reports exist.
export function CrewBanner({
  activity,
  now,
  count,
  hours,
  onShow,
}: {
  activity: Activity | null;
  now: number;
  count: number;
  hours: number;
  onShow: () => void;
}) {
  const crew = crewHeard(activity, now);
  if (!crew) return null;
  return (
    <div className="event-banner" role="status">
      <Radio size={15} />
      <span>
        <strong>ISS crew on the air</strong> · heard in {crew.heard} AMSAT report
        {crew.heard === 1 ? '' : 's'} in the last {crew.days} days. Calls come at random times: listen on
        145.800 MHz during ISS passes and answer on 145.200 MHz (Europe, Africa) or 144.490 MHz (Americas,
        Asia-Pacific). {count} ISS pass{count === 1 ? '' : 'es'} from your station in the next {hours} hours.
      </span>
      {count > 0 && <button onClick={onShow}>Show passes</button>}
    </div>
  );
}
