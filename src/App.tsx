import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Satellite as SatelliteIcon } from 'lucide-react';
import DataStatus from './components/data-status';
import EventBanner from './components/event-banner';
import FiltersPanel from './components/filters';
import Guide from './components/guide';
import Intro from './components/intro';
import OrbitDialog from './components/orbit-dialog';
import PageHeader from './components/page-header';
import PassDetail from './components/pass-detail';
import PassList from './components/pass-list';
import SourcesDialog from './components/sources-dialog';
import StationDialog from './components/station-dialog';
import SummaryStrip from './components/summary-strip';
import { useModalFocus } from './hooks/use-modal-focus';
import { useOrbitData } from './hooks/use-orbit-data';
import { catalog, band, reviewed, uncertain } from './lib/catalog';
import {
  defaultFilters as defaults,
  defaultStation,
  filterPasses,
  predict,
  type Filters,
  type Station,
} from './lib/orbit';
import { dateYear, makeClock } from './lib/time';
import { reachableCatalog, localizePasses, hiddenEvents } from './lib/visibility';

export default function Home() {
  const modalRef = useRef<HTMLElement>(null);
  const { elements, activity, data, fetching, load } = useOrbitData();
  const [stationConfirmed, setStationConfirmed] = useState(false);
  const [station, setStation] = useState<Station>(defaultStation),
    [editing, setEditing] = useState(false),
    [orbitSatId, setOrbitSatId] = useState<string | null>(null);
  const [utc, setUtc] = useState(() => {
    try {
      return localStorage.getItem('northbound-utc') === '1';
    } catch {
      return false;
    }
  });
  const [now, setNow] = useState(0),
    [start, setStart] = useState(0),
    [hours, setHours] = useState(24),
    [filters, setFilters] = useState<Filters>(defaults),
    [showUncertain, setShowUncertain] = useState(false),
    [tab, setTab] = useState('passes'),
    [selected, setSelected] = useState(''),
    [mobileDetail, setMobileDetail] = useState(false),
    [sourceOpen, setSourceOpen] = useState(false),
    [visibleCount, setVisibleCount] = useState(12);
  function update<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
  }
  useEffect(() => {
    const t = Date.now();
    setNow(t);
    setStart(Math.floor(t / 600000) * 600000);
    try {
      const s = JSON.parse(localStorage.getItem('northbound-station') || 'null');
      if (
        s &&
        Number.isFinite(s.lat) &&
        s.lat >= -90 &&
        s.lat <= 90 &&
        Number.isFinite(s.lon) &&
        s.lon >= -180 &&
        s.lon <= 180 &&
        Number.isFinite(s.height) &&
        s.height >= -500 &&
        s.height <= 9000
      )
        setStation({ ...s, locator: typeof s.locator === 'string' ? s.locator : undefined });
    } catch {}
    setEditing(true);
    // The clock, live Doppler and sky position follow `now` every second. Passes are only
    // recalculated when `start` changes, every 10 minutes; finished passes drop out through `now`.
    const clock = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setStart(Math.floor(t / 600000) * 600000);
    }, 1000);
    return () => clearInterval(clock);
  }, []);
  useModalFocus(
    modalRef,
    editing || sourceOpen || !!orbitSatId,
    () => {
      if (stationConfirmed) setEditing(false);
      setSourceOpen(false);
      setOrbitSatId(null);
    },
    [editing, sourceOpen, orbitSatId, stationConfirmed],
  );
  const rawResult = useMemo(
    () => (start ? predict(elements, catalog, station, start, hours) : { passes: [], unavailable: [] }),
    [elements, station, start, hours],
  );
  const result = useMemo(
    () => ({ ...rawResult, passes: localizePasses(rawResult.passes, station, hours) }),
    [rawResult, station, hours],
  );
  const reachable = useMemo(() => {
    const localized = new Map(result.passes.map((p) => [p.sat.id, p.sat]));
    return reachableCatalog(catalog, result.passes, now, filters.elevation).map(
      (s) => localized.get(s.id) ?? s,
    );
  }, [result.passes, now, filters.elevation]);
  const availableCatalog = useMemo(
    () => reachable.filter((s) => showUncertain || !uncertain(s)),
    [reachable, showUncertain],
  );
  useEffect(() => {
    if (!start) return; // No passes are calculated yet; keep the default filters.
    setFilters((f) => {
      const uplink =
        f.uplink === 'all' || availableCatalog.some((s) => band(s.up) === f.uplink) ? f.uplink : 'all';
      const downlink =
        f.downlink === 'all' || availableCatalog.some((s) => band(s.down) === f.downlink)
          ? f.downlink
          : 'all';
      const mode = f.mode === 'all' || availableCatalog.some((s) => s.mode === f.mode) ? f.mode : 'all';
      return uplink === f.uplink && downlink === f.downlink && mode === f.mode
        ? f
        : { ...f, uplink, downlink, mode };
    });
    if (orbitSatId && !availableCatalog.some((s) => s.id === orbitSatId)) setOrbitSatId(null);
  }, [availableCatalog, orbitSatId, start]);
  const options = useMemo(
    () =>
      availableCatalog.filter(
        (s) =>
          (filters.status === 'all' || s.access === filters.status) &&
          (filters.uplink === 'all' || band(s.up) === filters.uplink) &&
          (filters.downlink === 'all' || band(s.down) === filters.downlink) &&
          (filters.mode === 'all' || s.mode === filters.mode),
      ),
    [availableCatalog, filters.status, filters.uplink, filters.downlink, filters.mode],
  );
  const activeFilters = options.some((s) => s.id === filters.satellite)
    ? filters
    : { ...filters, satellite: 'all' };
  useEffect(() => {
    if (filters.satellite !== 'all' && !options.some((s) => s.id === filters.satellite))
      setFilters((f) => ({ ...f, satellite: 'all' }));
  }, [options, filters.satellite]);
  const included = useMemo(
    () => result.passes.filter((p) => availableCatalog.some((s) => s.id === p.sat.id)),
    [result.passes, availableCatalog],
  );
  const passes = useMemo(() => filterPasses(included, activeFilters, now), [included, activeFilters, now]);
  useEffect(() => setVisibleCount(12), [filters, hours, showUncertain, station]);
  const picked = passes.find((p) => p.key === selected) ?? passes[0];
  const next = passes[0];
  const high = passes.filter((p) => p.peak.el >= 30).length;
  const publicationAge = Math.max(0, (now - Date.parse(data.fetchedAt)) / 86400000);
  const oldest = elements
    .filter((e) => availableCatalog.some((s) => s.norad === e.norad))
    .reduce((m, e) => Math.max(m, (now - e.epoch) / 86400000), 0);
  const filteredCatalog = options.filter(
    (s) => activeFilters.satellite === 'all' || s.id === activeFilters.satellite,
  );
  const countWork = passes.filter((p) => p.access === 'work').length,
    countListen = passes.length - countWork;
  function reset() {
    setFilters(defaults);
    setShowUncertain(false);
  }
  function toggleZone() {
    setUtc((v) => {
      try {
        localStorage.setItem('northbound-utc', v ? '0' : '1');
      } catch {}
      return !v;
    });
  }
  const clock = useMemo(() => makeClock(utc), [utc]);
  function saveStation(s: Station) {
    setStation(s);
    setStationConfirmed(true);
    setSelected('');
    setMobileDetail(false);
    setOrbitSatId(null);
    try {
      localStorage.setItem('northbound-station', JSON.stringify(s));
    } catch {}
    setEditing(false);
  }
  const events = useMemo(
    () => hiddenEvents(availableCatalog, result.passes, filters.status, now, filters.elevation),
    [availableCatalog, result.passes, filters.status, now, filters.elevation],
  );
  const orbitSat = availableCatalog.find((s) => s.id === orbitSatId);
  return (
    <div className="app-shell">
      <PageHeader />
      <main>
        <Intro station={station} setEditing={setEditing} />
        <SummaryStrip
          passes={passes}
          next={next}
          high={high}
          hours={hours}
          now={now}
          clock={clock}
          toggleZone={toggleZone}
        />
        <DataStatus
          tab={tab}
          setTab={setTab}
          data={data}
          fetching={fetching}
          load={load}
          now={now}
          oldest={oldest}
          publicationAge={publicationAge}
        />
        <EventBanner
          events={events}
          hours={hours}
          now={now}
          activity={activity}
          onShow={(sat) => {
            setFilters({ ...defaults, status: 'all', elevation: filters.elevation, satellite: sat.id });
            setTab('passes');
          }}
        />
        <div className={`workspace ${tab === 'guide' ? 'guide-layout' : ''}`}>
          <FiltersPanel
            filters={filters}
            activeFilters={activeFilters}
            availableCatalog={availableCatalog}
            options={options}
            hours={hours}
            showUncertain={showUncertain}
            update={update}
            reset={reset}
            setHours={setHours}
            setShowUncertain={setShowUncertain}
          />
          {tab === 'passes' ? (
            <>
              <PassList
                passes={passes}
                picked={picked}
                result={result}
                filters={filters}
                activeFilters={activeFilters}
                hours={hours}
                now={now}
                start={start}
                activity={activity}
                countWork={countWork}
                countListen={countListen}
                visibleCount={visibleCount}
                clock={clock}
                reset={reset}
                setSelected={setSelected}
                setMobileDetail={setMobileDetail}
                setSourceOpen={setSourceOpen}
                setVisibleCount={setVisibleCount}
              />
              <div className={`detail-container ${mobileDetail ? 'mobile-open' : ''}`}>
                {picked ? (
                  <PassDetail
                    pass={picked}
                    station={station}
                    now={now}
                    activity={activity}
                    clock={clock}
                    onClose={() => setMobileDetail(false)}
                    onOrbit={() => setOrbitSatId(picked.sat.id)}
                  />
                ) : (
                  <aside className="detail detail-empty">
                    <SatelliteIcon size={30} />
                    <h3>A pass, at a glance.</h3>
                    <p>Select a matching pass to see its sky path, frequencies and tuning guide.</p>
                  </aside>
                )}
              </div>
            </>
          ) : (
            <Guide
              filteredCatalog={filteredCatalog}
              filters={filters}
              hours={hours}
              now={now}
              activity={activity}
              setFilters={setFilters}
              setOrbitSatId={setOrbitSatId}
              setTab={setTab}
            />
          )}
        </div>
        <footer>
          <span>
            TF5NN <span className="footer-slash">/</span> YOUR STATION. YOUR SKY.
          </span>
          <button onClick={() => setSourceOpen(true)}>
            Sources & prediction notes <ArrowUpRight size={12} />
          </button>
          <span className="footer-review">Frequencies reviewed {dateYear(Date.parse(reviewed))}</span>
        </footer>
      </main>
      {editing && (
        <StationDialog
          station={station}
          dialogRef={modalRef}
          opening={!stationConfirmed}
          onSave={saveStation}
          onClose={() => {
            if (stationConfirmed) setEditing(false);
          }}
        />
      )}
      {orbitSat && (
        <OrbitDialog
          sat={orbitSat}
          element={elements.find((e) => e.norad === orbitSat.norad)}
          now={now}
          fetching={fetching}
          data={data}
          dialogRef={modalRef}
          onRefresh={() => void load()}
          onClose={() => setOrbitSatId(null)}
        />
      )}
      {sourceOpen && (
        <SourcesDialog
          data={data}
          now={now}
          result={result}
          modalRef={modalRef}
          setSourceOpen={setSourceOpen}
        />
      )}
    </div>
  );
}
