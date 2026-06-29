import type { PointerEvent as ReactPointerEvent } from 'react'
import { useOS, getFocusedId } from '../../os/store'
import { APPS } from '../../os/apps'
import { FlagIcon, VolumeIcon } from '../../os/icons'
import { useClock } from './useClock'
import styles from './Taskbar.module.css'

// XP taskbar: Start button, running-task buttons (focus/click-to-minimize),
// system tray + live clock. Ported from winXP Footer, skinned via tokens.
export function Taskbar() {
  const windows = useOS((s) => s.windows)
  const focusedId = useOS((s) => getFocusedId(s.windows))
  const taskbarClick = useOS((s) => s.taskbarClick)
  const toggleStartMenu = useOS((s) => s.toggleStartMenu)
  const startMenuOpen = useOS((s) => s.startMenuOpen)
  const time = useClock()

  // PointerDown + stopPropagation so the desktop's close-on-click doesn't race.
  const onStart = (e: ReactPointerEvent) => {
    e.stopPropagation()
    toggleStartMenu()
  }

  return (
    <nav className={styles.taskbar} aria-label="Taskbar">
      <button
        type="button"
        className={`${styles.start} ${startMenuOpen ? styles.startOpen : ''}`}
        onPointerDown={onStart}
        aria-label="Start"
        aria-expanded={startMenuOpen}
      >
        <FlagIcon size={18} className={styles.flag} />
        <span>start</span>
      </button>

      <div className={styles.tasks}>
        {windows.map((w) => {
          const { Icon } = APPS[w.appId]
          const focused = focusedId === w.id
          return (
            <button
              key={w.id}
              type="button"
              className={`${styles.task} ${focused ? styles.taskFocus : ''}`}
              onClick={() => taskbarClick(w.id)}
              title={w.title}
            >
              <Icon size={15} className={styles.taskIcon} />
              <span className={styles.taskText}>{w.title}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.tray} aria-label="Notification area">
        <VolumeIcon size={15} />
        <span className={styles.time}>{time}</span>
      </div>
    </nav>
  )
}
