import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronRight, Clock3, Download, Headphones, Info, LockKeyhole, MapPin, Radio, RefreshCw, Satellite as SatelliteIcon, Settings2, SlidersHorizontal, Sun, X } from 'lucide-react';
import { twoline2satrec } from 'satellite.js';
import StationDialog from './components/station-dialog';
import OrbitDialog, { htManual } from './components/orbit-dialog';
import { createPassCalendar } from './lib/calendar';
import { parseBundle } from './lib/orbital-data';
import bundledData from '../public/data/orbits.json';
import { reachableCatalog, localizePasses } from './lib/visibility';
import { catalog, band, frequency, reviewed, sources, uncertain, type Satellite } from './lib/catalog';
import { compass, defaultStation, doppler, filterPasses, grid, parseTLE, pointAt, predict, type Element, type Filters, type Pass, type Station } from './lib/orbit';
// The bundled copy shipped with this build, so it is trusted whatever the device clock says.
// (A clock set behind the data timestamp used to stop the whole page from loading.)
const initialData=parseBundle(bundledData,Infinity);
const builtAt=Date.parse(initialData.bundle.fetchedAt);
// Beginner-first defaults: FM voice satellites you can talk through, on passes
// high enough for a handheld. APRS and SSTV stay one Mode change away.
const defaults:Filters={status:'all',satellite:'all',uplink:'all',downlink:'all',mode:'FM voice',elevation:15};
const time=(t:number,seconds=false)=>new Date(t).toLocaleTimeString('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',...(seconds?{second:'2-digit'}:{})});
const date=(t:number)=>new Date(t).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});
const duration=(a:number,b:number)=>`${Math.floor((b-a)/60000)}m ${String(Math.floor((b-a)%60000/1000)).padStart(2,'0')}s`;
const until=(t:number,now:number)=>t<=now?'In progress':t-now<3600000?`In ${Math.ceil((t-now)/60000)} min`:`In ${Math.floor((t-now)/3600000)}h ${Math.floor((t-now)%3600000/60000)}m`;
function Badge({access,small=false}:{access:'work'|'listen';small?:boolean}){return <span className={`badge ${access} ${small?'small':''}`}>{access==='work'?<Radio size={11}/>:<Headphones size={11}/>} {access==='work'?'Workable':'Receive only'}</span>}
function SkyPlot({pass,live}:{pass:Pass;live?:{az:number;el:number}|null}){
  const xy=(p:{az:number;el:number})=>{const r=(90-Math.max(0,p.el))/90*94,a=p.az*Math.PI/180;return [120+Math.sin(a)*r,120-Math.cos(a)*r]};
  const a=xy(pass.aos),b=xy(pass.los),peak=xy(pass.peak),path=pass.track.map((p,i)=>`${i?'L':'M'}${xy(p).join(',')}`).join(' '),current=live&&live.el>=0?xy(live):null;
  return <svg className="skyplot" viewBox="0 0 240 240" role="img" aria-label={`Sky path from ${compass(pass.aos.az)} through ${pass.peak.el.toFixed(0)} degrees elevation to ${compass(pass.los.az)}. North at top, east at right.`}>
    <circle cx="120" cy="120" r="94" fill="#f4f7f2" stroke="#cfdad4"/>{[31.33,62.67].map(r=><circle key={r} cx="120" cy="120" r={r} fill="none" stroke="#d6dfd8" strokeDasharray="3 4"/>)}
    <path d="M26 120H214M120 26V214" stroke="#d6dfd8"/>
    <text x="120" y="14" textAnchor="middle" className="sky-cardinal">N</text><text x="228" y="124" textAnchor="middle" className="sky-cardinal">E</text><text x="120" y="234" textAnchor="middle" className="sky-cardinal">S</text><text x="12" y="124" textAnchor="middle" className="sky-cardinal">W</text>
    <text x="124" y="61" className="sky-degree">30°</text><text x="124" y="93" className="sky-degree">60°</text><path d={path} fill="none" stroke="#21806a" strokeWidth="2.5"/>
    <circle cx={a[0]} cy={a[1]} r="4" fill="#21806a"/><circle cx={b[0]} cy={b[1]} r="4" fill="#f8faf5" stroke="#21806a" strokeWidth="1.8"/>
    <circle cx={peak[0]} cy={peak[1]} r="3" fill="#21806a"/>{current&&<><circle cx={current[0]} cy={current[1]} r="8" fill="#21806a" opacity=".2"/><circle cx={current[0]} cy={current[1]} r="4" fill="#142f32"/></>}
  </svg>
}
function Arc({pass}:{pass:Pass}){const d=pass.track.map((p,i)=>`${i?'L':'M'}${i/60*74},${36-p.el/90*32}`).join(' ');return <svg viewBox="0 0 74 42" className="mini-arc" aria-hidden="true"><path d="M0 36H74" stroke="#d7dfd8"/><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>}
function ics(pass:Pass){
  const content=createPassCalendar({key:pass.key,sat:pass.sat,start:pass.aos.time,end:pass.los.time,peakElevation:pass.peak.el,riseDirection:compass(pass.aos.az),setDirection:compass(pass.los.az)});
  const url=URL.createObjectURL(new Blob([content],{type:'text/calendar'})),a=document.createElement('a');a.href=url;a.download=`${pass.sat.id}-pass.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function Detail({pass,station,now,onClose,onOrbit}:{pass:Pass;station:Station;now:number;onClose:()=>void;onOrbit:()=>void}){
  const [t,setT]=useState(0);useEffect(()=>setT(0),[pass.key]);
  const rec=useMemo(()=>twoline2satrec(pass.element.line1,pass.element.line2),[pass.element]);
  const inPass=now>=pass.aos.time&&now<pass.los.time;
  const sample=pass.aos.time+(pass.los.time-pass.aos.time)*t/100;
  const live=pointAt(rec,inPass?now:sample,station);
  const d=doppler(rec,inPass?now:sample,station,pass.sat.up,pass.sat.down);
  const points=[pass.aos,pass.peak,pass.los];
  return <aside className="detail" aria-label="Selected pass details">
    <div className="detail-top"><span className="eyebrow">PASS BRIEFING</span><button className="icon-button mobile-close" onClick={onClose} aria-label="Close pass details"><X size={18}/></button></div>
    <div className="detail-title"><div><h2>{pass.sat.name}</h2><p>{pass.sat.subtitle}</p></div><Badge access={pass.access}/></div>
    <div className="plot-wrap"><SkyPlot pass={pass} live={live}/><span className="plot-caption">{compass(pass.aos.az)} <ArrowRight size={12}/> {compass(pass.los.az)} <span>·</span> {pass.peak.el.toFixed(0)}° peak</span></div>
    <div className="timing">{points.map((p,i)=><div key={i}><span>{['AOS · RISE','MAX · TCA','LOS · SET'][i]}</span><strong>{time(p.time,true)}</strong><small>{Math.round(p.az)}° {compass(p.az)}{i===1?` · ${pass.peak.el.toFixed(1)}° el`:''}</small></div>)}</div>
    <div className="detail-section"><div className="section-label">RADIO SETUP <span>{pass.sat.mode}</span></div>
      <div className="frequency-row"><div><span><ArrowDown size={12}/> Downlink · RX · {band(pass.sat.down)}</span><strong>{frequency(pass.sat.down)} <small>MHz</small></strong></div><div><span><ArrowUp size={12}/> Uplink · TX · {band(pass.sat.up)==='none'?'—':band(pass.sat.up)}</span><strong>{frequency(pass.sat.up)} {pass.sat.up&&<small>MHz</small>}</strong></div></div>
      <p className="tone">TX tone <strong>{pass.sat.tone}</strong> <span>· RX tone off</span></p>
    </div>
    <div className="detail-section"><div className="section-label">DOPPLER TUNING <span>{inPass?'LIVE':time(sample,true)+' UTC'}</span></div>
      {!inPass&&<label className="scrubber"><span>Rise</span><input type="range" aria-label="Preview Doppler across pass" min="0" max="100" value={t} onChange={e=>setT(Number(e.target.value))}/><span>Set</span></label>}
      <div className="tuned"><div><span>Receive</span><strong>{d.rx.toFixed(5)}</strong></div><div><span>{pass.sat.up?'Transmit':'No uplink'}</span><strong>{d.tx?.toFixed(5)??'—'}</strong></div></div>
      <p className="fine">Calculated MHz; round to a supported tuning step. {live&&`${Math.round(live.az)}° ${compass(live.az)} / ${live.el.toFixed(1)}° el.`}</p>
      <table className="doppler-table"><thead><tr><th>Pass</th><th>RX MHz</th><th>TX MHz</th></tr></thead><tbody>{points.map((p,i)=>{const v=doppler(rec,p.time,station,pass.sat.up,pass.sat.down);return <tr key={i}><td>{['Rise','Peak','Set'][i]}</td><td>{v.rx.toFixed(5)}</td><td>{v.tx?.toFixed(5)??'—'}</td></tr>})}</tbody></table>
      <p className="fine">Approaching: RX above nominal, TX below. Receding: reverse. Prioritize 70 cm; its shift is about 3× the 2 m shift. HT app Doppler control is available with compatible firmware.</p>
    </div>
    <div className="operating-note"><Info size={15}/><div><strong>{pass.sat.condition}</strong><p>{pass.sat.notes}</p>{pass.sat.daylight&&<p className="sun-window"><Sun size={13}/> {pass.windows.length?`TX in sunlight only: ${pass.windows.map(w=>time(w[0],true)+'–'+time(w[1],true)).join(', ')} UTC`:'Entire pass in eclipse: receive only. Do not uplink.'}</p>}{pass.sat.event&&<p>Scheduled opportunity: {pass.windows.map(w=>time(w[0],true)+'–'+time(w[1],true)).join(', ')} UTC.</p>}<a href={pass.sat.source} target="_blank" rel="noreferrer">Operator / frequency source <ArrowUpRight size={12}/></a></div></div>
    <div className="orbit-entry"><button className="button" onClick={onOrbit}><SatelliteIcon size={14}/> HT app orbital data</button><span>Same daily orbital data as the predictions</span></div>
    <div className="detail-actions"><button className="button" onClick={()=>ics(pass)}><Download size={14}/> Save pass</button><a className="text-link" href={sources.status} target="_blank" rel="noreferrer">Check live reports <ArrowUpRight size={13}/></a></div>
    <p className="fine element-age">Orbit epoch {date(pass.element.epoch)} {time(pass.element.epoch)} UTC · {Math.max(0,(now-pass.element.epoch)/86400000).toFixed(1)} days old</p>
  </aside>
}
export default function Home(){
  const modalRef=useRef<HTMLElement>(null);
  const lastRefresh=useRef(0);
  const [stationConfirmed,setStationConfirmed]=useState(false);
  const [station,setStation]=useState<Station>(defaultStation),[editing,setEditing]=useState(false),[orbitSatId,setOrbitSatId]=useState<string|null>(null);
  const [elements,setElements]=useState<Element[]>(initialData.elements),[fetching,setFetching]=useState(true),[data,setData]=useState({kind:'bundled',fetchedAt:initialData.bundle.fetchedAt,error:'',provider:initialData.bundle.provider});
  const [now,setNow]=useState(0),[start,setStart]=useState(0),[hours,setHours]=useState(24),[filters,setFilters]=useState<Filters>(defaults),[showUncertain,setShowUncertain]=useState(false),[tab,setTab]=useState('passes'),[selected,setSelected]=useState(''),[mobileDetail,setMobileDetail]=useState(false),[sourceOpen,setSourceOpen]=useState(false),[visibleCount,setVisibleCount]=useState(12);
  function update<K extends keyof Filters>(k:K,v:Filters[K]){setFilters(f=>({...f,[k]:v}));}
  async function load(){
    lastRefresh.current=Date.now();setFetching(true);
    const candidates=[initialData];
    try{const cached=JSON.parse(localStorage.getItem('northbound-orbits')||'null');if(cached)candidates.push(parseBundle(cached,Date.now()));}catch{}
    let downloaded=false;
    try{
      const response=await fetch(`${import.meta.env.BASE_URL}data/orbits.json`,{cache:'no-cache',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error('Published data unavailable');
      candidates.push(parseBundle(await response.json(),Date.now()));downloaded=true;
    }catch{/* Keep the newest verified browser cache or bundled dataset. */}
    const chosen=candidates.sort((a,b)=>Date.parse(b.bundle.fetchedAt)-Date.parse(a.bundle.fetchedAt))[0];
    setElements(chosen.elements);
    setData({kind:downloaded?'published':chosen===initialData?'bundled':'cached',fetchedAt:chosen.bundle.fetchedAt,provider:chosen.bundle.provider,error:downloaded?'':'Could not check for a newer published dataset. Using saved orbital data.'});
    try{localStorage.setItem('northbound-orbits',JSON.stringify(chosen.bundle))}catch{}
    setFetching(false);
  }
  useEffect(()=>{
    const t=Date.now();setNow(t);setStart(Math.floor(t/60000)*60000);
    try{const s=JSON.parse(localStorage.getItem('northbound-station')||'null');if(s&&Number.isFinite(s.lat)&&s.lat>=-90&&s.lat<=90&&Number.isFinite(s.lon)&&s.lon>=-180&&s.lon<=180&&Number.isFinite(s.height)&&s.height>=-500&&s.height<=9000)setStation({...s,locator:typeof s.locator==='string'?s.locator:undefined});}catch{}
    setEditing(true);
    void load();const clock=setInterval(()=>{const t=Date.now();setNow(t);setStart(Math.floor(t/60000)*60000)},15000),refresh=setInterval(()=>void load(),3600000);
    const resume=()=>{if(document.visibilityState==='visible'&&Date.now()-lastRefresh.current>=3600000)void load()};document.addEventListener('visibilitychange',resume);
    return()=>{clearInterval(clock);clearInterval(refresh);document.removeEventListener('visibilitychange',resume)};
  },[]);
  useEffect(()=>{if(!editing&&!sourceOpen&&!orbitSatId)return;const previous=document.activeElement as HTMLElement;const root=modalRef.current;const controls=()=>Array.from(root?.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,summary')??[]);controls()[0]?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(stationConfirmed)setEditing(false);setSourceOpen(false);setOrbitSatId(null)}if(e.key==='Tab'){const c=controls(),first=c[0],last=c[c.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus()}},[editing,sourceOpen,orbitSatId,stationConfirmed]);
  const rawResult=useMemo(()=>start?predict(elements,catalog,station,start,hours):{passes:[],unavailable:[]},[elements,station,start,hours]);
  const result=useMemo(()=>({...rawResult,passes:localizePasses(rawResult.passes,station,hours)}),[rawResult,station,hours]);
  const reachable=useMemo(()=>{
    const localized=new Map(result.passes.map(p=>[p.sat.id,p.sat]));
    return reachableCatalog(catalog,result.passes,now,filters.elevation).map(s=>localized.get(s.id)??s);
  },[result.passes,now,filters.elevation]);
  const availableCatalog=useMemo(()=>reachable.filter(s=>showUncertain||!uncertain(s)),[reachable,showUncertain]);
  useEffect(()=>{
    if(!start)return; // No passes are calculated yet; keep the default filters.
    setFilters(f=>{
      const uplink=f.uplink==='all'||availableCatalog.some(s=>band(s.up)===f.uplink)?f.uplink:'all';
      const downlink=f.downlink==='all'||availableCatalog.some(s=>band(s.down)===f.downlink)?f.downlink:'all';
      const mode=f.mode==='all'||availableCatalog.some(s=>s.mode===f.mode)?f.mode:'all';
      return uplink===f.uplink&&downlink===f.downlink&&mode===f.mode?f:{...f,uplink,downlink,mode};
    });
    if(orbitSatId&&!availableCatalog.some(s=>s.id===orbitSatId))setOrbitSatId(null);
  },[availableCatalog,orbitSatId,start]);
  const options=useMemo(()=>availableCatalog.filter(s=>(filters.status==='all'||s.access===filters.status)&&(filters.uplink==='all'||band(s.up)===filters.uplink)&&(filters.downlink==='all'||band(s.down)===filters.downlink)&&(filters.mode==='all'||s.mode===filters.mode)),[availableCatalog,filters.status,filters.uplink,filters.downlink,filters.mode]);
  const activeFilters=options.some(s=>s.id===filters.satellite)?filters:{...filters,satellite:'all'};
  useEffect(()=>{if(filters.satellite!=='all'&&!options.some(s=>s.id===filters.satellite))setFilters(f=>({...f,satellite:'all'}));},[options,filters.satellite]);
  const included=useMemo(()=>result.passes.filter(p=>availableCatalog.some(s=>s.id===p.sat.id)),[result.passes,availableCatalog]);
  const passes=useMemo(()=>filterPasses(included,activeFilters,now),[included,activeFilters,now]);
  useEffect(()=>setVisibleCount(12),[filters,hours,showUncertain,station]);
  const picked=passes.find(p=>p.key===selected)??passes[0];
  const next=passes[0];
  const high=passes.filter(p=>p.peak.el>=30).length;
  const publicationAge=Math.max(0,(now-Date.parse(data.fetchedAt))/86400000);
  const oldest=elements.filter(e=>availableCatalog.some(s=>s.norad===e.norad)).reduce((m,e)=>Math.max(m,(now-e.epoch)/86400000),0);
  const filteredCatalog=options.filter(s=>activeFilters.satellite==='all'||s.id===activeFilters.satellite);
  const countWork=passes.filter(p=>p.access==='work').length,countListen=passes.length-countWork;
  function reset(){setFilters(defaults);setShowUncertain(false);}
  function saveStation(s:Station){setStation(s);setStationConfirmed(true);setSelected('');setMobileDetail(false);setOrbitSatId(null);try{localStorage.setItem('northbound-station',JSON.stringify(s))}catch{}setEditing(false);}
  const orbitSat=availableCatalog.find(s=>s.id===orbitSatId);
  return <div className="app-shell">
    <header className="header"><a href={import.meta.env.BASE_URL} className="brand" aria-label="Northbound home"><span className="brand-icon"><svg viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="13"/><circle cx="18" cy="18" r="6"/><path d="M18 18L29 7"/><circle cx="29" cy="7" r="2" fill="currentColor"/></svg></span><span>NORTHBOUND<small>AMATEUR SATELLITE PLANNER</small></span></a><div className="header-right"><span className="private"><Radio size={12}/> FM satellite planner</span><a className="callsign" href="https://github.com/TF5NN/sat-track" target="_blank" rel="noreferrer">TF5NN ↗</a></div></header>
    <main>
      <section className="intro"><div><div className="eyebrow location"><span className="live-dot"/> OBSERVER STATION <span>/</span> {(station.locator??grid(station)).toUpperCase()}</div><h1>Your next window<br className="mobile-break"/> to space<span>.</span></h1><p>Point the Yagi. Find the signal. Make the contact.</p></div><button className="station-summary" onClick={()=>setEditing(true)}><MapPin size={17}/><span><strong>{Math.abs(station.lat).toFixed(4)}° {station.lat<0?'S':'N'} · {Math.abs(station.lon).toFixed(4)}° {station.lon<0?'W':'E'}</strong><small>2 m / 70 cm Yagi · FM half duplex</small></span><Settings2 size={15}/></button></section>
      <div className="radio-compatibility"><Radio size={15}/><p><strong>Designed for the VGC VR-N76.</strong> Pass, frequency and Doppler guidance applies to all FM half-duplex 2 m / 70 cm radios. <span>APRS needs packet/TNC support; SSTV images need an audio decoder.</span></p></div>
      <div className="summary-strip"><div className="summary-first"><span className="summary-icon"><SatelliteIcon size={20}/></span><div><span className="eyebrow">NEXT MATCHING PASS</span><strong>{next?<>{next.sat.name} <span className="summary-time">{time(next.aos.time)} UTC</span></>:'Scanning the horizon'}</strong><small>{next?`${until(next.aos.time,now)} · ${next.peak.el.toFixed(0)}° peak · ${next.sat.mode}`:'Select filters and refresh orbital data'}</small></div></div><div className="summary-stat"><strong>{passes.length}<span>passes</span></strong><small>Next {hours} hours · your filters</small></div><div className="summary-stat"><strong>{high}<span>above 30°</span></strong><small>More sky, less obstruction</small></div><div className="summary-clock"><Clock3 size={15}/><div><strong>{now?time(now,true):'--:--:--'} <span>UTC</span></strong><small>All pass times shown in UTC</small></div></div></div>
      <div className="workspace-bar"><nav aria-label="Planner views"><button className={tab==='passes'?'active':''} onClick={()=>setTab('passes')}><Activity size={15}/>Pass planner</button><button className={tab==='guide'?'active':''} onClick={()=>setTab('guide')}><SatelliteIcon size={15}/>Satellite guide</button></nav><div className="data-tools"><span className={`data-state ${data.kind!=='published'?'muted':''}`}><span className="live-dot"/>{data.kind==='published'?'Daily orbital data':data.kind==='cached'?'Cached orbital data':'Bundled orbital data'}</span><button className="icon-button" disabled={fetching} onClick={()=>void load()} aria-label="Refresh orbital data"><RefreshCw size={15} className={fetching?'spin':''}/></button></div></div>
      {now>0&&builtAt-now>300000&&<div className="data-warning" role="alert"><Info size={15}/><span><strong>Your device clock looks wrong.</strong> It is set earlier than this app’s orbital data was published ({date(builtAt)} {time(builtAt)} UTC). Pass times will be wrong or missing until the date and time are corrected.</span></div>}
      {(data.error||oldest>3||publicationAge>2)&&<div className="data-warning" role="status"><Info size={15}/><span>{data.error} {publicationAge>2?`The dataset was last checked ${publicationAge.toFixed(1)} days ago. `:''}{oldest>3?`Some orbit epochs are ${oldest.toFixed(1)} days old. Elements older than 7 days are excluded.`:''}</span><button onClick={()=>void load()} disabled={fetching}>Retry refresh</button></div>}
      <div className={`workspace ${tab==='guide'?'guide-layout':''}`}>
        <aside className="filters" aria-label="Pass filters"><div className="filter-heading"><h2><SlidersHorizontal size={15}/> Filter passes</h2><button onClick={reset}>Reset</button></div>
          <fieldset className="status-filter"><legend>STATION CAPABILITY</legend><div className="status-buttons">{[['all','All'],['work','Work'],['listen','Listen']].map(([value,label])=><button key={value} className={filters.status===value?'selected':''} onClick={()=>update('status',value)} aria-pressed={filters.status===value}>{label}</button>)}</div><p>Work = compatible with this station. Activation is checked separately.</p></fieldset>
          <label className="field">SATELLITE<select aria-label="Satellite" value={activeFilters.satellite} onChange={e=>update('satellite',e.target.value)}><option value="all">All reachable satellites</option>{options.map(s=><option key={s.id} value={s.id}>{s.name} · {s.mode}{s.id==='rs95-sstv'?' images':''}</option>)}</select></label>
          <div className="band-fields"><label className="field">UPLINK<select aria-label="Uplink band" value={filters.uplink} onChange={e=>update('uplink',e.target.value)}><option value="all">Any band</option>{['2m','70cm','none'].filter(b=>availableCatalog.some(s=>band(s.up)===b)).map(b=><option key={b} value={b}>{b==='none'?'No uplink':b==='2m'?'2 m':'70 cm'}</option>)}</select></label><label className="field">DOWNLINK<select aria-label="Downlink band" value={filters.downlink} onChange={e=>update('downlink',e.target.value)}><option value="all">Any band</option>{['2m','70cm'].filter(b=>availableCatalog.some(s=>band(s.down)===b)).map(b=><option key={b} value={b}>{b==='2m'?'2 m':'70 cm'}</option>)}</select></label></div>
          <label className="field">MODE<select aria-label="Mode" value={filters.mode} onChange={e=>update('mode',e.target.value)}><option value="all">All modes</option>{['FM voice','APRS','SSTV'].filter(m=>availableCatalog.some(s=>s.mode===m)).map(m=><option key={m}>{m}</option>)}</select></label>
          <label className="field elevation-label">MINIMUM PEAK <strong>{filters.elevation}°</strong><input type="range" min="0" max="90" step="5" value={filters.elevation} aria-label="Minimum peak elevation" onChange={e=>update('elevation',Number(e.target.value))}/><span className="range-labels"><span>0°</span><span>45°</span><span>90°</span></span></label>
          <label className="field">LOOK AHEAD<select aria-label="Look ahead" value={hours} onChange={e=>setHours(Number(e.target.value))}><option value="24">Next 24 hours</option><option value="48">Next 48 hours</option><option value="72">Next 72 hours</option></select></label>
          <label className="check-field"><input type="checkbox" checked={showUncertain} onChange={e=>setShowUncertain(e.target.checked)}/><span>Include uncertain repeaters<small>Only those reachable from your station</small></span></label>
          <div className="station-note"><Radio size={17}/><h3>One radio. Half duplex.</h3><p>Listen before calling. You can’t hear your own downlink while transmitting. Keep calls short and rotate the Yagi for the clearest signal.</p><a href={sources.radio} target="_blank" rel="noreferrer">VR-N76 operating guide <ArrowUpRight size={12}/></a></div>
        </aside>
        {tab==='passes'?<>
          <section className="pass-list" aria-label="Upcoming passes"><div className="list-heading"><div><h2>Upcoming passes <span>{passes.length}</span></h2><p>{now?`${date(now)}–${date(start+hours*3600000)}`:'Calculating…'} <span>·</span> All times UTC</p></div><span className="list-legend"><i/> {countWork} work <i className="rx"/> {countListen} listen</span></div>
            <div className="list-hint"><Info size={13}/><span>Only reachable services in your next {hours} hours at {filters.elevation}°+ peak. Activation is not guaranteed.{activeFilters.mode==='FM voice'?' Showing FM voice satellites you can talk through; set Mode to All modes for APRS and SSTV.':''}</span></div>
            {fetching&&!elements.length?<div className="empty"><RefreshCw className="spin" size={24}/><h3>Finding your next pass</h3><p>Fetching orbital elements from AMSAT.</p></div>:passes.length===0?<div className="empty"><SatelliteIcon size={30}/><h3>No passes match these filters</h3><p>Try a lower elevation, a longer look ahead or another location. Check the station coordinates if the sky seems unexpectedly quiet.</p><button className="button" onClick={reset}>Reset filters</button></div>:<div>{passes.slice(0,visibleCount).map((p,i)=><div key={p.key}>{(i===0||date(p.aos.time)!==date(passes[i-1].aos.time))&&<div className="day-heading">{date(p.aos.time)} <span>{new Date(p.aos.time).toLocaleDateString('en-GB',{weekday:'long',timeZone:'UTC'})}</span></div>}<button className={`pass-row ${picked?.key===p.key?'chosen':''}`} onClick={()=>{setSelected(p.key);setMobileDetail(true)}} aria-pressed={picked?.key===p.key} aria-label={`View ${p.sat.name} ${p.sat.mode} pass at ${time(p.aos.time)} UTC, peak ${p.peak.el.toFixed(0)} degrees`}>
              <div className="pass-time"><strong>{time(p.aos.time)}</strong><span>{time(p.los.time)}</span></div><div className="pass-name"><div><h3>{p.sat.name}</h3><Badge access={p.access} small/></div><p>{p.sat.mode} <span>·</span> {band(p.sat.up)==='none'?'RX':band(p.sat.up)+' →'} {band(p.sat.down)}</p><small>{p.sat.daylight?(p.windows.length?'Sunlit window available':'Eclipse · no uplink'):p.sat.event?'Scheduled SSTV event':p.sat.condition}</small></div><div className="pass-geometry"><Arc pass={p}/><strong>{p.peak.el.toFixed(0)}°</strong><span>{compass(p.aos.az)} → {compass(p.los.az)}</span></div><ChevronRight size={16} className="row-chevron"/>
            </button></div>)}</div>}
            {passes.length>visibleCount&&<button className="show-more" onClick={()=>setVisibleCount(n=>n+12)}>Show next {Math.min(12,passes.length-visibleCount)} passes <span>{passes.length-visibleCount} more in this window</span><ChevronRight size={14}/></button>}
            <div className="list-foot"><span><span className="filled-dot"/> Rise</span><span><span className="hollow-dot"/> Set</span><p>True bearings · clear 0° horizon · no terrain mask</p></div>
            {result.unavailable.length>0&&<p className="fine missing">{result.unavailable.length} spacecraft excluded: missing, invalid, future-dated or older-than-7-day elements. <button onClick={()=>setSourceOpen(true)}>Data details</button></p>}
          </section>
          <div className={`detail-container ${mobileDetail?'mobile-open':''}`}>{picked?<Detail pass={picked} station={station} now={now} onClose={()=>setMobileDetail(false)} onOrbit={()=>setOrbitSatId(picked.sat.id)}/>:<aside className="detail detail-empty"><SatelliteIcon size={30}/><h3>A pass, at a glance.</h3><p>Select a matching pass to see its sky path, frequencies and tuning guide.</p></aside>}</div>
        </>:<section className="guide" aria-label="Satellite guide"><div className="list-heading"><div><h2>Your station’s satellite guide</h2><p>Reachable from your station in the next {hours} hours · {filters.elevation}°+ peak. Verify activation before transmitting.</p></div><span className="guide-count">{filteredCatalog.length} services</span></div>
          {(['work','listen'] as const).map(access=><div className="guide-group" key={access}><h3>{access==='work'?<Radio size={16}/>:<Headphones size={16}/>} {access==='work'?'Satellites you can work':'Satellites worth listening to'}</h3>{filteredCatalog.filter(s=>s.access===access).map(s=><article className="guide-card" key={s.id}><div className="guide-card-top"><div><h4>{s.name} <span>{s.mode}</span></h4><p>{s.subtitle} · NORAD {s.norad}</p></div><div className="guide-card-actions"><button onClick={()=>setOrbitSatId(s.id)} aria-label={`Orbital data for ${s.name} ${s.mode}`}>Orbit data <SatelliteIcon size={13}/></button><button onClick={()=>{setFilters({...defaults,mode:s.mode,elevation:filters.elevation,satellite:s.id});setTab('passes')}}>View passes <ArrowRight size={13}/></button></div></div><div className="guide-frequencies"><span>RX <strong>{frequency(s.down)}</strong></span><span>TX <strong>{frequency(s.up)}</strong></span><span>Tone <strong>{s.tone}</strong></span></div><p><strong>{s.condition}.</strong> {s.notes}</p><a href={s.source} target="_blank" rel="noreferrer">Source <ArrowUpRight size={11}/></a></article>)}{!filteredCatalog.some(s=>s.access===access)&&<p className="fine">No services in this category match the filters.</p>}</div>)}
          <div className="excluded"><h3>Receive and operate with your FM radio</h3><p>APRS entries require a compatible satellite profile and path. SSTV needs a phone or computer audio decoder to turn the signal into a picture. Only services with a predicted usable window from this station appear here, subject to your filters. A clear geometric path does not confirm transmitter activation or account for local terrain.</p></div>
        </section>}
      </div>
      <footer><span>TF5NN <span className="footer-slash">/</span> YOUR STATION. YOUR SKY.</span><button onClick={()=>setSourceOpen(true)}>Sources & prediction notes <ArrowUpRight size={12}/></button><span className="footer-review">Frequencies reviewed {date(Date.parse(reviewed))} 2026</span></footer>
    </main>
    {editing&&<StationDialog station={station} dialogRef={modalRef} opening={!stationConfirmed} onSave={saveStation} onClose={()=>{if(stationConfirmed)setEditing(false)}}/>}
    {orbitSat&&<OrbitDialog sat={orbitSat} element={elements.find(e=>e.norad===orbitSat.norad)} now={now} fetching={fetching} data={data} dialogRef={modalRef} onRefresh={()=>void load()} onClose={()=>setOrbitSatId(null)}/>}
    {sourceOpen&&<div className="modal-backdrop" onClick={()=>setSourceOpen(false)}><section ref={modalRef} className="modal source-modal" role="dialog" aria-modal="true" aria-labelledby="sources-title" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" aria-label="Close sources" onClick={()=>setSourceOpen(false)}><X size={18}/></button><h2 id="sources-title">Sources & prediction notes</h2><p>Frequencies and operating restrictions reviewed 10 November 2026. Activation labels are a dated review, not live reception reports.</p><ul className="sources-list">{[['AMSAT orbital elements',sources.tle],['SatNOGS supplementary orbital elements',sources.satnogs],['APRS satellite frequencies',sources.packet],['FM frequencies & restrictions',sources.fm],['Live operator reception reports',sources.status],['ARISS station status',sources.iss],['Dated ISS SSTV event announcements',sources.sstv],['SSTV satellite frequencies',sources.images],['SONATE-2 operator / schedule',sources.sonate],['HT manual · satellite orbital entry',htManual],['VGC radio / HT app guide',sources.radio],['VGC APRS / satellite path setup',sources.radioAprs]].map(([label,url])=><li key={url}><a href={url} target="_blank" rel="noreferrer">{label}<ArrowUpRight size={13}/></a></li>)}</ul><h3>Orbital data</h3><p>{data.kind==='published'?'Published '+data.provider+' dataset':data.kind==='cached'?'Last successful browser cache':'Bundled orbital dataset'}{data.fetchedAt?` · retrieved ${date(Date.parse(data.fetchedAt))} ${time(Date.parse(data.fetchedAt))} UTC`:''}. Orbital elements are downloaded and validated centrally once a day at 03:17 UTC, using AMSAT and SatNOGS, with CelesTrak as a fallback. This app checks the shared published file on opening, hourly and when returning after an hour away. Refresh checks that file; it does not contact the satellite-data providers. The orbital-data panel uses the same elements as the predictions. If an update fails, the last good dataset is retained. Frequencies, tones and operating schedules are a separate reviewed catalogue, not live reception reports. Missing or invalid TLEs and elements older than 7 days are excluded; an element-age notice starts at 3 days, and a dataset-update notice after 2 days.</p>{result.unavailable.length>0&&<p>Unavailable NORAD IDs: {result.unavailable.join(', ')}.</p>}<h3>Which satellites appear</h3><p>The worldwide catalogue contains FM voice, 1200-baud AFSK packet and FM SSTV services suitable for a 2 m / 70 cm FM radio. The guide and satellite choices use the same calculated passes as the planner: at least one remaining modeled operating window in the selected 24, 48 or 72 hours, at your minimum peak elevation. Missing or stale orbits, unreachable spacecraft, expired events and known service blackouts do not appear as choices. Other filters narrow that list further. Unknown activation schedules remain explicitly conditional; this is not a live receiver or an exhaustive satellite database.</p><h3>What the times mean</h3><p>SGP4 propagation with satellite.js, WGS-84 observer coordinates. AOS and LOS cross an unobstructed 0° horizon; the elevation filter selects peak elevation, not a different rise/set threshold. Bearings are true north. Terrain, refraction and obstructions are not modeled. Times are predictions, displayed to seconds for tuning; use fresh elements and arrive early.</p><p>AO-91 sunlight windows exclude the modeled Earth shadow with a conservative penumbra margin; transitions resolve to 5 seconds. Transmitter schedules are only applied where a dated window is known. Unscheduled SSTV passes do not promise images.</p><p>ISS SSTV: 9 Nov 17:45–16 Nov 08:15 UTC, Robot 36 on 437.550 MHz. This newer dated announcement takes precedence over general tables. ISS APRS is suppressed during that window; later changes require checking ARISS.</p><p>Maidenhead entry accepts 4, 6 or 8 characters and uses the grid-cell centre. No GPS permission, analytics or automatic radio control. Each opening asks you to confirm your remembered station, or the Reykjavík default. Station coordinates stay in this browser; requests for the shared data file do not include them. No account or backend is required.</p><button className="button" onClick={()=>setSourceOpen(false)}>Back to planner</button></section></div>}
  </div>
}
