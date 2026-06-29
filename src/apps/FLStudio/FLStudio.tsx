import styles from './FLStudio.module.css'

// FL Studio / FruityLoops diorama (manifest item 5). The channel-rack step
// sequencer frozen on a pattern. NON-FUNCTIONAL: steps and transport are inert
// props — a museum of the bedroom-producer rig, not a working DAW. Original
// recreation skinned from scratch (no lifted Image-Line assets, docs/04).

interface Channel {
  name: string
  steps: boolean[]
}

// 16-step pattern (4 bars of 4). Lit = active step. A fast, ugly little beat —
// fitting the owner's noise/metal bent. Invented; nothing plays.
const X = true
const o = false
const CHANNELS: Channel[] = [
  { name: 'Kick',        steps: [X,o,o,o, X,o,o,X, X,o,o,o, X,o,X,o] },
  { name: 'Clap',        steps: [o,o,o,o, X,o,o,o, o,o,o,o, X,o,o,X] },
  { name: 'Snare 909',   steps: [o,o,o,o, X,o,o,o, o,o,X,o, X,o,o,o] },
  { name: 'Hat (closed)',steps: [X,o,X,o, X,o,X,o, X,o,X,o, X,o,X,o] },
  { name: 'Hat (open)',  steps: [o,o,o,X, o,o,o,X, o,o,o,X, o,o,o,X] },
  { name: '808 Sub',     steps: [X,o,o,o, o,o,X,o, X,o,o,o, o,o,o,o] },
  { name: 'Noise Hit',   steps: [o,o,o,o, o,o,o,o, o,o,o,o, o,X,X,X] },
  { name: 'Vox Chop',    steps: [o,o,X,o, o,o,o,o, o,o,X,o, o,o,o,o] },
]

export function FLStudio() {
  return (
    <div className={styles.fl}>
      <div className={styles.menubar}>
        {['File', 'Edit', 'Add', 'Patterns', 'View', 'Options', 'Tools', 'Help'].map((m) => (
          <span key={m} className={styles.menu}>{m}</span>
        ))}
      </div>

      <div className={styles.transport}>
        <div className={styles.tdisplay}>
          <span className={styles.bpm}>140.000</span>
          <span className={styles.tlabel}>BPM</span>
          <span className={styles.patName}>PAT 3 — untitled_3</span>
        </div>
        <div className={styles.tbtns}>
          <span className={`${styles.tbtn} ${styles.play}`}>▶</span>
          <span className={styles.tbtn}>■</span>
          <span className={`${styles.tbtn} ${styles.rec}`}>●</span>
          <span className={`${styles.tbtn} ${styles.patmode}`}>PAT</span>
          <span className={styles.tbtn}>SONG</span>
        </div>
      </div>

      <div className={styles.rackHead}>
        <span className={styles.rackTitle}>Channel rack</span>
        <div className={styles.beatMarks}>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className={`${styles.mark} ${i % 4 === 0 ? styles.markBar : ''}`} />
          ))}
        </div>
      </div>

      <div className={styles.rack}>
        {CHANNELS.map((ch) => (
          <div key={ch.name} className={styles.channel}>
            <span className={styles.led} />
            <span className={styles.chName} title={ch.name}>{ch.name}</span>
            <div className={styles.steps}>
              {ch.steps.map((on, i) => (
                <span
                  key={i}
                  className={`${styles.step} ${on ? styles.stepOn : ''} ${
                    Math.floor(i / 4) % 2 === 1 ? styles.stepAlt : ''
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.statusbar}>
        <span>8 channels</span>
        <span>4/4 · 16 steps</span>
        <span className={styles.hint}>untitled_3.flp</span>
      </div>
    </div>
  )
}
