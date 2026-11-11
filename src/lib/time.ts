// Time formatting. Pass times follow the visitor's choice of device-local time or UTC, carried
// in a Clock made by makeClock(). Data timestamps (orbit epochs, event schedules) always use utc*.
export type Clock = {
  zone: 'UTC' | undefined; // undefined = the device's own time zone
  name: 'UTC' | 'local';
  time: (t: number, seconds?: boolean) => string;
  date: (t: number) => string;
};
export const clockTime = (t: number, seconds: boolean, timeZone: string | undefined) =>
  new Date(t).toLocaleTimeString('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
  });
export const makeClock = (utc: boolean): Clock => {
  const zone = utc ? 'UTC' : undefined;
  return {
    zone,
    name: utc ? 'UTC' : 'local',
    time: (t, seconds = false) => clockTime(t, seconds, zone),
    date: (t) => new Date(t).toLocaleDateString('en-GB', { timeZone: zone, day: 'numeric', month: 'short' }),
  };
};
export const utcTime = (t: number, seconds = false) => clockTime(t, seconds, 'UTC');
export const utcDate = (t: number) =>
  new Date(t).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
export const offsetLabel = (t: number) => {
  const m = -new Date(t).getTimezoneOffset(),
    a = Math.abs(m);
  return `UTC${m < 0 ? '−' : '+'}${Math.floor(a / 60)}${a % 60 ? ':' + String(a % 60).padStart(2, '0') : ''}`;
};
export const dateYear = (t: number) =>
  new Date(t).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
export const span = (w: { start: string; end: string }) =>
  `${utcDate(Date.parse(w.start))} ${utcTime(Date.parse(w.start))}–${utcDate(Date.parse(w.end))} ${utcTime(Date.parse(w.end))} UTC`;
export const until = (t: number, now: number) =>
  t <= now
    ? 'In progress'
    : t - now < 3600000
      ? `In ${Math.ceil((t - now) / 60000)} min`
      : `In ${Math.floor((t - now) / 3600000)}h ${Math.floor(((t - now) % 3600000) / 60000)}m`;
