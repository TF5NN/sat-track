'use client';
import { useState, type RefObject } from 'react';
import { Check, MapPin, X } from 'lucide-react';
import { parseLocator, locatorFor } from '../lib/locator';
import { defaultStation, grid, type Station } from '../lib/orbit';

type Props = {
  station: Station; dialogRef: RefObject<HTMLElement | null>;
  onSave: (station: Station) => void; onClose: () => void; opening?: boolean;
};
export default function StationDialog({ station, dialogRef, onSave, onClose, opening = false }: Props) {
  const [method, setMethod] = useState<'grid' | 'coordinates'>(station.locator ? 'grid' : 'coordinates');
  const [locator, setLocator] = useState(station.locator ?? grid(station).toUpperCase());
  const [lat, setLat] = useState(String(station.lat));
  const [lon, setLon] = useState(String(station.lon));
  const [height, setHeight] = useState(String(station.height));
  const [error, setError] = useState('');
  const cell = parseLocator(locator);
  function switchMethod(next: 'grid' | 'coordinates') {
    if (next === 'coordinates' && method === 'grid' && cell) {
      setLat(cell.lat.toFixed(6)); setLon(cell.lon.toFixed(6));
    }
    if (next === 'grid' && method === 'coordinates') {
      // Carry typed coordinates over, so saving does not silently use the previous grid.
      const latitude = Number(lat), longitude = Number(lon);
      if (lat.trim() && lon.trim() && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
        && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
        setLocator(locatorFor(latitude, longitude).toUpperCase());
      }
    }
    setMethod(next); setError('');
  }
  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const h = Number(height), latitude = Number(lat), longitude = Number(lon);
    if (!height.trim() || !Number.isFinite(h) || h < -500 || h > 9000) {
      setError('Enter a height between −500 and 9000 metres.'); return;
    }
    if (method === 'grid') {
      if (!cell) { setError('Enter a valid 4-, 6- or 8-character grid, such as HP94, HP94ad or HP94ad25.'); return; }
      onSave({ lat: cell.lat, lon: cell.lon, height: h, locator: cell.locator });
    } else {
      if (!lat.trim() || !lon.trim() || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
        || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        setError('Enter latitude −90 to 90 and longitude −180 to 180.'); return;
      }
      onSave({ lat: latitude, lon: longitude, height: h });
    }
  }
  return <div className="modal-backdrop" onClick={onClose}>
    <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="station-title" onClick={e => e.stopPropagation()}>
      {!opening && <button className="modal-close icon-button" aria-label="Close station settings" onClick={onClose}><X size={18}/></button>}
      <MapPin size={24}/><h2 id="station-title">{opening ? 'Where are you observing?' : 'Your observing station'}</h2>
      <p>{opening ? 'Confirm your location to find satellites you can reach. Reykjavík is the default for new visitors; your last station is remembered here.' : 'Enter your Maidenhead grid or coordinates. Your location is saved in this browser.'}</p>
      <div className="location-method" role="tablist" aria-label="Location entry method">
        <button role="tab" aria-selected={method === 'grid'} onClick={() => switchMethod('grid')}>Maidenhead grid</button>
        <button role="tab" aria-selected={method === 'coordinates'} onClick={() => switchMethod('coordinates')}>Coordinates</button>
      </div>
      <form onSubmit={save} noValidate>
        {method === 'grid' ? <>
          <label className="field">MAIDENHEAD LOCATOR<input aria-label="Maidenhead locator" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={8} placeholder="HP94ad" value={locator} onChange={e => {setLocator(e.target.value); setError('');}} aria-invalid={!!error && !cell}/></label>
          <p className="grid-help">4, 6 or 8 characters, case-insensitive. Predictions use the centre of the grid square; 6 or 8 characters give a more precise location.</p>
          {cell && <div className="grid-preview" aria-live="polite"><strong>{cell.locator}</strong><span>{Math.abs(cell.lat).toFixed(5)}° {cell.lat < 0 ? 'S' : 'N'} · {Math.abs(cell.lon).toFixed(5)}° {cell.lon < 0 ? 'W' : 'E'}</span><small>Grid centre · {cell.lonSize.toFixed(4)}° longitude × {cell.latSize.toFixed(4)}° latitude</small></div>}
        </> : <>
          <label className="field">LATITUDE · DECIMAL DEGREES<input aria-label="Latitude" type="number" step="any" min="-90" max="90" value={lat} onChange={e => setLat(e.target.value)}/></label>
          <label className="field">LONGITUDE · WEST IS NEGATIVE<input aria-label="Longitude" type="number" step="any" min="-180" max="180" value={lon} onChange={e => setLon(e.target.value)}/></label>
        </>}
        <label className="field">HEIGHT ABOVE SEA LEVEL · METRES<input aria-label="Height above sea level" type="number" step="any" min="-500" max="9000" value={height} onChange={e => setHeight(e.target.value)}/></label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="text-link" onClick={() => onSave(defaultStation)}>Use Reykjavík default</button><button className="button primary" type="submit"><Check size={14}/> {opening ? 'Use this location' : 'Save station'}</button></div>
      </form>
    </section>
  </div>;
}
