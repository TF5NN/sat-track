import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { parseTLE,predict,defaultStation,filterPasses,pointAt,doppler,usableAt,grid } from '../src/lib/orbit.ts';
import { catalog } from '../src/lib/catalog.ts';
import { twoline2satrec } from 'satellite.js';
const elements=parseTLE(readFileSync('tests/fixtures/orbits-2026-11-10.txt','utf8'));
const start=Date.parse('2026-11-10T14:00:00Z');
assert(elements.length>80,'valid current TLE feed');
assert.equal(parseTLE('corrupt feed').length,0);
const damaged=elements[0].line1.slice(0,68)+(Number(elements[0].line1[68])+1)%10;
assert.equal(parseTLE(`${damaged}\n${elements[0].line2}`).length,0,'checksum rejected');
const result=predict(elements,catalog,defaultStation,start,72);
assert(result.passes.length>200); assert.deepEqual(result.unavailable,[100470],'no verified JAMX01 TLE yet: hidden rather than guessed');
for(const p of result.passes){
 assert(p.aos.time<p.peak.time&&p.peak.time<p.los.time);
 assert(Math.abs(p.aos.el)<.02&&Math.abs(p.los.el)<.02,'horizon crossing refined');
 assert(p.peak.el>=Math.max(...p.track.map(v=>v.el))-.01,'peak maximized');
 assert(p.los.time>start&&p.aos.time<start+72*3600000);
 assert(p.los.time-p.aos.time<25*60000);
 assert(p.track.every(v=>Number.isFinite(v.az)&&v.az>=0&&v.az<=360&&v.el>-.02));
 if(p.sat.id==='iss-sstv')assert(p.windows.every(w=>w[0]>=Date.parse(p.sat.event.start)&&w[1]<=Date.parse(p.sat.event.end)));
 if(p.sat.id==='iss-aprs')assert(p.windows.every(w=>w[1]<=Date.parse(p.sat.blackout.start)||w[0]>=Date.parse(p.sat.blackout.end)));
 if(p.sat.daylight&&p.access==='work'){
  const rec=twoline2satrec(p.element.line1,p.element.line2);
  for(const [a,b] of p.windows)assert(pointAt(rec,(a+b)/2,defaultStation).sun);
 }
}
assert(result.passes.some(p=>p.sat.id==='iss-sstv'));
const old=predict(elements,catalog,defaultStation,start+10*86400000,24);
assert.equal(old.passes.length,0,'old orbits blocked');
assert(old.unavailable.length>0);
const f={status:'all',satellite:'all',uplink:'all',downlink:'all',mode:'all',elevation:0};
const samples=[{...f,status:'work'},{...f,status:'listen'},{...f,uplink:'70cm',downlink:'2m'},{...f,mode:'SSTV'},{...f,satellite:'so50'},{...f,elevation:40},{...f,uplink:'none',status:'work'}];
for(const query of samples){const ps=filterPasses(result.passes,query,start);for(const p of ps){if(query.status!=='all')assert.equal(p.access,query.status);if(query.mode!=='all')assert.equal(p.sat.mode,query.mode);if(query.satellite!=='all')assert.equal(p.sat.id,query.satellite);assert(p.peak.el>=query.elevation);}}
assert.equal(filterPasses(result.passes,samples.at(-1),start).length,0);
const p=result.passes.find(p=>p.sat.id==='so50'),rec=twoline2satrec(p.element.line1,p.element.line2);
const rise=doppler(rec,p.aos.time,defaultStation,p.sat.up,p.sat.down),set=doppler(rec,p.los.time,defaultStation,p.sat.up,p.sat.down);
assert(rise.rx>p.sat.down&&rise.tx<p.sat.up,'approaching Doppler signs');
assert(set.rx<p.sat.down&&set.tx>p.sat.up,'receding Doppler signs');
const ongoing=predict(elements,[p.sat],defaultStation,p.peak.time,1).passes.find(v=>Math.abs(v.aos.time-p.aos.time)<1000);
assert(ongoing,'ongoing passes retain original AOS');
const ao=catalog.find(s=>s.id==='ao91');assert(!usableAt(ao,start,false));
assert.equal(grid(defaultStation),'HP94ad');
console.log(JSON.stringify({result:'PASS',validElements:elements.length,passes72h:result.passes.length,services:catalog.length,spacecraft:new Set(catalog.map(s=>s.norad)).size,so50:{aos:new Date(p.aos.time).toISOString(),peakElevation:p.peak.el,los:new Date(p.los.time).toISOString(),rise,set},checks:['checksums','horizon crossings','true peak','time windows','Doppler signs','ongoing passes','eclipse restrictions','event/blackout windows','combined filters','stale data rejection']},null,2));
