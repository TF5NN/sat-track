import type { Satellite } from './catalog';

// Operator reception reports from AMSAT's status page (status.amsat.org, CC BY 4.0),
// summarised once a day by scripts/sync-orbits.ts. Reports are worldwide and voluntary:
// they show whether a service has been heard lately, not whether it is on right now.
export type Activity = {
  hours: number; fetchedAt: string;
  reports: Record<string, { heard: number; total: number }>;
};
// The look-back window. Seven days gives quiet satellites enough reports to judge,
// while a service that stopped working still shows up within the week.
export const ACTIVITY_HOURS = 168;
// Fewest reports, none of them "Heard", before a service is flagged as not heard recently.
export const NOT_HEARD_MIN_REPORTS = 3;
const DAY = 86400000;

// Reduce AMSAT's summary response to heard / total counts for the catalogue's services.
export function summarizeReports(value: unknown, names: Iterable<string>, hours: number, now: number): Activity {
  const rows = (value as { data?: unknown } | null)?.data;
  if (!Array.isArray(rows)) throw Error('Unexpected AMSAT status response');
  const wanted = new Set(names), reports: Activity['reports'] = {};
  for (const row of rows) {
    const count = row?.report_count;
    if (!row || !wanted.has(row.name) || !Number.isInteger(count) || count < 0) continue;
    const entry = reports[row.name] ??= { heard: 0, total: 0 };
    entry.total += count;
    if (row.report === 'Heard') entry.heard += count;
  }
  return { hours, fetchedAt: new Date(now).toISOString(), reports };
}

export function parseActivity(value: unknown): Activity | null {
  const a = value as Partial<Activity> | null;
  if (!a || typeof a !== 'object' || !Number.isFinite(a.hours) || a.hours! <= 0
    || !Number.isFinite(Date.parse(a.fetchedAt ?? '')) || !a.reports || typeof a.reports !== 'object') return null;
  const reports: Activity['reports'] = {};
  for (const [name, r] of Object.entries(a.reports)) {
    if (r && Number.isInteger(r.total) && Number.isInteger(r.heard) && r.heard >= 0 && r.total >= r.heard) reports[name] = { heard: r.heard, total: r.total };
  }
  return { hours: a.hours!, fetchedAt: a.fetchedAt!, reports };
}

export type ActivityView = { total: number; heard: number; percent: number | null; days: number; notHeard: boolean };
// Figures for one service, or null when there is nothing trustworthy to show
// (no data yet, the summary is more than three days old, or the service is not tracked).
export function activityFor(sat: Satellite, activity: Activity | null, now: number): ActivityView | null {
  if (!activity || !sat.amsat) return null;
  const age = now - Date.parse(activity.fetchedAt);
  if (age > 3 * DAY || age < -DAY) return null;
  const { heard, total } = activity.reports[sat.amsat] ?? { heard: 0, total: 0 };
  return { total, heard, percent: total ? Math.round(heard / total * 100) : null,
    days: Math.round(activity.hours / 24), notHeard: total >= NOT_HEARD_MIN_REPORTS && heard === 0 };
}
export const activityText = (a: ActivityView) => a.total === 0
  ? `No AMSAT reports in ${a.days} days`
  : `${a.total} AMSAT report${a.total === 1 ? '' : 's'} · ${a.percent}% heard · ${a.days} days`;
