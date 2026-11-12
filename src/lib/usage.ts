// Anonymous usage counting through GoatCounter (script tag in index.html). Opening the page
// is counted automatically; these named actions are counted as well. No cookies are used, and
// nothing about the station or its location is sent. If the script is blocked or has not
// loaded, counting is silently skipped.
declare global {
  interface Window {
    goatcounter?: { count?: (vars: { path: string; title?: string; event?: boolean }) => void };
  }
}
export type UsageEvent = 'save-pass' | 'event-show-passes' | 'download-tle';
export function countUse(event: UsageEvent): void {
  try {
    window.goatcounter?.count?.({ path: event, title: event, event: true });
  } catch {
    /* Counting must never affect the planner. */
  }
}
