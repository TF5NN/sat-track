'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Copy, Download, RefreshCw, X, ArrowUpRight } from 'lucide-react';
import { frequency, sources, type Satellite } from '../lib/catalog';
import type { Element } from '../lib/orbit';
import { exportTLE, orbitUsable } from '../lib/tle-export';
import { countUse } from '../lib/usage';

export const htManual = 'https://us03-imgcdn.ymcart.com/91076/2026/04/22/7/9/799f98e322bb1645.pdf#page=36';
const utc = (time: number) =>
  new Date(time).toLocaleString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' UTC';
type Props = {
  sat: Satellite;
  element?: Element;
  now: number;
  fetching: boolean;
  data: { kind: string; provider: string; fetchedAt: string };
  dialogRef: RefObject<HTMLElement | null>;
  onRefresh: () => void;
  onClose: () => void;
};
export default function OrbitDialog({
  sat,
  element,
  now,
  fetching,
  data,
  dialogRef,
  onRefresh,
  onClose,
}: Props) {
  const [feedback, setFeedback] = useState('');
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const usable = orbitUsable(element, now);
  const age = element ? Math.max(0, (now - element.epoch) / 86400000) : 0;
  useEffect(() => setFeedback(''), [element?.line1, element?.line2]);
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(`${label} copied.`);
    } catch {
      setFeedback('Clipboard access is unavailable. Select the TLE text below and copy it manually.');
      fallbackRef.current?.closest('details')?.setAttribute('open', '');
      fallbackRef.current?.focus();
      fallbackRef.current?.select();
    }
  }
  function download() {
    if (!element || !usable) return;
    countUse('download-tle');
    const link = document.createElement('a');
    const url = URL.createObjectURL(
      new Blob([exportTLE(element, true, sat.name)], { type: 'text/plain;charset=utf-8' }),
    );
    link.href = url;
    link.download = `${sat.norad}-${sat.name.replace(/[^a-z0-9-]/gi, '-')}.tle`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className="modal orbit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orbit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close icon-button" aria-label="Close orbital data" onClick={onClose}>
          <X size={18} />
        </button>
        <span className="eyebrow">HT APP · ORBITAL PARAMETERS</span>
        <h2 id="orbit-title">{sat.name} orbital data</h2>
        <p>
          Current two-line elements (TLE) for the HT app’s satellite editor. All services on this spacecraft
          share the same orbit.
        </p>
        <dl className="orbit-facts">
          <div>
            <dt>Satellite / mode</dt>
            <dd>
              {sat.name} · {sat.mode}
            </dd>
          </div>
          <div>
            <dt>NORAD ID</dt>
            <dd>{sat.norad}</dd>
          </div>
          <div>
            <dt>Downlink · RX</dt>
            <dd>{frequency(sat.down)} MHz</dd>
          </div>
          <div>
            <dt>Uplink · TX</dt>
            <dd>{sat.up === null ? 'Receive only' : frequency(sat.up) + ' MHz'}</dd>
          </div>
          <div>
            <dt>TX tone</dt>
            <dd>{sat.tone}</dd>
          </div>
        </dl>
        <div className={`orbit-freshness ${!usable || age > 3 ? 'aging' : ''}`}>
          <span>
            <strong>{element ? `Epoch ${utc(element.epoch)}` : 'No valid orbital data available'}</strong>
            <small>
              {element ? `${age.toFixed(1)} days old · ` : ''}
              {data.kind === 'published'
                ? data.provider + ' published dataset'
                : data.kind === 'cached'
                  ? 'Cached dataset'
                  : 'Bundled dataset'}
              {data.fetchedAt ? ` · retrieved ${utc(Date.parse(data.fetchedAt))}` : ''}
            </small>
          </span>
          <button
            className="icon-button"
            aria-label="Refresh orbital elements"
            disabled={fetching}
            onClick={onRefresh}
          >
            <RefreshCw className={fetching ? 'spin' : ''} size={16} />
          </button>
        </div>
        {!usable && (
          <p className="error" role="status">
            Refresh to get valid elements. Copy and download are unavailable when elements are missing or more
            than seven days old.
          </p>
        )}
        {usable && element && (
          <>
            <label className="field tle-label">
              TLE LINE 1
              <button
                type="button"
                aria-label="Copy TLE line 1"
                onClick={() => void copy(element.line1, 'Line 1')}
              >
                <Copy size={12} /> Copy
              </button>
              <textarea
                aria-label="TLE line 1"
                readOnly
                wrap="off"
                rows={2}
                value={element.line1}
                spellCheck={false}
              />
            </label>
            <label className="field tle-label">
              TLE LINE 2
              <button
                type="button"
                aria-label="Copy TLE line 2"
                onClick={() => void copy(element.line2, 'Line 2')}
              >
                <Copy size={12} /> Copy
              </button>
              <textarea
                aria-label="TLE line 2"
                readOnly
                wrap="off"
                rows={2}
                value={element.line2}
                spellCheck={false}
              />
            </label>
            <div className="orbit-actions">
              <button
                className="button primary"
                onClick={() => void copy(exportTLE(element), 'Both TLE lines')}
              >
                <Copy size={14} /> Copy both TLE lines
              </button>
              <button className="button" onClick={download}>
                <Download size={14} /> Download .tle
              </button>
            </div>
            <details className="manual-copy">
              <summary>Select both lines manually</summary>
              <label className="field">
                BOTH TLE LINES
                <textarea
                  ref={fallbackRef}
                  aria-label="Both TLE lines"
                  readOnly
                  wrap="off"
                  rows={3}
                  value={exportTLE(element)}
                  spellCheck={false}
                />
              </label>
            </details>
          </>
        )}
        <div className="copy-status" role="status" aria-live="polite">
          {feedback}
        </div>
        <div className="ht-instructions">
          <h3>Use in the HT app</h3>
          <ol>
            <li>
              Open <strong>Amateur Radio Satellites</strong> and add or edit this satellite.
            </li>
            <li>Enter the name, NORAD ID and the nominal frequencies above.</li>
            <li>
              Use the two TLE lines for the orbital parameters. Preserve their spaces and line breaks, then
              save.
            </li>
          </ol>
          <p>
            New orbital elements are published daily. This page checks for the latest published dataset on
            opening, hourly and when you return after an hour away. A manual entry already saved in the HT app
            needs to be updated there by copying the newer elements again.
          </p>
          <a href={htManual} target="_blank" rel="noreferrer">
            HT manual · satellite data management <ArrowUpRight size={12} />
          </a>
          <a href={sources.status} target="_blank" rel="noreferrer">
            Check transmitter activity <ArrowUpRight size={12} />
          </a>
        </div>
      </section>
    </div>
  );
}
