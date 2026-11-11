import type { Satellite } from './catalog';

type CalendarPass = {
  key: string; sat: Satellite; start: number; end: number;
  peakElevation: number; riseDirection: string; setDirection: string;
  tuning?: string[]; // Doppler settings for the pass, one line per retune
};
const stamp = (time: number) => new Date(time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
const textValue = (value: string) => value.replace(/\\/g, '\\\\')
  .replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

// iCalendar folds at 75 UTF-8 octets, without splitting a Unicode character.
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let part = '', bytes = 0;
  for (const char of line) {
    const width = encoder.encode(char).length;
    if (bytes + width > 75) { parts.push(part); part = ' '; bytes = 1; }
    part += char; bytes += width;
  }
  parts.push(part);
  return parts.join('\r\n');
}

export function createPassCalendar(pass: CalendarPass, generatedAt = Date.now()): string {
  const { sat } = pass;
  const description = [
    `RX: ${sat.down.toFixed(3)} MHz`,
    ...(sat.up === null ? [] : [`TX: ${sat.up.toFixed(3)} MHz`]),
    ...(sat.up !== null && !/^none\b/i.test(sat.tone.trim()) && sat.tone.trim()
      ? [`CTCSS (TX): ${sat.tone}`] : []),
    `Maximum elevation: ${pass.peakElevation.toFixed(0)}°`,
    `Direction: ${pass.riseDirection} → ${pass.setDirection}`,
    ...(pass.tuning && pass.tuning.length > 1 ? ['', 'Doppler tuning (5 kHz steps):', ...pass.tuning] : []),
    '', `${sat.condition}. ${sat.notes}`,
    '', `Source: ${sat.source}`,
    '', 'Verify satellite activity before operating.',
  ].join('\n');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Northbound//TF5NN//EN',
    'BEGIN:VEVENT', `UID:${textValue(pass.key)}@tf5nn-orbit`,
    `DTSTAMP:${stamp(generatedAt)}`, `DTSTART:${stamp(pass.start)}`,
    `DTEND:${stamp(pass.end)}`, `SUMMARY:${textValue(`${sat.name} ${sat.mode} pass`)}`,
    `DESCRIPTION:${textValue(description)}`, `URL:${sat.source}`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
