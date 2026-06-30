import { useEffect } from 'react'
import { useOS } from '../../os/store'
import styles from './Boot.module.css'

const BOOT_MS = 2200

// POST/splash -> desktop. Skippable (any key / click) and instant under
// reduced-motion (docs/02 #1). No meta-narrative: it's just a machine booting.
export function Boot() {
  const setBooted = useOS((s) => s.setBooted)

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) {
      setBooted(true)
      return
    }

    const done = () => setBooted(true)
    const timer = window.setTimeout(done, BOOT_MS)
    window.addEventListener('keydown', done)
    window.addEventListener('pointerdown', done)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', done)
      window.removeEventListener('pointerdown', done)
    }
  }, [setBooted])

  return (
    <div
      className={styles.screen}
      role="status"
      aria-label="Starting"
      aria-live="polite"
    >
      <div className={styles.brand}>
        HARROW<span>·</span>HAUS
      </div>
      {/* Authentic XP boot marquee: a lit triad tracking across a dark rail. */}
      <div className={styles.bar} aria-hidden="true">
        <div className={styles.blocks}>
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  )
}
