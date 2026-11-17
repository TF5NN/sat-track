import type { Satellite } from './catalog';

// Satellites that need more than an FM handheld: linear transponders (SSB/CW), data
// digipeaters, telemetry beacons and picture downlinks. They are not shown unless the visitor
// asks for all satellites.
//
// Unlike catalog.ts, nothing here is typed in by hand except the link itself: each line says
// which AMSAT status entry corresponds to which entry in the SatNOGS database. The daily job
// (scripts/sync-orbits.ts) reads the frequencies, mode and passband for those entries from
// SatNOGS and saves them with the orbital data. An entry SatNOGS marks as no longer active
// drops out by itself. docs/satellite-links.json records how each link was checked.
export type ExtraLink = {
  id: string;
  amsat: string; // name on AMSAT's status page
  name: string;
  label: string; // AMSAT's own tag for the service, such as "V/u" or "UHF Digi"
  mode: Satellite['mode'];
  norad: number;
  satnogs: string; // uuid of the SatNOGS transmitter entry
  tone?: string;
};
export const extraLinks: ExtraLink[] = [
  {
    id: 'x-ao-123-ssdv',
    amsat: 'AO-123_[SSDV]',
    name: 'AO-123',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 61781,
    satnogs: 'GoQruJ8i7g5kSoHpvkxAGh',
  },
  {
    id: 'x-ao-7-u-v',
    amsat: 'AO-7_[U/v]',
    name: 'AO-7',
    label: 'U/v',
    mode: 'Linear SSB/CW',
    norad: 7530,
    satnogs: 'uLfAhJaZJUWmA9Sik8yQ2m',
  },
  {
    id: 'x-ao-73-u-v',
    amsat: 'AO-73_[U/v]',
    name: 'AO-73',
    label: 'U/v',
    mode: 'Linear SSB/CW',
    norad: 39444,
    satnogs: 'kjb3TFADq77qj2AFSzxHCV',
  },
  {
    id: 'x-cas-2t-tlm',
    amsat: 'CAS-2T_[TLM]',
    name: 'CAS-2T',
    label: 'TLM',
    mode: 'Telemetry',
    norad: 41847,
    satnogs: 'M5SqudRyz3bQgGGjt5xoWm',
  },
  {
    id: 'x-crocube-uhf-digi',
    amsat: 'CroCube_[UHF_Digi]',
    name: 'CroCube',
    label: 'UHF Digi',
    mode: 'Digipeater',
    norad: 62394,
    satnogs: 'Uuo2RJjpxDmrpshXqrtXnK',
  },
  {
    id: 'x-fo-29-v-u',
    amsat: 'FO-29_[V/u]',
    name: 'FO-29',
    label: 'V/u',
    mode: 'Linear SSB/CW',
    norad: 24278,
    satnogs: 't2ffeMh8FNf979UMF7kGaV',
  },
  {
    id: 'x-foresail-1p-uhf-digi',
    amsat: 'Foresail-1p_[UHF_Digi]',
    name: 'Foresail-1p',
    label: 'UHF Digi',
    mode: 'Digipeater',
    norad: 66778,
    satnogs: 'GHzspbyrPdBtZH2BLi37n9',
  },
  {
    id: 'x-grbbeta-uhf-digi',
    amsat: 'GRBBeta_[UHF_Digi]',
    name: 'GRBBeta',
    label: 'UHF Digi',
    mode: 'Digipeater',
    norad: 60237,
    satnogs: 'Vyh4sA2BYQSUm6Lo2yigpV',
  },
  {
    id: 'x-grbbeta-vhf-digi',
    amsat: 'GRBBeta_[VHF_Digi]',
    name: 'GRBBeta',
    label: 'VHF Digi',
    mode: 'Digipeater',
    norad: 60237,
    satnogs: 'hpiPBMQVdd4K6ssBPe5M85',
  },
  {
    id: 'x-io-86-ssdv',
    amsat: 'IO-86_[SSDV]',
    name: 'IO-86',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 40931,
    satnogs: '7gto5oY8jrhSnpr6cpdoFK',
    tone: '88.5 Hz',
  },
  {
    id: 'x-knacksat-2-vhf-digi',
    amsat: 'KNACKSAT-2_[VHF_Digi]',
    name: 'KNACKSAT-2',
    label: 'VHF Digi',
    mode: 'Digipeater',
    norad: 67683,
    satnogs: 'JR28wAEjmpuDQ4FrPWAiwf',
  },
  {
    id: 'x-kostka-uhf-digi',
    amsat: 'KOSTKA_[UHF_Digi]',
    name: 'KOSTKA',
    label: 'UHF Digi',
    mode: 'Digipeater',
    norad: 69935,
    satnogs: 'DQ7Fk97phKUaue9dra9pHQ',
  },
  {
    id: 'x-lasarsat-uhf-digi',
    amsat: 'LASARsat_[UHF_Digi]',
    name: 'LASARsat',
    label: 'UHF Digi',
    mode: 'Digipeater',
    norad: 62391,
    satnogs: 'n7SVNb7aLcE5J4GXcWNvcD',
  },
  {
    id: 'x-rs-44-v-u',
    amsat: 'RS-44_[V/u]',
    name: 'RS-44',
    label: 'V/u',
    mode: 'Linear SSB/CW',
    norad: 44909,
    satnogs: '89NTmbqJEuTGW36fd386Fy',
  },
  {
    id: 'x-to-108-u-v',
    amsat: 'TO-108_[U/v]',
    name: 'TO-108',
    label: 'U/v',
    mode: 'Linear SSB/CW',
    norad: 44881,
    satnogs: 'YesbsWuP5etTXXb7UAnwaB',
  },
  {
    id: 'x-uo-11-tlm',
    amsat: 'UO-11_[TLM]',
    name: 'UO-11',
    label: 'TLM',
    mode: 'Telemetry',
    norad: 14781,
    satnogs: 'aBPWui23BqUhVc62nySNuQ',
  },
  {
    id: 'x-ao-7-v-a',
    amsat: 'AO-7_[V/a]',
    name: 'AO-7',
    label: 'V/a',
    mode: 'Linear SSB/CW',
    norad: 7530,
    satnogs: 'aBrZNKzhZH4gguH8F75o86',
  },
  {
    id: 'x-jo-97-u-v',
    amsat: 'JO-97_[U/v]',
    name: 'JO-97',
    label: 'U/v',
    mode: 'Linear SSB/CW',
    norad: 43803,
    satnogs: 'Epf9JK4hvNEAYuW49JiHtB',
  },
  {
    id: 'x-rs66s-ssdv',
    amsat: 'RS66S_[SSDV]',
    name: 'RS66S',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 61772,
    satnogs: 'hFHR6LwsyKmzG7nPdKMMny',
  },
  {
    id: 'x-arica-2-uhf-digi',
    amsat: 'ARICA-2_[UHF_Digi]',
    name: 'ARICA-2',
    label: 'UHF Digi',
    mode: 'Digipeater',
    norad: 68796,
    satnogs: 'hKFwwL2VpXWYuTQ6HnHUn6',
  },
  {
    id: 'x-co-128-tlm',
    amsat: 'CO-128_[TLM]',
    name: 'CO-128',
    label: 'TLM',
    mode: 'Telemetry',
    norad: 69912,
    satnogs: '3DpNASTddtcH9zHEmZpsFK',
  },
  {
    id: 'x-marina-uhf-digi',
    amsat: 'Marina_[UHF_Digi]',
    name: 'Marina',
    label: 'UHF Digi',
    mode: 'Digipeater',
    norad: 69920,
    satnogs: 'iVmBGoXp6CrEpZuzUUgYUh',
  },
  {
    id: 'x-marina-vhf-digi',
    amsat: 'Marina_[VHF_Digi]',
    name: 'Marina',
    label: 'VHF Digi',
    mode: 'Digipeater',
    norad: 69920,
    satnogs: '5ZAjuziycSLXAq2xKYRg9B',
  },
  {
    id: 'x-fo-126-uhf-tlm',
    amsat: 'FO-126_[UHF_TLM]',
    name: 'FO-126',
    label: 'UHF TLM',
    mode: 'Telemetry',
    norad: 68795,
    satnogs: 'HGDA4HLjfNAAzxAFeq3yzk',
  },
  {
    id: 'x-rs61s-ssdv',
    amsat: 'RS61S_[SSDV]',
    name: 'RS61S',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 64881,
    satnogs: 'hBwj8ryoewn4XDny9bkN7a',
  },
  {
    id: 'x-rs90s-ssdv',
    amsat: 'RS90S_[SSDV]',
    name: 'RS90S',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 67287,
    satnogs: 'i7REYyGpZWS3hUnJa2X8ro',
  },
  {
    id: 'x-rs92s2-ssdv',
    amsat: 'RS92S2_[SSDV]',
    name: 'RS92S2',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 64890,
    satnogs: 'kDh7FGiGCRthz3d9aRvmzd',
  },
  {
    id: 'x-rs92s4-ssdv',
    amsat: 'RS92S4_[SSDV]',
    name: 'RS92S4',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 64892,
    satnogs: 'dornxtScfja7eJvXWkVDu5',
  },
  {
    id: 'x-rs92s5-ssdv',
    amsat: 'RS92S5_[SSDV]',
    name: 'RS92S5',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 64891,
    satnogs: '2PaEUBRtkAhf2baamE3yEw',
  },
  {
    id: 'x-so-127-codec2',
    amsat: 'SO-127_[CODEC2]',
    name: 'SO-127',
    label: 'CODEC2',
    mode: 'Digital',
    norad: 68446,
    satnogs: 'ks3KCobshLHvwdSgFhJUpb',
  },
  {
    id: 'x-so-127-fsk',
    amsat: 'SO-127_[FSK]',
    name: 'SO-127',
    label: 'FSK',
    mode: 'Digital',
    norad: 68446,
    satnogs: 'ks3KCobshLHvwdSgFhJUpb',
  },
  {
    id: 'x-so-127-ssdv',
    amsat: 'SO-127_[SSDV]',
    name: 'SO-127',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 68446,
    satnogs: 'mjS4ZR6Mt2KdiSpES6vy94',
  },
  {
    id: 'x-rs83s-ssdv',
    amsat: 'RS83S_[SSDV]',
    name: 'RS83S',
    label: 'SSDV',
    mode: 'SSDV',
    norad: 67284,
    satnogs: 'c9QHuEtPCZxqzjKFRTSdWB',
  },
];

/** What the daily job saves for one SatNOGS entry. Frequencies in MHz. */
export type ExtraEntry = {
  down: number;
  downHigh?: number;
  up?: number;
  upHigh?: number;
  mode: string; // SatNOGS's own mode name, such as "USB" or "GFSK"
  inverting?: boolean;
  description: string;
  updated: string; // when SatNOGS last changed the entry
  satId: string; // for the link to the satellite's SatNOGS page
};
export type Extras = { fetchedAt: string; entries: Record<string, ExtraEntry> };

type SatnogsTransmitter = {
  uuid?: unknown;
  alive?: unknown;
  status?: unknown;
  type?: unknown;
  description?: unknown;
  mode?: unknown;
  invert?: unknown;
  downlink_low?: unknown;
  downlink_high?: unknown;
  uplink_low?: unknown;
  uplink_high?: unknown;
  updated?: unknown;
  sat_id?: unknown;
};
const mhz = (hz: unknown) =>
  typeof hz === 'number' && hz > 1e6 && hz < 3e11 ? Math.round(hz / 100) / 10000 : undefined;

/** Picks the linked, still-active entries out of SatNOGS's transmitter list. */
export function summarizeTransmitters(value: unknown, links: ExtraLink[], now: number): Extras {
  if (!Array.isArray(value)) throw Error('Unexpected SatNOGS response');
  const wanted = new Set(links.map((l) => l.satnogs)),
    entries: Extras['entries'] = {};
  for (const t of value as SatnogsTransmitter[]) {
    if (!t || typeof t.uuid !== 'string' || !wanted.has(t.uuid) || t.alive !== true) continue;
    const down = mhz(t.downlink_low);
    if (down === undefined) continue;
    const downHigh = mhz(t.downlink_high),
      up = mhz(t.uplink_low),
      upHigh = mhz(t.uplink_high);
    entries[t.uuid] = {
      down,
      ...(downHigh !== undefined && downHigh !== down ? { downHigh } : {}),
      ...(up !== undefined ? { up } : {}),
      ...(up !== undefined && upHigh !== undefined && upHigh !== up ? { upHigh } : {}),
      mode: typeof t.mode === 'string' ? t.mode : 'unknown',
      ...(t.type === 'Transponder' ? { inverting: t.invert === true } : {}),
      description: typeof t.description === 'string' ? t.description.slice(0, 120) : '',
      updated: typeof t.updated === 'string' ? t.updated.slice(0, 10) : '',
      satId: typeof t.sat_id === 'string' ? t.sat_id : '',
    };
  }
  return { fetchedAt: new Date(now).toISOString(), entries };
}

export function parseExtras(value: unknown): Extras | null {
  const x = value as Partial<Extras> | null;
  if (
    !x ||
    typeof x !== 'object' ||
    !Number.isFinite(Date.parse(x.fetchedAt ?? '')) ||
    !x.entries ||
    typeof x.entries !== 'object'
  )
    return null;
  const entries: Extras['entries'] = {};
  for (const [uuid, e] of Object.entries(x.entries)) {
    if (e && Number.isFinite(e.down) && e.down > 1 && typeof e.mode === 'string') entries[uuid] = e;
  }
  return { fetchedAt: x.fetchedAt!, entries };
}

const NEEDS: Record<string, string> = {
  'Linear SSB/CW': 'Needs an all-mode radio (SSB or CW)',
  Digipeater: 'Needs a data radio or modem for this mode',
  Digital: 'Needs equipment for this digital mode',
  Telemetry: 'Receive only · needs decoding software',
  SSDV: 'Receive only · picture data, needs decoding software',
};

/** The extra satellites as catalogue entries, for those whose SatNOGS entry is present and active. */
export function extraCatalog(extras: Extras | null, links: ExtraLink[] = extraLinks): Satellite[] {
  if (!extras) return [];
  return links.flatMap((link): Satellite[] => {
    const e = extras.entries[link.satnogs];
    if (!e) return [];
    const linear = link.mode === 'Linear SSB/CW';
    return [
      {
        id: link.id,
        amsat: link.amsat,
        name: link.name,
        tag: link.label,
        subtitle: `${link.label} · ${e.description || e.mode}`,
        norad: link.norad,
        access: 'other',
        mode: link.mode,
        down: e.down,
        ...(e.downHigh ? { downHigh: e.downHigh } : {}),
        up: e.up ?? null,
        ...(e.upHigh ? { upHigh: e.upHigh } : {}),
        ...(e.inverting !== undefined ? { inverting: e.inverting } : {}),
        tone: link.tone ?? 'None',
        condition: NEEDS[link.mode] ?? 'Needs other equipment',
        notes:
          `${linear ? `Linear transponder, ${e.inverting ? 'inverting: a higher uplink comes out lower in the passband' : 'non-inverting'}. ` : `SatNOGS lists the mode as ${e.mode}. `}` +
          `Frequencies are from the SatNOGS database${e.updated ? `, last changed there on ${e.updated}` : ''}, and have not been checked by hand.`,
        source: e.satId ? `https://db.satnogs.org/satellite/${e.satId}` : 'https://db.satnogs.org/',
        satnogsUpdated: e.updated,
      },
    ];
  });
}
