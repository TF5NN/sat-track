import type { Element } from './orbit';

export function orbitUsable(element: Element | undefined, now: number): boolean {
  return !!element && now - element.epoch <= 7 * 86400000 && element.epoch - now <= 86400000;
}

// Keep all fixed-width columns, including the original checksums.
// The HT orbital entry uses the two element lines; a .tle file includes a name.
// Pass the catalogue name (e.g. AO-123): feeds often carry placeholders such as OBJECT AY.
export function exportTLE(element: Element, includeName = false, name = element.name): string {
  return (
    [...(includeName ? [name.replace(/[\r\n]/g, '').trim()] : []), element.line1, element.line2].join(
      '\r\n',
    ) + '\r\n'
  );
}
