import { useEffect, useRef, useState } from 'react';
import bundledData from '../../public/data/orbits.json';
import { parseActivity, type Activity } from '../lib/activity';
import { parseBundle } from '../lib/orbital-data';
import type { Element } from '../lib/orbit';

// The bundled copy shipped with this build, so it is trusted whatever the device clock says.
// (A clock set behind the data timestamp used to stop the whole page from loading.)
const initialData = parseBundle(bundledData, Infinity);
export const builtAt = Date.parse(initialData.bundle.fetchedAt);

// Orbital elements and AMSAT reports: the newest of the bundled copy, the browser cache and
// the published file. Checked on opening, hourly, and when returning after an hour away.
export function useOrbitData() {
  const lastRefresh = useRef(0);
  const [elements, setElements] = useState<Element[]>(initialData.elements),
    [fetching, setFetching] = useState(true),
    [data, setData] = useState({
      kind: 'bundled',
      fetchedAt: initialData.bundle.fetchedAt,
      error: '',
      provider: initialData.bundle.provider,
    });
  const [activity, setActivity] = useState<Activity | null>(() => parseActivity(initialData.bundle.activity));
  async function load() {
    lastRefresh.current = Date.now();
    setFetching(true);
    const candidates = [initialData];
    try {
      const cached = JSON.parse(localStorage.getItem('northbound-orbits') || 'null');
      if (cached) candidates.push(parseBundle(cached, Date.now()));
    } catch {}
    let downloaded = false;
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/orbits.json`, {
        cache: 'no-cache',
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw Error('Published data unavailable');
      candidates.push(parseBundle(await response.json(), Date.now()));
      downloaded = true;
    } catch {
      /* Keep the newest verified browser cache or bundled dataset. */
    }
    const chosen = candidates.sort(
      (a, b) => Date.parse(b.bundle.fetchedAt) - Date.parse(a.bundle.fetchedAt),
    )[0];
    setElements(chosen.elements);
    setActivity(parseActivity(chosen.bundle.activity));
    setData({
      kind: downloaded ? 'published' : chosen === initialData ? 'bundled' : 'cached',
      fetchedAt: chosen.bundle.fetchedAt,
      provider: chosen.bundle.provider,
      error: downloaded ? '' : 'Could not check for a newer published dataset. Using saved orbital data.',
    });
    try {
      localStorage.setItem('northbound-orbits', JSON.stringify(chosen.bundle));
    } catch {}
    setFetching(false);
  }
  useEffect(() => {
    void load();
    const refresh = setInterval(() => void load(), 3600000);
    const resume = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRefresh.current >= 3600000) void load();
    };
    document.addEventListener('visibilitychange', resume);
    return () => {
      clearInterval(refresh);
      document.removeEventListener('visibilitychange', resume);
    };
  }, []);
  return { elements, activity, data, fetching, load };
}
