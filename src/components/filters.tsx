import { ArrowUpRight, Radio, SlidersHorizontal } from 'lucide-react';
import { band, sources, type Satellite } from '../lib/catalog';
import type { Filters } from '../lib/orbit';

type Props = {
  filters: Filters;
  activeFilters: Filters; // filters with a no-longer-available satellite choice cleared
  availableCatalog: Satellite[];
  options: Satellite[];
  hours: number;
  showUncertain: boolean;
  update: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  reset: () => void;
  setHours: (hours: number) => void;
  setShowUncertain: (show: boolean) => void;
};
export default function FiltersPanel({
  filters,
  activeFilters,
  availableCatalog,
  options,
  hours,
  showUncertain,
  update,
  reset,
  setHours,
  setShowUncertain,
}: Props) {
  return (
    <aside className="filters" aria-label="Pass filters">
      <div className="filter-heading">
        <h2>
          <SlidersHorizontal size={15} /> Filter passes
        </h2>
        <button onClick={reset}>Reset</button>
      </div>
      <fieldset className="status-filter">
        <legend>STATION CAPABILITY</legend>
        <div className="status-buttons">
          {[
            ['all', 'All'],
            ['work', 'Work'],
            ['listen', 'Listen'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filters.status === value ? 'selected' : ''}
              onClick={() => update('status', value)}
              aria-pressed={filters.status === value}
            >
              {label}
            </button>
          ))}
        </div>
        <p>Work = compatible with this station. Activation is checked separately.</p>
      </fieldset>
      <label className="field">
        SATELLITE
        <select
          aria-label="Satellite"
          value={activeFilters.satellite}
          onChange={(e) => update('satellite', e.target.value)}
        >
          <option value="all">All reachable satellites</option>
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.mode}
              {s.id === 'rs95-sstv' ? ' images' : ''}
            </option>
          ))}
        </select>
      </label>
      <div className="band-fields">
        <label className="field">
          UPLINK
          <select
            aria-label="Uplink band"
            value={filters.uplink}
            onChange={(e) => update('uplink', e.target.value)}
          >
            <option value="all">Any band</option>
            {['2m', '70cm', 'none']
              .filter((b) => availableCatalog.some((s) => band(s.up) === b))
              .map((b) => (
                <option key={b} value={b}>
                  {b === 'none' ? 'No uplink' : b === '2m' ? '2 m' : '70 cm'}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          DOWNLINK
          <select
            aria-label="Downlink band"
            value={filters.downlink}
            onChange={(e) => update('downlink', e.target.value)}
          >
            <option value="all">Any band</option>
            {['2m', '70cm']
              .filter((b) => availableCatalog.some((s) => band(s.down) === b))
              .map((b) => (
                <option key={b} value={b}>
                  {b === '2m' ? '2 m' : '70 cm'}
                </option>
              ))}
          </select>
        </label>
      </div>
      <label className="field">
        MODE
        <select aria-label="Mode" value={filters.mode} onChange={(e) => update('mode', e.target.value)}>
          <option value="all">All modes</option>
          {['FM voice', 'APRS', 'SSTV']
            .filter((m) => availableCatalog.some((s) => s.mode === m))
            .map((m) => (
              <option key={m}>{m}</option>
            ))}
        </select>
      </label>
      <label className="field elevation-label">
        MINIMUM PEAK <strong>{filters.elevation}°</strong>
        <input
          type="range"
          min="0"
          max="90"
          step="5"
          value={filters.elevation}
          aria-label="Minimum peak elevation"
          onChange={(e) => update('elevation', Number(e.target.value))}
        />
        <span className="range-labels">
          <span>0°</span>
          <span>45°</span>
          <span>90°</span>
        </span>
      </label>
      <label className="field">
        LOOK AHEAD
        <select aria-label="Look ahead" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
          <option value="24">Next 24 hours</option>
          <option value="48">Next 48 hours</option>
          <option value="72">Next 72 hours</option>
        </select>
      </label>
      <label className="check-field">
        <input type="checkbox" checked={showUncertain} onChange={(e) => setShowUncertain(e.target.checked)} />
        <span>
          Include uncertain repeaters<small>Only those reachable from your station</small>
        </span>
      </label>
      <div className="station-note">
        <Radio size={17} />
        <h3>One radio. Half duplex.</h3>
        <p>
          Listen before calling. You can’t hear your own downlink while transmitting. Keep calls short and
          rotate the Yagi for the clearest signal.
        </p>
        <a href={sources.radio} target="_blank" rel="noreferrer">
          VR-N76 operating guide <ArrowUpRight size={12} />
        </a>
      </div>
    </aside>
  );
}
