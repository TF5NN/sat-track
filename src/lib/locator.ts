// Maidenhead cells alternate fields (18), squares (10), subsquares (24),
// then extended squares (10). Return the cell centre, never its SW corner.
export type LocatorCell = {
  locator: string;
  lat: number;
  lon: number;
  latSize: number;
  lonSize: number;
};
export function parseLocator(input: string): LocatorCell | null {
  const locator = input.trim().toUpperCase();
  if (!/^[A-R]{2}\d{2}(?:[A-X]{2}(?:\d{2})?)?$/.test(locator)) return null;
  let lon = -180,
    lat = -90,
    lonSize = 360,
    latSize = 180;
  const bases = [18, 10, 24, 10];
  for (let pair = 0; pair < locator.length / 2; pair++) {
    lonSize /= bases[pair];
    latSize /= bases[pair];
    const origin = pair % 2 === 0 ? 65 : 48;
    lon += (locator.charCodeAt(pair * 2) - origin) * lonSize;
    lat += (locator.charCodeAt(pair * 2 + 1) - origin) * latSize;
  }
  return { locator, lon: lon + lonSize / 2, lat: lat + latSize / 2, lonSize, latSize };
}

export function locatorFor(lat: number, lon: number): string {
  // Include the geographic endpoints in their last valid cell.
  const a = Math.min(360 - 1e-9, Math.max(0, lon + 180));
  const b = Math.min(180 - 1e-9, Math.max(0, lat + 90));
  return (
    String.fromCharCode(65 + Math.floor(a / 20), 65 + Math.floor(b / 10)) +
    Math.floor((a % 20) / 2) +
    Math.floor(b % 10) +
    String.fromCharCode(97 + Math.floor((a % 2) * 12), 97 + Math.floor((b % 1) * 24))
  );
}
