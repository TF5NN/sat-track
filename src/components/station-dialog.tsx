import { useState, type RefObject } from 'react';
import { Check, LocateFixed, MapPin, X } from 'lucide-react';
import { parseLocator, locatorFor } from '../lib/locator';
import { defaultStation, grid, type Station } from '../lib/orbit';
import { countUse } from '../lib/usage';

type Props = {
  station: Station;
  dialogRef: RefObject<HTMLElement | null>;
  onSave: (station: Station) => void;
  onClose: () => void;
  opening?: boolean;
  blank?: boolean; // first visit: nothing remembered, so start with an empty grid field
};
export default function StationDialog({
  station,
  dialogRef,
  onSave,
  onClose,
  opening = false,
  blank = false,
}: Props) {
  // The grid tab is the default. A remembered station entered as coordinates reopens on that tab,
  // so its exact position is not replaced by a grid-square centre without the visitor choosing to.
  const [method, setMethod] = useState<'grid' | 'coordinates'>(
    blank || station.locator ? 'grid' : 'coordinates',
  );
  const [locator, setLocator] = useState(blank ? '' : (station.locator ?? grid(station).toUpperCase()));
  const [lat, setLat] = useState(blank ? '' : String(station.lat));
  const [lon, setLon] = useState(blank ? '' : String(station.lon));
  const [height, setHeight] = useState(String(station.height));
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [found, setFound] = useState('');
  const cell = parseLocator(locator);
  // Ask the device where it is, only when the visitor presses the button. The position is turned
  // into a 6-character grid square here in the browser and is never sent anywhere.
  function locate() {
    if (locating) return;
    countUse('use-my-location');
    setError('');
    setFound('');
    if (!navigator.geolocation) {
      setError('This device cannot report its location. Enter your grid square instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const square = locatorFor(position.coords.latitude, position.coords.longitude).toUpperCase();
        setLocator(square);
        setMethod('grid');
        setFound(`Your device reports ${square}. Check it, then confirm below.`);
        setLocating(false);
      },
      (failure) => {
        setError(
          failure.code === failure.PERMISSION_DENIED
            ? 'Location permission was declined. Enter your grid square instead.'
            : 'Your device could not find its location. Enter your grid square instead.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  }
  function switchMethod(next: 'grid' | 'coordinates') {
    if (next === 'coordinates' && method === 'grid' && cell) {
      setLat(cell.lat.toFixed(6));
      setLon(cell.lon.toFixed(6));
    }
    if (next === 'grid' && method === 'coordinates') {
      // Carry typed coordinates over, so saving does not silently use the previous grid.
      const latitude = Number(lat),
        longitude = Number(lon);
      if (
        lat.trim() &&
        lon.trim() &&
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        setLocator(locatorFor(latitude, longitude).toUpperCase());
      }
    }
    setMethod(next);
    setError('');
  }
  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const h = Number(height),
      latitude = Number(lat),
      longitude = Number(lon);
    if (!height.trim() || !Number.isFinite(h) || h < -500 || h > 9000) {
      setError('Enter a height between −500 and 9000 metres.');
      return;
    }
    if (method === 'grid') {
      if (!cell) {
        setError('Enter a valid 4-, 6- or 8-character grid, such as HP94, HP94ad or HP94ad25.');
        return;
      }
      onSave({ lat: cell.lat, lon: cell.lon, height: h, locator: cell.locator });
    } else {
      if (
        !lat.trim() ||
        !lon.trim() ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        setError('Enter latitude −90 to 90 and longitude −180 to 180.');
        return;
      }
      onSave({ lat: latitude, lon: longitude, height: h });
    }
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="station-title"
        onClick={(e) => e.stopPropagation()}
      >
        {!opening && (
          <button className="modal-close icon-button" aria-label="Close station settings" onClick={onClose}>
            <X size={18} />
          </button>
        )}
        <MapPin size={24} />
        <h2 id="station-title">{opening ? 'Where are you observing?' : 'Your observing station'}</h2>
        <p>
          {opening
            ? 'Enter your Maidenhead grid square to find satellites you can reach, or let your device find it. Your last station is remembered in this browser.'
            : 'Enter your Maidenhead grid square or coordinates, or let your device find it. Your location is saved in this browser.'}
        </p>
        <button type="button" className="button locate" onClick={locate} aria-busy={locating}>
          <LocateFixed size={14} /> {locating ? 'Finding your location…' : 'Use my location'}
        </button>
        <p className="locate-status" role="status">
          {found}
        </p>
        <div className="location-method" role="tablist" aria-label="Location entry method">
          <button role="tab" aria-selected={method === 'grid'} onClick={() => switchMethod('grid')}>
            Maidenhead grid
          </button>
          <button
            role="tab"
            aria-selected={method === 'coordinates'}
            onClick={() => switchMethod('coordinates')}
          >
            Coordinates
          </button>
        </div>
        <form onSubmit={save} noValidate>
          {method === 'grid' ? (
            <>
              <label className="field">
                MAIDENHEAD LOCATOR
                <input
                  aria-label="Maidenhead locator"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={8}
                  placeholder="HP94ad"
                  value={locator}
                  onChange={(e) => {
                    setLocator(e.target.value);
                    setError('');
                    setFound('');
                  }}
                  aria-invalid={!!error && !cell}
                />
              </label>
              <p className="grid-help">
                4, 6 or 8 characters, case-insensitive. Predictions use the centre of the grid square; 6 or 8
                characters give a more precise location.
              </p>
              {cell && (
                <div className="grid-preview" aria-live="polite">
                  <strong>{cell.locator}</strong>
                  <span>
                    {Math.abs(cell.lat).toFixed(5)}° {cell.lat < 0 ? 'S' : 'N'} ·{' '}
                    {Math.abs(cell.lon).toFixed(5)}° {cell.lon < 0 ? 'W' : 'E'}
                  </span>
                  <small>
                    Grid centre · {cell.lonSize.toFixed(4)}° longitude × {cell.latSize.toFixed(4)}° latitude
                  </small>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="field">
                LATITUDE · DECIMAL DEGREES
                <input
                  aria-label="Latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </label>
              <label className="field">
                LONGITUDE · WEST IS NEGATIVE
                <input
                  aria-label="Longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                />
              </label>
            </>
          )}
          <label className="field">
            HEIGHT ABOVE SEA LEVEL · METRES
            <input
              aria-label="Height above sea level"
              type="number"
              step="any"
              min="-500"
              max="9000"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="text-link" onClick={() => onSave(defaultStation)}>
              Use Reykjavík default
            </button>
            <button className="button primary" type="submit">
              <Check size={14} /> {opening ? 'Use this location' : 'Save station'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
