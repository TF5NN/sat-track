import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// A small map for choosing an exact spot: tap to place the pin, drag it to adjust.
// Loaded only when the Map tab of the station dialog is opened.
type Spot = { lat: number; lon: number };
const wrap = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;
const pinIcon = L.divIcon({ className: 'map-pin', iconSize: [20, 20], iconAnchor: [10, 10] });

export default function MapPicker({ pin, onPick }: { pin: Spot | null; onPick: (spot: Spot) => void }) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  useEffect(() => {
    const m = L.map(holder.current!).setView(pin ? [pin.lat, pin.lon] : [58, -20], pin ? 11 : 3);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m);
    m.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    m.on('click', (e) => pick.current({ lat: e.latlng.lat, lon: wrap(e.latlng.lng) }));
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // The map is created once; later pin changes are handled below.
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m || !pin) return;
    if (!marker.current) {
      marker.current = L.marker([pin.lat, pin.lon], {
        draggable: true,
        icon: pinIcon,
        keyboard: false,
      }).addTo(m);
      marker.current.on('dragend', () => {
        const at = marker.current!.getLatLng();
        pick.current({ lat: at.lat, lon: wrap(at.lng) });
      });
    } else marker.current.setLatLng([pin.lat, pin.lon]);
    if (!m.getBounds().contains([pin.lat, pin.lon])) m.setView([pin.lat, pin.lon], Math.max(m.getZoom(), 11));
  }, [pin]);
  return (
    <div
      ref={holder}
      className="map-picker"
      aria-label="Map. Tap to choose your spot, drag the pin to adjust."
    />
  );
}
