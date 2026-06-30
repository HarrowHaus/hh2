import type { MouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useOS, getFocusedId } from '../../os/store'
import { useMenu, type MenuItem } from '../../os/menu'
import { APPS } from '../../os/apps'
import { FlagIcon, VolumeIcon, VolumeMutedIcon } from '../../os/icons'
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
  const focusWindow = useOS((s) => s.focusWindow)
  const minimizeWindow = useOS((s) => s.minimizeWindow)
  const toggleMaximize = useOS((s) => s.toggleMaximize)
  const closeWindow = useOS((s) => s.closeWindow)
  const restoreWindow = useOS((s) => s.restoreWindow)
  const muted = useOS((s) => s.muted)
  const toggleMuted = useOS((s) => s.toggleMuted)
  const openMenu = useMenu((s) => s.openMenu)
  const time = useClock()

  // PointerDown + stopPropagation so the desktop's close-on-click doesn't race.
  const onStart = (e: ReactPointerEvent) => {
    e.stopPropagation()
    toggleStartMenu()
  }

  function onTaskContextMenu(e: MouseEvent, id: number) {
    e.preventDefault()
    e.stopPropagation()
    const w = windows.find((x) => x.id === id)
    if (!w) return
    const tiled = w.maximized || !!w.snapped
    const items: MenuItem[] = [
      { label: 'Restore', disabled: !tiled && !w.minimized, onClick: () => (tiled ? restoreWindow(id, w.prev?.x ?? w.x, w.prev?.y ?? w.y) : focusWindow(id)) },
      { label: 'Minimize', onClick: () => minimizeWindow(id) },
      { label: 'Maximize', onClick: () => toggleMaximize(id) },
      { separator: true },
      { label: 'Close', onClick: () => closeWindow(id) },
    ]
    openMenu(e.clientX, e.clientY, items)
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
              onContextMenu={(e) => onTaskContextMenu(e, w.id)}
              title={w.title}
            >
              <Icon size={15} className={styles.taskIcon} />
              <span className={styles.taskText}>{w.title}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.tray} aria-label="Notification area">
        <button
          type="button"
          className={styles.trayBtn}
          aria-label={muted ? 'Unmute system sounds' : 'Mute system sounds'}
          aria-pressed={muted}
          title={muted ? 'Sounds muted' : 'System sounds'}
          onClick={toggleMuted}
        >
          {muted ? <VolumeMutedIcon size={15} /> : <VolumeIcon size={15} />}
        </button>
        <span className={styles.time}>{time}</span>
      </div>
    </nav>
  )
}
