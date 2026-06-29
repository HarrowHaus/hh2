import styles from './CrtOverlay.module.css'

// CRT/VHS post-process overlay (Tier 1, docs/08). A full-screen, click-through
// atmosphere layer: scanlines + vignette + a faint flicker and a drifting VHS
// tracking band. Toggled in Display Properties → Effects, persisted. All motion
// is disabled under prefers-reduced-motion (see the CSS). Original effect (CSS).
export function CrtOverlay() {
  return (
    <div className={styles.crt} aria-hidden="true">
      <div className={styles.scanlines} />
      <div className={styles.mask} />
      <div className={styles.vignette} />
      <div className={styles.vhs} />
      <div className={styles.flicker} />
    </div>
  )
}
