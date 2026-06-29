import { useState } from 'react'
import styles from './Trivia.module.css'

// trivia.exe — SHELL ONLY (docs/05: internals deferred to Phase 7; manifest:
// "stub window"). Presented as an always-on weird-knowledge quiz client sitting
// idle in its lobby, waiting for a room to fill (the realtime spine is Phase 6).
// Diegetic, in the host's voice — never narrates the site or itself (Rule 2).

const HOST_LINES = [
  'grab a seat. we start when the room fills up.',
  "i've got a stack of questions and nowhere to be.",
  'quiet in here. somebody invite the others.',
  'rule one: no looking it up. rule two: see rule one.',
]

const CATEGORIES = [
  'Cryptids',
  'Dead Formats',
  'Video Nasties',
  'Numbers Stations',
  'Cassette Culture',
  'Occult 101',
]

export function Trivia() {
  const [lineIdx, setLineIdx] = useState(0)
  const [status, setStatus] = useState<'idle' | 'searching'>('idle')

  const nudgeHost = () => setLineIdx((i) => (i + 1) % HOST_LINES.length)
  const ready = () => {
    setStatus('searching')
    nudgeHost()
  }

  return (
    <div className={styles.trivia}>
      <div className={styles.marquee}>
        <span className={styles.logo}>TRIVIA</span>
        <span className={styles.tag}>weird knowledge · no looking it up</span>
      </div>

      <div className={styles.stage}>
        <button type="button" className={styles.host} onClick={nudgeHost} title="nudge the host">
          <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="#1d1d22" stroke="#000" />
            <circle cx="32" cy="26" r="12" fill="#caa" />
            <path d="M14 54 Q32 38 50 54 Z" fill="#3a2a2a" />
            <rect x="20" y="14" width="24" height="7" rx="3" fill="#111" />
            <rect x="17" y="20" width="30" height="3" fill="#111" />
            <circle cx="27" cy="27" r="1.6" fill="#111" />
            <circle cx="37" cy="27" r="1.6" fill="#111" />
            <path d="M27 33 Q32 36 37 33" stroke="#111" strokeWidth="1.4" fill="none" />
          </svg>
        </button>
        <div className={styles.bubble}>{HOST_LINES[lineIdx]}</div>
      </div>

      <div className={styles.lobby}>
        <div className={styles.players}>
          <div className={styles.panelHead}>Players (0)</div>
          <div className={styles.empty}>
            {status === 'searching' ? 'looking for a game…' : 'the room is empty.'}
          </div>
        </div>
        <div className={styles.cats}>
          <div className={styles.panelHead}>Tonight's categories</div>
          <div className={styles.chips}>
            {CATEGORIES.map((c) => (
              <span key={c} className={styles.chip}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.ready} onClick={ready}>
          {status === 'searching' ? 'Searching…' : 'Ready Up'}
        </button>
        <span className={styles.note}>
          {status === 'searching' ? "no one's home yet — check back later." : 'buzz in when the others arrive.'}
        </span>
      </div>
    </div>
  )
}
