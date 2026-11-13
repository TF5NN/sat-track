import { ArrowRight, ArrowUpRight, Headphones, Radio, Satellite as SatelliteIcon } from 'lucide-react';
import { activityFor, activityText, type Activity } from '../lib/activity';
import { frequency, type Satellite } from '../lib/catalog';
import { defaultFilters as defaults, type Filters } from '../lib/orbit';

type Props = {
  filteredCatalog: Satellite[];
  filters: Filters;
  hours: number;
  now: number;
  activity: Activity | null;
  setFilters: (filters: Filters) => void;
  setOrbitSatId: (id: string) => void;
  setTab: (tab: string) => void;
};
export default function Guide({
  filteredCatalog,
  filters,
  hours,
  now,
  activity,
  setFilters,
  setOrbitSatId,
  setTab,
}: Props) {
  return (
    <section className="guide" aria-label="Satellite guide">
      <div className="list-heading">
        <div>
          <h2>Your station’s satellite guide</h2>
          <p>
            Reachable from your station in the next {hours} hours · {filters.elevation}°+ peak. Verify
            activation before transmitting.
          </p>
        </div>
        <span className="guide-count">{filteredCatalog.length} services</span>
      </div>
      {(['work', 'listen'] as const).map((access) => (
        <div className="guide-group" key={access}>
          <h3>
            {access === 'work' ? <Radio size={16} /> : <Headphones size={16} />}{' '}
            {access === 'work' ? 'Satellites you can work' : 'Satellites worth listening to'}
          </h3>
          {filteredCatalog
            .filter((s) => s.access === access)
            .map((s) => (
              <article className="guide-card" key={s.id}>
                <div className="guide-card-top">
                  <div>
                    <h4>
                      {s.name} <span>{s.mode}</span>
                    </h4>
                    <p>
                      {s.subtitle} · NORAD {s.norad}
                    </p>
                  </div>
                  <div className="guide-card-actions">
                    <button
                      onClick={() => setOrbitSatId(s.id)}
                      aria-label={`Orbital data for ${s.name} ${s.mode}`}
                    >
                      Orbit data <SatelliteIcon size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setFilters({
                          ...defaults,
                          status: 'all',
                          elevation: filters.elevation,
                          satellite: s.id,
                        });
                        setTab('passes');
                      }}
                    >
                      View passes <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
                <div className="guide-frequencies">
                  <span>
                    RX <strong>{frequency(s.down)}</strong>
                  </span>
                  <span>
                    TX <strong>{frequency(s.up)}</strong>
                  </span>
                  <span>
                    Tone <strong>{s.tone}</strong>
                  </span>
                </div>
                <p>
                  <strong>{s.condition}.</strong> {s.notes}
                </p>
                {((a) =>
                  a && (
                    <p className={`activity ${a.warning ? 'warn' : ''}`}>
                      {a.warning ? `${a.warning} · ` : ''}
                      {activityText(a)}
                    </p>
                  ))(activityFor(s, activity, now))}
                <a href={s.source} target="_blank" rel="noreferrer">
                  Source <ArrowUpRight size={11} />
                </a>
              </article>
            ))}
          {!filteredCatalog.some((s) => s.access === access) && (
            <p className="fine">No services in this category match the filters.</p>
          )}
        </div>
      ))}
      <div className="excluded">
        <h3>Receive and operate with your FM radio</h3>
        <p>
          APRS entries require a compatible satellite profile and path. SSTV needs a phone or computer audio
          decoder to turn the signal into a picture. Only services with a predicted usable window from this
          station appear here, subject to your filters. A clear geometric path does not confirm transmitter
          activation or account for local terrain.
        </p>
      </div>
    </section>
  );
}
