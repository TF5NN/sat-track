// Light and dark. The page follows the device's setting until the visitor presses the button in
// the header; from then on their choice is remembered in this browser and wins. The choice is
// kept under one name for every TF5NN app on this site, so it carries from one to the next.
// A small script in index.html applies the theme before the first paint; this file is for
// changing it afterwards.
export type Theme = 'light' | 'dark';
const KEY = 'tf5nn-theme';
const device = () => window.matchMedia('(prefers-color-scheme: dark)');

function chosen(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}
/** The theme in force: the visitor's choice if they made one, otherwise the device's. */
export const currentTheme = (): Theme => chosen() ?? (device().matches ? 'dark' : 'light');

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  // The colour a phone's browser gives its own bars around the page.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0f1917' : '#214e3a');
}
/** Switch theme and remember it. */
export function chooseTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* Private browsing: the choice lasts until the page is closed. */
  }
  apply(theme);
}
/** Keep following the device while the visitor has made no choice. Returns a function that stops it. */
export function followDevice(onChange: (theme: Theme) => void) {
  const query = device();
  const changed = () => {
    if (chosen()) return;
    apply(currentTheme());
    onChange(currentTheme());
  };
  query.addEventListener('change', changed);
  return () => query.removeEventListener('change', changed);
}
