import { useClock } from './useClock'
import styles from './Taskbar.module.css'

// Placeholder taskbar (see Taskbar.module.css). Phase 1 replaces this with the
// authentic XP taskbar/Start menu ported from the winXP base.
export function Taskbar() {
  const time = useClock()

  return (
    <nav className={styles.taskbar} aria-label="Taskbar">
      <button type="button" className={styles.start} aria-label="Start">
        <span className={styles.flag} aria-hidden="true" />
        start
      </button>
      <div className={styles.tasks} />
      <div className={styles.tray} aria-label="Clock">
        {time}
      </div>
    </nav>
  )
}
