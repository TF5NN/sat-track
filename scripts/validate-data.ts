import { readFile } from 'node:fs/promises';
import { parseBundle, validOrbit } from '../src/lib/orbital-data.ts';
import { catalog } from '../src/lib/catalog.ts';
const now=Date.now();
const {bundle,elements}=parseBundle(JSON.parse(await readFile(new URL('../public/data/orbits.json',import.meta.url),'utf8')),now);
const wanted=new Set(catalog.map(s=>s.norad));
if(elements.some(e=>!wanted.has(e.norad)||!validOrbit(e,now)))throw Error('Published data has invalid, stale or unlisted elements; run npm run sync:orbits.');
if(new Set(elements.map(e=>e.norad)).size!==elements.length)throw Error('Duplicate spacecraft');
console.log(JSON.stringify({result:'PASS',spacecraft:elements.length,fetchedAt:bundle.fetchedAt,missing:bundle.missing}));
