export type Satellite = {
  id: string; name: string; subtitle: string; norad: number;
  access: 'work' | 'listen'; mode: 'FM voice' | 'APRS' | 'SSTV';
  up: number | null; down: number; tone: string; condition: string;
  notes: string; source: string; daylight?: boolean; uncertain?: boolean;
  event?: { start: string; end: string }; blackout?: { start: string; end: string };
};
export const reviewed = '2026-11-10';
export const sources = {
  fm: 'https://www.amsat.org/live-fm-satellites/',
  status: 'https://status.amsat.org/',
  iss: 'https://www.ariss.org/current-status-of-iss-stations.html',
  sstv: 'https://www.ariss.org/upcoming-sstv-events.html',
  images: 'https://www.amsat.org/image-transmitting-satellites/',
  packet: 'https://www.amsat.org/live-digipeater-satellites/',
  sonate: 'https://www.informatik.uni-wuerzburg.de/raumfahrttechnik/projekte/aktive/sonate-2/information-fuer-funkamateure/',
  tle: 'https://www.amsat.org/tle/current/nasabare.txt',
  satnogs: 'https://db.satnogs.org/api/tle/',
  radioAprs: 'https://www.verotelecom.com/Topics/VR-N76-APRS-Setup-Guide-Mastering-SSID-Path-Smart-Beaconing-tp30147.html',
  radio: 'https://www.verotelecom.com/Topics/How-to-Track-Satellites-with-VGC-VR-N76-VR-N7600-A-Complete-SATCOM-Guide-tp30129.html'
};
const issEvent = { start: '2026-11-09T17:45:00Z', end: '2026-11-16T08:15:00Z' };
export const catalog: Satellite[] = [
  {id:'so50',name:'SO-50',subtitle:'SaudiSat-1C',norad:27607,access:'work',mode:'FM voice',up:145.850,down:436.795,tone:'67.0 Hz',condition:'FM repeater · check reports',notes:'If the timer is off, arm with 74.4 Hz for 2 seconds; then use 67 Hz. Timer lasts 10 minutes.',source:sources.fm},
  {id:'ao123',name:'AO-123',subtitle:'ASRTU-1 / RS64S',norad:61781,access:'work',mode:'FM voice',up:145.850,down:435.400,tone:'67.0 Hz',condition:'FM repeater · check reports',notes:'The uplink is shared with other FM satellites. Point at the intended spacecraft and confirm its downlink before calling.',source:sources.fm},
  {id:'iss-fm',name:'ISS',subtitle:'Columbus voice repeater',norad:25544,access:'work',mode:'FM voice',up:145.990,down:437.800,tone:'67.0 Hz',condition:'ARISS reports repeater mode',notes:'EVA, school contacts and other operations can interrupt the repeater. Check ARISS before a pass.',source:sources.iss},
  {id:'io86-fm',name:'IO-86',subtitle:'LAPAN-A2 · voice repeater',norad:40931,access:'work',mode:'FM voice',up:145.880,down:435.880,tone:'88.5 Hz',condition:'Scheduled · check operator activation',notes:'Near-equatorial orbit. Use the current operator schedule and listen for the downlink before calling.',source:sources.fm},
  {id:'ao91',name:'AO-91',subtitle:'RadFxSat / Fox-1B',norad:43017,access:'work',mode:'FM voice',up:435.250,down:145.960,tone:'None (carrier operated)',condition:'Sunlight only · degraded battery',notes:'No uplink tone required in the present carrier-operated mode. Use only the sunlit window shown; expect dropouts.',daylight:true,source:'https://www.amsat.org/two-way-satellites/ao-91/'},
  {id:'lilac',name:'LilacSat-2',subtitle:'CAS-3H',norad:40908,access:'work',mode:'FM voice',up:144.350,down:437.200,tone:'None',condition:'Unscheduled · listen first',notes:'Repeater activation is irregular. Telemetry on the downlink does not mean the voice repeater is enabled.',source:sources.fm},
  {id:'po101',name:'PO-101',subtitle:'Diwata-2',norad:43678,access:'work',mode:'FM voice',up:437.500,down:145.900,tone:'141.3 Hz',condition:'Uncertain · battery / schedule',notes:'AMSAT flags deteriorating operation. Only try when the operator announces activation and the downlink is heard.',source:sources.fm},
  {id:'rs95-fm',name:'RS95S',subtitle:'QMR-KWT-2 · repeater',norad:67291,access:'work',mode:'FM voice',up:145.920,down:436.950,tone:'67.0 Hz',condition:'Testing · activation required',notes:'Experimental FM access during announced tests. Listen first; the same downlink also carries SSTV.',source:sources.fm},
  ...[[1,63217],[2,63219],[3,63218],[4,63213],[5,63214],[6,63215],[7,63238],[8,63239],[9,63237]].map(([n,norad]): Satellite=>({id:`tevel${n}`,name:`TEVEL2-${n}`,subtitle:'TEVEL2 constellation',norad,access:'work',mode:'FM voice',up:145.970,down:436.400,tone:'None',condition:'Unreliable · software resets',notes:'Owner reports software resets and unreliable repeater operation. Confirm voice activity; the BPSK beacon is not proof of an open repeater.',source:'https://www.amsat.org/two-way-satellites/tevel2-constellation/'})),
  {id:'sonate-aprs',name:'SONATE-2',subtitle:'DP0SNX · packet digipeater',norad:59112,access:'work',mode:'APRS',up:145.825,down:145.825,tone:'None',condition:'APRS setup required · check schedule',notes:'1200 baud AFSK. Set a satellite APRS profile and path DP0SNX in the HT app; verify the radio accepts it. Greeting every 2 minutes when active. Paused for SSTV.',source:sources.sonate},
  {id:'io86-aprs',name:'IO-86',subtitle:'LAPAN-A2 · YB0X packet digipeater',norad:40931,access:'work',mode:'APRS',up:145.825,down:145.825,tone:'None',condition:'Scheduled · APRS setup required',notes:'1200 baud AFSK. Check the schedule and configure the satellite path YB0X (ARISS is also listed). Requires a compatible packet profile; ordinary FM audio alone cannot send APRS.',source:sources.packet},
  {id:'no44',name:'NO-44',subtitle:'PCsat · packet reception',norad:26931,access:'listen',mode:'APRS',up:null,down:145.825,tone:'None',condition:'Receive only · recovery restrictions',notes:'1200 baud AFSK: use the radio’s packet decoder or an external audio decoder. The operator prohibits digipeating via W3ADO-1 in recovery mode; this planner therefore offers reception only.',source:'https://www.aprs.org/pcsat.html'},
  {id:'iss-aprs',name:'ISS',subtitle:'RS0ISS · packet digipeater',norad:25544,access:'work',mode:'APRS',up:437.825,down:437.825,tone:'None',condition:'Testing · APRS setup required',blackout:issEvent,notes:'ARISS currently lists 437.825 MHz for APRS, superseding the usual 145.825 MHz. Verify path ARISS and 1200 baud AFSK support in the HT app. Unavailable during the scheduled SSTV window.',source:sources.iss},
  {id:'iss-sstv',name:'ISS',subtitle:'Series 35 · Space Memories',norad:25544,access:'listen',mode:'SSTV',up:null,down:437.550,tone:'None',condition:'Scheduled · 9–16 Nov',event:issEvent,notes:'Robot 36: 36 seconds of image, then 2 minutes off. Feed or record FM audio into an SSTV decoder. This dated event overrides older 145.800 MHz / PD120 listings.',source:sources.sstv},
  {id:'sonate-sstv',name:'SONATE-2',subtitle:'Camera images · Martin M1',norad:59112,access:'listen',mode:'SSTV',up:null,down:145.880,tone:'None',condition:'Event only · no current window verified',notes:'500 mW SSTV in Martin M1. Decode the FM audio on a phone or computer. Check the operator’s schedule; a geometric pass is not an announced transmission.',source:sources.sonate},
  {id:'rs38',name:'RS38S',subtitle:'VIZARD-meteo · Robot 36',norad:57189,access:'listen',mode:'SSTV',up:null,down:437.825,tone:'None',condition:'Intermittent · check schedule',notes:'Robot 36 images during activations. Record FM audio for decoding. Other spacecraft can share this channel; identify this one by pass timing and pointing.',source:sources.images},
  {id:'rs95-sstv',name:'RS95S',subtitle:'QMR-KWT-2 · Robot 36',norad:67291,access:'listen',mode:'SSTV',up:null,down:436.950,tone:'None',condition:'Event only · check schedule',notes:'Robot 36 SSTV during announced activations; use an audio decoder. Repeater and image activity share this downlink.',source:sources.images},
  {id:'io86-sstv',name:'IO-86',subtitle:'LAPAN-A2 · PD50 images',norad:40931,access:'listen',mode:'SSTV',up:null,down:435.880,tone:'None',condition:'Scheduled · check image activation',notes:'PD50 SSTV over FM. Feed or record audio into an SSTV decoder. Image and voice operation share this downlink; consult the operator schedule.',source:sources.images},
  ...([
    ['hc1px','HC1PX','GALAPAGOS-UTE-SWSU',67279,437.050,'Robot 36'],
    ['rs18','RS18S','SakhaCube-Cholbon',67290,437.350,'Robot 36'],
    ['rs27','RS27S','UTMN-2',57203,436.125,'Robot 36 / 72'],
    ['rs40','RS40S','UmKA-1',57172,437.625,'Robot 36'],
    ['rs57','RS57S','Monitor-4',57182,436.080,'Robot 36'],
    ['rs58','RS58S','Monitor-3',57180,435.290,'Robot 36'],
    ['rs83-sstv','RS83S','Lobachevsky',67284,436.320,'SSTV'],
    ['jamx-sstv','JAMX01','JAMX01',100470,435.175,'Robot 36']
  ] as const).map(([id,name,subtitle,norad,down,format]):Satellite=>({id,name,subtitle:`${subtitle} · ${format}`,norad,down,access:'listen',mode:'SSTV',up:null,tone:'None',condition:'Intermittent · check image schedule',notes:`Receive FM audio with an SSTV decoder; ${format==='SSTV'?'use the mode announced for the event':`select ${format}`}. Images are sent during activations, not every pass. Digital telemetry on the same channel is not an SSTV image.`,source:sources.images})),
  {id:'rs83-fm',name:'RS83S',subtitle:'Lobachevsky · voice repeater',norad:67284,access:'work',mode:'FM voice',up:435.500,down:145.910,tone:'67.0 Hz',uncertain:true,condition:'Experimental · verify activation',notes:'Operator lists a 500 mW cross-band FM repeater. Keep transmissions short to avoid overheating; listen for voice activity and check operator reports before trying.',source:'https://spacepi.space/satellites/lobachevskij/'}
];
export const uncertain = (s: Satellite) => !!s.uncertain || s.id.startsWith('tevel') || ['po101','rs95-fm','lilac'].includes(s.id);
export const band = (f: number | null) => f === null ? 'none' : f < 200 ? '2m' : '70cm';
export const frequency = (f: number | null) => f === null ? '—' : f.toFixed(3);
