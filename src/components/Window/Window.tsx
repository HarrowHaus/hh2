import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useOS, getFocusedId } from '../../os/store'
import { APPS } from '../../os/apps'
import { APP_META } from '../../os/appMeta'
import type { WindowInstance } from '../../os/types'
import { WindowControls } from './WindowControls'
import styles from './Window.module.css'

const TASKBAR_H = 30

export function Window({ win }: { win: WindowInstance }) {
  const focusWindow = useOS((s) => s.focusWindow)
  const closeWindow = useOS((s) => s.closeWindow)
  const minimizeWindow = useOS((s) => s.minimizeWindow)
  const toggleMaximize = useOS((s) => s.toggleMaximize)
  const moveWindow = useOS((s) => s.moveWindow)
  const focused = useOS((s) => getFocusedId(s.windows) === win.id)

  const meta = APP_META[win.appId]
  const { Icon, Component } = APPS[win.appId]
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  function onTitlePointerDown(e: ReactPointerEvent) {
    focusWindow(win.id)
    if (win.maximized || (e.target as HTMLElement).closest('button')) return
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }

    const onMove = (ev: PointerEvent) => {
      if (!drag.current) return
      const x = Math.max(0, Math.min(window.innerWidth - 80, ev.clientX - drag.current.dx))
      const y = Math.max(0, Math.min(window.innerHeight - TASKBAR_H - 8, ev.clientY - drag.current.dy))
      moveWindow(win.id, x, y)
    }
    const onUp = () => {
      drag.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  if (win.minimized) return null

  const style = win.maximized
    ? { left: 0, top: 0, width: '100%', height: '100%', borderRadius: 0, zIndex: win.z }
    : {
        transform: `translate(${win.x}px, ${win.y}px)`,
        width: win.width,
        height: win.height,
        zIndex: win.z,
      }

  return (
    <div
      className={`${styles.window} ${focused ? '' : styles.inactive}`}
      style={style}
      onPointerDown={() => focusWindow(win.id)}
      role="dialog"
      aria-label={win.title}
    >
      <div
        className={styles.titlebar}
        onPointerDown={onTitlePointerDown}
        onDoubleClick={() => meta.resizable && toggleMaximize(win.id)}
      >
        <Icon size={15} className={styles.icon} />
        <span className={styles.title}>{win.title}</span>
        <WindowControls
          maximized={win.maximized}
          resizable={!!meta.resizable}
          onMinimize={() => minimizeWindow(win.id)}
          onToggleMaximize={() => toggleMaximize(win.id)}
          onClose={() => closeWindow(win.id)}
        />
      </div>
      <div className={styles.body}>
        <Component winId={win.id} />
      </div>
    </div>
  )
}
