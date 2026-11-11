import { MapPin, Radio, Settings2 } from 'lucide-react';
import { grid, type Station } from '../lib/orbit';

type Props = { station: Station; setEditing: (editing: boolean) => void };
export default function Intro({ station, setEditing }: Props) {
  return (
    <>
      <section className="intro">
        <div>
          <div className="eyebrow location">
            <span className="live-dot" /> OBSERVER STATION <span>/</span>{' '}
            {(station.locator ?? grid(station)).toUpperCase()}
          </div>
          <h1>
            Your next window
            <br className="mobile-break" /> to space<span>.</span>
          </h1>
          <p>Point the Yagi. Find the signal. Make the contact.</p>
        </div>
        <button className="station-summary" onClick={() => setEditing(true)}>
          <MapPin size={17} />
          <span>
            <strong>
              {Math.abs(station.lat).toFixed(4)}° {station.lat < 0 ? 'S' : 'N'} ·{' '}
              {Math.abs(station.lon).toFixed(4)}° {station.lon < 0 ? 'W' : 'E'}
            </strong>
            <small>2 m / 70 cm Yagi · FM half duplex</small>
          </span>
          <Settings2 size={15} />
        </button>
      </section>
      <div className="radio-compatibility">
        <Radio size={15} />
        <p>
          <strong>Designed for the VGC VR-N76.</strong> Pass, frequency and Doppler guidance applies to all FM
          half-duplex 2 m / 70 cm radios.{' '}
          <span>APRS needs packet/TNC support; SSTV images need an audio decoder.</span>
        </p>
      </div>
    </>
  );
}
