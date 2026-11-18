import { useEffect, useState } from 'react';
import { Moon, Radio, Sun } from 'lucide-react';
import { chooseTheme, currentTheme, followDevice } from '../lib/theme';
import { countUse } from '../lib/usage';

export default function PageHeader() {
  const [theme, setTheme] = useState(currentTheme);
  useEffect(() => followDevice(setTheme), []);
  const other = theme === 'dark' ? 'light' : 'dark';
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
        <a
          className="callsign"
          href="https://tf5nn.github.io/"
          target="_blank"
          rel="noopener"
          title="More projects from TF5NN"
          onClick={() => countUse('main-site-from-northbound')}
        >
          TF5NN ↗
        </a>
        <a
          className="callsign"
          href="https://github.com/TF5NN/sat-track"
          target="_blank"
          rel="noopener"
          title="Source code on GitHub"
          onClick={() => countUse('github-from-northbound')}
        >
          GitHub ↗
        </a>
        <button
          className="theme-toggle"
          aria-label={`Switch to the ${other} theme`}
          title={`Switch to the ${other} theme`}
          onClick={() => {
            chooseTheme(other);
            setTheme(other);
          }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
