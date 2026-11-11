import { twoline2satrec, propagate, gstime, eciToEcf, ecfToLookAngles, jday } from 'satellite.js';
import type { SatRec } from 'satellite.js';
import type { Satellite } from './catalog';
export type Station = { lat: number; lon: number; height: number; locator?: string };
export type Element = { norad: number; name: string; line1: string; line2: string; epoch: number };
export type Point = { time: number; az: number; el: number; range: number; sun: boolean };
export type Pass = { key: string; sat: Satellite; element: Element; aos: Point; peak: Point; los: Point; track: Point[]; windows: [number,number][]; access: 'work'|'listen' };
export const defaultStation: Station = { lat:64.1466, lon:-21.9426, height:30 };
const DEG=180/Math.PI, DAY=86400000;
export function noradNumber(value: string): number {
  const id = value.trim();
  if (/^\d{1,5}$/.test(id)) return Number(id);
  // Space-Track Alpha-5: I and O are omitted from the letter sequence.
  if (/^[A-HJ-NP-Z]\d{4}$/.test(id)) return (10 + 'ABCDEFGHJKLMNPQRSTUVWXYZ'.indexOf(id[0])) * 10000 + Number(id.slice(1));
  return NaN;
}
export function parseTLE(text:string): Element[] {
  const lines=text.split(/\r?\n/).map(l=>l.trimEnd()); const result:Element[]=[];
  for(let i=0;i<lines.length-1;i++) {
    const a=lines[i],b=lines[i+1];
    if(!a.startsWith('1 ')||!b.startsWith('2 ')||a.length<69||b.length<69) continue;
    const id=noradNumber(a.slice(2,7)); if(id!==noradNumber(b.slice(2,7))) continue;
    const check=(s:string)=>[...s.slice(0,68)].reduce((v,c)=>v+(c==='-'?1:/\d/.test(c)?Number(c):0),0)%10===Number(s[68]);
    if(!check(a)||!check(b)) continue;
    const yy=Number(a.slice(18,20)), day=Number(a.slice(20,32));
    const epoch=Date.UTC(yy<57?2000+yy:1900+yy,0,1)+(day-1)*DAY;
    if(!Number.isFinite(epoch)||!Number.isFinite(id)) continue;
    // The line above is a name only if it is not itself an element line (name-less 2-line files).
    const above=i>0?lines[i-1]:'',name=/^[12] /.test(above)&&above.length>=69?'':above.replace(/^0 /,'').trim();
    result.push({norad:id,name,line1:a,line2:b,epoch}); i++;
  }
  return result;
}
export function pointAt(rec:SatRec,time:number,station:Station):Point|null {
  const date=new Date(time),pv=propagate(rec,date);
  if(!pv||!pv.position||typeof pv.position==='boolean') return null;
  const p=pv.position,ecf=eciToEcf(p,gstime(date));
  const look=ecfToLookAngles({latitude:station.lat/DEG,longitude:station.lon/DEG,height:station.height/1000},ecf);
  // Low-precision solar vector (Meeus / Astronomical Almanac), equatorial frame.
  const n=jday(date)-2451545, g=(357.528+0.9856003*n)/DEG;
  const lambda=(280.460+0.9856474*n+1.915*Math.sin(g)+0.020*Math.sin(2*g))/DEG;
  const obliquity=(23.439-0.0000004*n)/DEG;
  const sun=[Math.cos(lambda),Math.cos(obliquity)*Math.sin(lambda),Math.sin(obliquity)*Math.sin(lambda)];
  const mag=1,r=Math.hypot(p.x,p.y,p.z);
  const dot=-(p.x*sun[0]+p.y*sun[1]+p.z*sun[2])/(r*mag);
  const separation=Math.acos(Math.max(-1,Math.min(1,dot)));
  const lit=separation>Math.asin(Math.min(1,6378.137/r))+0.00466;
  return {time,az:look.azimuth*DEG,el:look.elevation*DEG,range:look.rangeSat,sun:lit};
}
export function doppler(rec:SatRec,time:number,station:Station,up:number|null,down:number) {
  const p=pointAt(rec,time-500,station),n=pointAt(rec,time+500,station);
  const rate=p&&n?n.range-p.range:0; // km/s, positive receding; includes rotating observer
  return { rx:down*(1-rate/299792.458),tx:up===null?null:up*(1+rate/299792.458),rate };
}
export function usableAt(sat:Satellite,time:number,sun:boolean):boolean {
  if(sat.daylight&&!sun) return false;
  if(sat.event&&(time<Date.parse(sat.event.start)||time>=Date.parse(sat.event.end))) return false;
  if(sat.blackout&&time>=Date.parse(sat.blackout.start)&&time<Date.parse(sat.blackout.end)) return false;
  return true;
}
export function predict(elements:Element[],sats:Satellite[],station:Station,start:number,hours:number):{passes:Pass[];unavailable:number[]} {
  const passes:Pass[]=[],unavailable:number[]=[], end=start+hours*3600000;
  const unique=[...new Set(sats.map(s=>s.norad))];
  for(const id of unique) {
    const e=elements.find(t=>t.norad===id);
    if(!e||start-e.epoch>7*DAY||e.epoch-start>DAY){unavailable.push(id);continue;}
    const rec=twoline2satrec(e.line1,e.line2),at=(t:number)=>pointAt(rec,t,station);
    const crossing=(left:number,right:number,rising:boolean)=>{
      for(let j=0;j<16&&right-left>100;j++){const m=(left+right)/2,p=at(m);if(!p)break;if((p.el>=0)===rising)right=m;else left=m;}return at((left+right)/2)!;
    };
    let previous=at(start-1800000),aos:Point|null=null;
    for(let time=start-1770000;time<=end+1800000;time+=30000) {
      const p=at(time);if(!p||!previous){previous=p;continue;}
      if(previous.el<0&&p.el>=0) aos=crossing(previous.time,time,true);
      if(previous.el>=0&&p.el<0&&aos) {
        const los=crossing(previous.time,time,false);
        if(los.time>start&&aos.time<end&&aos.time-e.epoch<=7*DAY) {
          let left=aos.time,right=los.time;
          for(let j=0;j<24;j++){const a=left+(right-left)/3,b=right-(right-left)/3;if((at(a)?.el??-90)<(at(b)?.el??-90))left=a;else right=b;}
          const peak=at((left+right)/2)!;
          const track=Array.from({length:61},(_,i)=>at(aos!.time+(los.time-aos!.time)*i/60)!);
          for(const sat of sats.filter(s=>s.norad===id)) {
            const windows:[number,number][]=[];let w:number|null=null;
            for(let t=aos.time;t<los.time+5000;t+=5000){const tt=Math.min(t,los.time),sp=at(tt);const yes=tt<los.time&&!!sp&&usableAt(sat,tt,sp.sun);
              if(yes&&w===null)w=tt;
              if(!yes&&w!==null){windows.push([w,tt]);w=null;}
            }
            // Fixed scheduled event boundaries are exact; eclipse transitions are within 5 s.
            const limited=windows.map(([a,b]):[number,number]=>[sat.event?Math.max(a,Date.parse(sat.event.start)):a,sat.event?Math.min(b,Date.parse(sat.event.end)):b]);
            if(!limited.length&&(sat.event||sat.blackout||sat.daylight))continue;
            passes.push({key:`${sat.id}-${Math.round(aos.time/60000)}`,sat,element:e,aos,los,peak,track,windows:limited,access:sat.access==='work'&&limited.length?'work':'listen'});
          }
        }
        aos=null;
      }
      previous=p;
    }
  }
  return {passes:passes.sort((a,b)=>a.aos.time-b.aos.time||a.sat.name.localeCompare(b.sat.name)),unavailable};
}
export type Filters={status:string;satellite:string;uplink:string;downlink:string;mode:string;elevation:number};
export function filterPasses(passes:Pass[],f:Filters,now:number){
  return passes.filter(p=>p.los.time>now&&(f.status==='all'||p.access===f.status)&&(f.satellite==='all'||p.sat.id===f.satellite)&&(f.uplink==='all'||(p.sat.up===null?'none':p.sat.up<200?'2m':'70cm')===f.uplink)&&(f.downlink==='all'||(p.sat.down<200?'2m':'70cm')===f.downlink)&&(f.mode==='all'||p.sat.mode===f.mode)&&p.peak.el>=f.elevation);
}
export const compass=(az:number)=>['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(az/22.5)%16];
export function grid(s:Station){const a=Math.min(360-1e-9,Math.max(0,s.lon+180)),b=Math.min(180-1e-9,Math.max(0,s.lat+90));return String.fromCharCode(65+Math.floor(a/20),65+Math.floor(b/10))+Math.floor(a%20/2)+Math.floor(b%10)+String.fromCharCode(97+Math.floor(a%2*12),97+Math.floor(b%1*24));}
