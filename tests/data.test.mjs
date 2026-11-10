import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {parseTLE} from '../src/lib/orbit.ts';
import {parseBundle,validOrbit} from '../src/lib/orbital-data.ts';
import {prepareDataset} from '../scripts/sync-orbits.ts';
const now=Date.parse('2026-11-10T14:30:00Z');
const elements=parseTLE(readFileSync('tests/fixtures/orbits-2026-11-10.txt','utf8'));
const good=elements.find(e=>e.norad===25544);
const bundle={schemaVersion:1,text:`ISS\n${good.line1}\n${good.line2}\n`,fetchedAt:new Date(now).toISOString(),provider:'fixture',sources:[],missing:[]};
test('dataset validates both TLE checksums and metadata',()=>{
 assert.equal(parseBundle(bundle,now).elements[0].norad,25544);
 for(const change of [{schemaVersion:2},{text:'error page'},{fetchedAt:'yesterday'},{fetchedAt:new Date(now+86400000).toISOString()}])assert.throws(()=>parseBundle({...bundle,...change},now));
});
test('plausible fresh elements propagate and stale or future sets are rejected',()=>{
 assert(validOrbit(good,now));assert(!validOrbit({...good,epoch:now-8*86400000},now));assert(!validOrbit({...good,epoch:now+2*86400000},now));
 assert(!validOrbit({...good,line2:good.line2.slice(0,52)+'00.00000000'+good.line2.slice(63)},now));
});
test('partial downloads retain last good spacecraft and never downgrade epochs',()=>{
 const fresh=elements.filter(e=>[25544,27607].includes(e.norad));
 const result=prepareDataset([[{...good,epoch:good.epoch-86400000}]],fresh,now);
 assert(result.some(e=>e.norad===27607));assert.equal(result.find(e=>e.norad===25544).epoch,good.epoch);
 assert.equal(prepareDataset([[{...good,epoch:now+2*86400000}]],fresh,now).find(e=>e.norad===25544).epoch,good.epoch);
 assert.equal(prepareDataset([elements],[],now).some(e=>e.norad===7530),false,'only curated compatible spacecraft are published');
});

test('all download failures leave the saved file byte-for-byte unchanged',async()=>{
 const {mkdtemp,writeFile,readFile,rm}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {pathToFileURL}=await import('node:url');
 const {syncOrbits}=await import('../scripts/sync-orbits.ts');
 const dir=await mkdtemp(join(tmpdir(),'sat-track-test-'));
 const file=pathToFileURL(join(dir,'orbits.json'));const text=JSON.stringify(bundle);
 try{
  await writeFile(file,text);
  await assert.rejects(()=>syncOrbits({now,datasetPath:file,fetchImpl:async()=>new Response('Unavailable',{status:503})}),/All sources failed/);
  assert.equal(await readFile(file,'utf8'),text);
 }finally{await rm(dir,{recursive:true,force:true});}
});
