import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { toPng } from 'html-to-image'
import { useOS, getFocusedId } from '../../os/store'
import { useMenu, type MenuItem } from '../../os/menu'
import { APPS } from '../../os/apps'
import { FlagIcon, VolumeIcon, VolumeMutedIcon } from '../../os/icons'
import { useClock } from './useClock'
import { Calendar } from './Calendar'
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
  const clock = useClock()
  const [calOpen, setCalOpen] = useState(false)
  const trayRef = useRef<HTMLDivElement>(null)

  // Click-away / Esc closes the calendar popup.
  useEffect(() => {
    if (!calOpen) return
    const onDown = (e: PointerEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) setCalOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCalOpen(false) }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey) }
  }, [calOpen])

  // PointerDown + stopPropagation so the desktop's close-on-click doesn't race.
  const onStart = (e: ReactPointerEvent) => {
    e.stopPropagation()
    toggleStartMenu()
  }

  // Taskbar peek preview: on hover, capture the window (downscaled + cached) via
  // html-to-image and float a thumbnail above the button. Minimized/iframe/failed
  // captures fall back to the window title.
  const peekTimer = useRef<ReturnType<typeof setTimeout>>()
  const peekCache = useRef<Map<number, { img: string; ts: number }>>(new Map())
  const [peek, setPeek] = useState<{ id: number; x: number; img: string | null } | null>(null)

  function onTaskEnter(e: MouseEvent, id: number, minimized: boolean) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    clearTimeout(peekTimer.current)
    peekTimer.current = setTimeout(async () => {
      if (minimized) { setPeek({ id, x, img: null }); return }
      const cached = peekCache.current.get(id)
      if (cached && Date.now() - cached.ts < 1500) { setPeek({ id, x, img: cached.img }); return }
      const el = document.querySelector(`[data-winid="${id}"]`) as HTMLElement | null
      if (!el) { setPeek({ id, x, img: null }); return }
      try {
        const img = await toPng(el, { pixelRatio: 0.35, cacheBust: false })
        peekCache.current.set(id, { img, ts: Date.now() })
        setPeek({ id, x, img })
      } catch { setPeek({ id, x, img: null }) }
    }, 350)
  }
  function onTaskLeave() { clearTimeout(peekTimer.current); setPeek(null) }

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
              onMouseEnter={(e) => onTaskEnter(e, w.id, w.minimized)}
              onMouseLeave={onTaskLeave}
            >
              <Icon size={15} className={styles.taskIcon} />
              <span className={styles.taskText}>{w.title}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.tray} aria-label="Notification area" ref={trayRef}>
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
        <button
          type="button"
          className={`${styles.time} ${calOpen ? styles.timeOpen : ''}`}
          title={clock.tooltip}
          aria-label={`${clock.time} — ${clock.tooltip}`}
          aria-expanded={calOpen}
          onClick={() => setCalOpen((o) => !o)}
        >
          {clock.time}
        </button>
        {calOpen && <Calendar now={clock.now} />}
      </div>

      {peek && (() => {
        const w = windows.find((x) => x.id === peek.id)
        if (!w) return null
        const { Icon } = APPS[w.appId]
        const left = Math.max(4, Math.min(peek.x - 92, window.innerWidth - 188))
        return (
          <div className={styles.peek} style={{ left }}>
            <div className={styles.peekTitle}><Icon size={13} className={styles.peekIcon} /> <span className={styles.peekName}>{w.title}</span></div>
            {peek.img
              ? <img className={styles.peekImg} src={peek.img} alt="" />
              : <div className={styles.peekFallback}><Icon size={30} /></div>}
          </div>
        )
      })()}
    </nav>
  )
}
