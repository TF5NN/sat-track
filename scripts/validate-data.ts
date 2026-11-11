import { readFile } from 'node:fs/promises';
import { parseBundle, plausibleOrbit, freshOrbit } from '../src/lib/orbital-data.ts';
import { catalog } from '../src/lib/catalog.ts';
const now=Date.now();
const {bundle,elements}=parseBundle(JSON.parse(await readFile(new URL('../public/data/orbits.json',import.meta.url),'utf8')),now);
const wanted=new Set(catalog.map(s=>s.norad));
if(elements.some(e=>!wanted.has(e.norad)||!plausibleOrbit(e)))throw Error('Published data has invalid or unlisted elements; run npm run sync:orbits.');
if(new Set(elements.map(e=>e.norad)).size!==elements.length)throw Error('Duplicate spacecraft');
// Age is not a build failure: the app hides elements it cannot use, and the daily
// sync replaces them. Blocking here would stop unrelated code changes from deploying.
const aged=elements.filter(e=>!freshOrbit(e,now)).map(e=>e.norad);
if(aged.length)console.warn(`Warning: elements outside the 7-day window (hidden in the app until refreshed): ${aged.join(', ')}. Run npm run sync:orbits.`);
console.log(JSON.stringify({result:'PASS',spacecraft:elements.length,aged,fetchedAt:bundle.fetchedAt,missing:bundle.missing}));
