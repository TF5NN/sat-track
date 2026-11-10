import { parseTLE, type Element } from './orbit';

export function parseSatnogs(value: unknown): Element[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(row => row && typeof row.tle1 === 'string' && typeof row.tle2 === 'string'
    ? parseTLE(`${typeof row.tle0 === 'string' ? row.tle0 : ''}\n${row.tle1}\n${row.tle2}`) : []);
}

export function mergeElements(groups: Element[][], now: number): Element[] {
  const byId = new Map<number, Element>();
  for (const group of groups) for (const element of group) {
    if (element.epoch > now + 86400000) continue;
    if (!byId.has(element.norad) || element.epoch > byId.get(element.norad)!.epoch) byId.set(element.norad, element);
  }
  return [...byId.values()];
}
export const elementText = (elements: Element[]) => elements.map(e => `${e.name}\n${e.line1}\n${e.line2}\n`).join('');
