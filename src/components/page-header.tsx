import { Radio } from 'lucide-react';

export default function PageHeader() {
  return (
    <header className="header">
      <a href={import.meta.env.BASE_URL} className="brand" aria-label="Northbound home">
        <span className="brand-icon">
          <svg viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="13" />
            <circle cx="18" cy="18" r="6" />
            <path d="M18 18L29 7" />
            <circle cx="29" cy="7" r="2" fill="currentColor" />
          </svg>
        </span>
        <span>
          NORTHBOUND<small>AMATEUR SATELLITE PLANNER</small>
        </span>
      </a>
      <div className="header-right">
        <span className="private">
          <Radio size={12} /> FM satellite planner
        </span>
        <a className="callsign" href="https://github.com/TF5NN/sat-track" target="_blank" rel="noreferrer">
          TF5NN ↗
        </a>
      </div>
    </header>
  );
}
