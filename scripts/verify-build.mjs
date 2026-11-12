import {readFileSync,existsSync} from 'node:fs';
import {strict as assert} from 'node:assert';
const html=readFileSync('dist/index.html','utf8');
const local=[...html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)].map(m=>m[1]);
assert(local.length>=3);
for(const url of local){assert(url.startsWith('/sat-track/'),`Wrong base path: ${url}`);assert(existsSync('dist/'+url.slice('/sat-track/'.length)),`Missing asset: ${url}`);}
assert.equal(readFileSync('dist/data/orbits.json','utf8'),readFileSync('public/data/orbits.json','utf8'),'built data matches the validated dataset');
assert(html.includes('https://tf5nn.goatcounter.com/count'),'visit counter script is present');
console.log('Static build: base paths, assets and published dataset verified.');
