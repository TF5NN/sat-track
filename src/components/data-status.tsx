import { Activity, Info, RefreshCw, Satellite as SatelliteIcon } from 'lucide-react';
import { builtAt } from '../hooks/use-orbit-data';
import { utcDate, utcTime } from '../lib/time';

type Props = {
  tab: string;
  setTab: (tab: string) => void;
  data: { kind: string; error: string };
  fetching: boolean;
  load: () => Promise<void>;
  now: number;
  oldest: number; // age in days of the oldest orbit in use
  publicationAge: number; // days since the dataset was last checked
};
// The view tabs, the data-source indicator with its refresh button, and any data warnings.
export default function DataStatus({
  tab,
  setTab,
  data,
  fetching,
  load,
  now,
  oldest,
  publicationAge,
}: Props) {
  return (
    <>
      <div className="workspace-bar">
        <nav aria-label="Planner views">
          <button className={tab === 'passes' ? 'active' : ''} onClick={() => setTab('passes')}>
            <Activity size={15} />
            Pass planner
          </button>
          <button className={tab === 'guide' ? 'active' : ''} onClick={() => setTab('guide')}>
            <SatelliteIcon size={15} />
            Satellite guide
          </button>
        </nav>
        <div className="data-tools">
          <span className={`data-state ${data.kind !== 'published' ? 'muted' : ''}`}>
            <span className="live-dot" />
            {data.kind === 'published'
              ? 'Daily orbital data'
              : data.kind === 'cached'
                ? 'Cached orbital data'
                : 'Bundled orbital data'}
          </span>
          <button
            className="icon-button"
            disabled={fetching}
            onClick={() => void load()}
            aria-label="Refresh orbital data"
          >
            <RefreshCw size={15} className={fetching ? 'spin' : ''} />
          </button>
        </div>
      </div>
      {now > 0 && builtAt - now > 300000 && (
        <div className="data-warning" role="alert">
          <Info size={15} />
          <span>
            <strong>Your device clock looks wrong.</strong> It is set earlier than this app’s orbital data was
            published ({utcDate(builtAt)} {utcTime(builtAt)} UTC). Pass times will be wrong or missing until
            the date and time are corrected.
          </span>
        </div>
      )}
      {(data.error || oldest > 3 || publicationAge > 2) && (
        <div className="data-warning" role="status">
          <Info size={15} />
          <span>
            {data.error}{' '}
            {publicationAge > 2 ? `The dataset was last checked ${publicationAge.toFixed(1)} days ago. ` : ''}
            {oldest > 3
              ? `Some orbit epochs are ${oldest.toFixed(1)} days old. Elements older than 7 days are excluded.`
              : ''}
          </span>
          <button onClick={() => void load()} disabled={fetching}>
            Retry refresh
          </button>
        </div>
      )}
    </>
  );
}
