import { readFile, writeFile, rename } from 'node:fs/promises';
import { catalog, sources } from '../src/lib/catalog.ts';
import { parseTLE, type Element } from '../src/lib/orbit.ts';
import { parseSatnogs, mergeElements, elementText } from '../src/lib/elements.ts';
import { validOrbit, parseBundle, type OrbitBundle } from '../src/lib/orbital-data.ts';

export const feeds = [
  {name:'AMSAT',url:sources.tle,json:false},
  {name:'SatNOGS',url:sources.satnogs,json:true},
];
const fallback = {name:'CelesTrak',url:'https://celestrak.org/NORAD/elements/gp.php?GROUP=amateur&FORMAT=tle',json:false};
export function prepareDataset(groups: Element[][], previous: Element[], now: number): Element[] {
  const wanted = new Set(catalog.map(s=>s.norad));
  return mergeElements([previous,...groups].map(g=>g.filter(e=>wanted.has(e.norad)&&validOrbit(e,now))),now)
    .sort((a,b)=>a.norad-b.norad);
}
export async function syncOrbits(options:{now?:number;datasetPath?:URL;fetchImpl?:typeof fetch}={}) {
  const now=options.now??Date.now(), path=options.datasetPath??new URL('../public/data/orbits.json',import.meta.url);
  const request=options.fetchImpl??fetch;
  let previous:Element[]=[];
  try { previous=parseBundle(JSON.parse(await readFile(path,'utf8')),now).elements; } catch { /* Initial publication has no saved file. */ }
  const successful:OrbitBundle['sources']=[];
  async function download(feed:typeof fallback) {
    try {
      const response=await request(feed.url,{signal:AbortSignal.timeout(20000),headers:{Accept:feed.json?'application/json':'text/plain','User-Agent':'TF5NN-sat-track/1.0 (https://github.com/TF5NN/sat-track)'}});
      if(!response.ok)throw Error(`HTTP ${response.status}`);
      const elements=feed.json?parseSatnogs(await response.json()):parseTLE(await response.text());
      const usable=elements.filter(e=>validOrbit(e,now));
      if(!usable.length)throw Error('No fresh, valid orbital elements');
      successful.push({name:feed.name,url:feed.url,fetchedAt:new Date(now).toISOString()});
      return usable;
    } catch(error) {
      console.warn(`${feed.name}: ${error instanceof Error?error.message:'download failed'}. No repeated requests.`);
      return [];
    }
  }
  const [amsat,satnogs]=await Promise.all(feeds.map(download));
  const backup=amsat.length?[]:await download(fallback);
  if(!successful.length)throw Error('All sources failed; the published dataset is unchanged.');
  const elements=prepareDataset([amsat,satnogs,backup],previous,now);
  // Do not replace the public file with a partial feed that loses basic planning.
  const core=[25544,27607,43017,61781,59112];
  const lost=core.filter(id=>!elements.some(e=>e.norad===id));
  if(lost.length)throw Error(`Core spacecraft missing (${lost.join(', ')}); the published dataset is unchanged.`);
  const ids=[...new Set(catalog.map(s=>s.norad))];
  const bundle:OrbitBundle={schemaVersion:1,text:elementText(elements),fetchedAt:new Date(now).toISOString(),provider:successful.map(s=>s.name).sort().join(' + '),sources:successful.sort((a,b)=>a.name.localeCompare(b.name)),missing:ids.filter(id=>!elements.some(e=>e.norad===id))};
  parseBundle(bundle,now);
  const temporary=new URL('orbits.json.tmp',path);
  await writeFile(temporary,JSON.stringify(bundle,null,2)+'\n');
  await rename(temporary,path);
  console.log(JSON.stringify({result:'PASS',spacecraft:elements.length,missing:bundle.missing,providers:bundle.provider,fetchedAt:bundle.fetchedAt}));
}
if(process.argv[1]&&import.meta.url===new URL(process.argv[1],'file:').href) {
  syncOrbits().catch(error=>{console.error(error.message);process.exitCode=1;});
}
