import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { AppProps } from '../../os/types';
import styles from './CharMap.module.css';

// Unicode ranges: Basic Latin + Latin-1 + Latin Extended-A/B + General Punctuation/Math
const RANGES: [number, number][] = [
  [0x0020, 0x024f],
  [0x2000, 0x22ff],
];

const CODEPOINTS: number[] = [];
for (const [start, end] of RANGES) {
  for (let cp = start; cp <= end; cp++) {
    CODEPOINTS.push(cp);
  }
}

const FONTS = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'monospace',
];

function cpToChar(cp: number): string {
  return String.fromCodePoint(cp);
}

function cpToHex(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

function getCharBlock(cp: number): string {
  if (cp >= 0x0020 && cp <= 0x007f) return 'Basic Latin';
  if (cp >= 0x0080 && cp <= 0x00ff) return 'Latin-1 Supplement';
  if (cp >= 0x0100 && cp <= 0x017f) return 'Latin Extended-A';
  if (cp >= 0x0180 && cp <= 0x024f) return 'Latin Extended-B';
  if (cp >= 0x2000 && cp <= 0x206f) return 'General Punctuation';
  if (cp >= 0x2070 && cp <= 0x209f) return 'Superscripts and Subscripts';
  if (cp >= 0x20a0 && cp <= 0x20cf) return 'Currency Symbols';
  if (cp >= 0x2100 && cp <= 0x214f) return 'Letterlike Symbols';
  if (cp >= 0x2150 && cp <= 0x218f) return 'Number Forms';
  if (cp >= 0x2190 && cp <= 0x21ff) return 'Arrows';
  if (cp >= 0x2200 && cp <= 0x22ff) return 'Mathematical Operators';
  return 'Miscellaneous';
}

export function CharMap({ winId: _winId, args: _args }: AppProps) {
  const [font, setFont] = useState(FONTS[0]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [copyText, setCopyText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const selectedCp = selectedIdx !== null ? CODEPOINTS[selectedIdx] : null;

  const statusText = useMemo(() => {
    if (selectedCp === null) return 'Click a character to select it.';
    return `${cpToHex(selectedCp)}  —  ${getCharBlock(selectedCp)}`;
  }, [selectedCp]);

  const appendChar = useCallback((cp: number) => {
    setCopyText(prev => prev + cpToChar(cp));
  }, []);

  const handleCellClick = useCallback((idx: number) => {
    setSelectedIdx(idx);
  }, []);

  const handleCellDoubleClick = useCallback((idx: number) => {
    setSelectedIdx(idx);
    appendChar(CODEPOINTS[idx]);
  }, [appendChar]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (selectedIdx === null) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        setSelectedIdx(0);
        e.preventDefault();
      }
      return;
    }

    const gridEl = gridRef.current;
    if (!gridEl) return;
    // Calculate columns from grid layout
    const cellEls = gridEl.querySelectorAll('[data-cellidx]');
    if (cellEls.length < 2) return;
    const firstRect = cellEls[0].getBoundingClientRect();
    const secondRect = cellEls[1].getBoundingClientRect();
    const cols = secondRect.top > firstRect.top ? 1 :
      Math.round(gridEl.getBoundingClientRect().width / firstRect.width);

    let next = selectedIdx;
    if (e.key === 'ArrowRight') next = Math.min(selectedIdx + 1, CODEPOINTS.length - 1);
    else if (e.key === 'ArrowLeft') next = Math.max(selectedIdx - 1, 0);
    else if (e.key === 'ArrowDown') next = Math.min(selectedIdx + cols, CODEPOINTS.length - 1);
    else if (e.key === 'ArrowUp') next = Math.max(selectedIdx - cols, 0);
    else if (e.key === 'Enter') { appendChar(CODEPOINTS[selectedIdx]); return; }
    else return;

    e.preventDefault();
    setSelectedIdx(next);

    // Scroll selected into view
    const el = gridEl.querySelector(`[data-cellidx="${next}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx, appendChar]);

  const handleCopy = useCallback(async () => {
    if (!copyText) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText);
      } else {
        // Fallback: execCommand
        const ta = document.createElement('textarea');
        ta.value = copyText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1200);
    } catch {
      // silently fail — clipboard may be unavailable
    }
  }, [copyText]);

  // Focus grid on mount for keyboard nav
  useEffect(() => {
    gridRef.current?.focus();
  }, []);

  return (
    <div className={styles.charmap}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <label className={styles.label} htmlFor="cm-font">Font:</label>
        <select
          id="cm-font"
          className={styles.select}
          value={font}
          onChange={e => setFont(e.target.value)}
        >
          {FONTS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Glyph grid */}
      <div
        ref={gridRef}
        className={styles.grid}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Character grid"
      >
        {CODEPOINTS.map((cp, idx) => (
          <div
            key={cp}
            data-cellidx={idx}
            className={`${styles.cell} ${selectedIdx === idx ? styles.cellSelected : ''}`}
            style={{ fontFamily: font }}
            title={`${cpToHex(cp)} ${getCharBlock(cp)}`}
            onClick={() => handleCellClick(idx)}
            onDoubleClick={() => handleCellDoubleClick(idx)}
          >
            {cpToChar(cp)}
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className={styles.statusbar}>
        <span className={styles.statustext}>{statusText}</span>
        {selectedCp !== null && (
          <span className={styles.codepoint}>{cpToHex(selectedCp)}</span>
        )}
      </div>

      {/* Copy row */}
      <div className={styles.copyrow}>
        <span className={styles.label}>Characters to copy:</span>
        <input
          className={styles.copyinput}
          type="text"
          value={copyText}
          onChange={e => setCopyText(e.target.value)}
          placeholder="(double-click a character to add)"
          spellCheck={false}
        />
        <button
          className={styles.copybtn}
          onClick={handleCopy}
          disabled={!copyText}
        >
          {copyFeedback ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
