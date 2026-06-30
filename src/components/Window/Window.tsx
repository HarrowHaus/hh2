import { Suspense, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useOS, getFocusedId, MIN_W, MIN_H } from '../../os/store'
import { useMenu, type MenuItem } from '../../os/menu'
import { runCloseGuard } from '../../os/closeGuards'
import { APPS } from '../../os/apps'
import { APP_META } from '../../os/appMeta'
import type { SnapZone, WindowInstance } from '../../os/types'
import { WindowControls } from './WindowControls'
import styles from './Window.module.css'

const TASKBAR_H = 30
const EDGE = 6
const DIRS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const

function zoneFor(clientX: number, clientY: number): SnapZone {
  if (clientY <= EDGE) return 'max'
  if (clientX <= EDGE) return 'left'
  if (clientX >= window.innerWidth - EDGE) return 'right'
  return null
}

export function Window({ win }: { win: WindowInstance }) {
  const focusWindow = useOS((s) => s.focusWindow)
  const closeWindow = useOS((s) => s.closeWindow)
  const minimizeWindow = useOS((s) => s.minimizeWindow)
  const toggleMaximize = useOS((s) => s.toggleMaximize)
  const moveWindow = useOS((s) => s.moveWindow)
  const resizeWindow = useOS((s) => s.resizeWindow)
  const snapWindow = useOS((s) => s.snapWindow)
  const restoreWindow = useOS((s) => s.restoreWindow)
  const setSnapPreview = useOS((s) => s.setSnapPreview)
  const focused = useOS((s) => getFocusedId(s.windows) === win.id)
  const openMenu = useMenu((s) => s.openMenu)

  const meta = APP_META[win.appId]
  const { Icon, Component } = APPS[win.appId]

  // Close via the guard: an app (e.g. Paint) can intercept to prompt about
  // unsaved work; otherwise close immediately.
  const requestClose = () => {
    if (!runCloseGuard(win.id, () => closeWindow(win.id))) closeWindow(win.id)
  }

  function onTitleContextMenu(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    focusWindow(win.id)
    const tiled = win.maximized || !!win.snapped
    const items: MenuItem[] = [
      { label: 'Restore', disabled: !tiled, onClick: () => restoreWindow(win.id, win.prev?.x ?? win.x, win.prev?.y ?? win.y) },
      { label: 'Minimize', onClick: () => minimizeWindow(win.id) },
      { label: 'Maximize', disabled: !meta.resizable || win.maximized, onClick: () => toggleMaximize(win.id) },
      { separator: true },
      { label: 'Close', onClick: requestClose },
    ]
    openMenu(e.clientX, e.clientY, items)
  }

  function onTitlePointerDown(e: ReactPointerEvent) {
    focusWindow(win.id)
    if ((e.target as HTMLElement).closest('button')) return

    let dx: number
    let dy: number
    if (win.maximized || win.snapped) {
      // Drag-off a tiled window: restore its floating size under the cursor.
      const w = win.prev?.width ?? win.width
      const nx = Math.max(0, e.clientX - w / 2)
      restoreWindow(win.id, nx, 0)
      dx = e.clientX - nx
      dy = e.clientY
    } else {
      dx = e.clientX - win.x
      dy = e.clientY - win.y
    }

    const onMove = (ev: PointerEvent) => {
      const x = Math.max(0, Math.min(window.innerWidth - 80, ev.clientX - dx))
      const y = Math.max(0, Math.min(window.innerHeight - TASKBAR_H - 8, ev.clientY - dy))
      moveWindow(win.id, x, y)
      setSnapPreview(zoneFor(ev.clientX, ev.clientY))
    }
    const onUp = (ev: PointerEvent) => {
      const zone = zoneFor(ev.clientX, ev.clientY)
      if (zone) snapWindow(win.id, zone)
      else setSnapPreview(null)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function onResizePointerDown(e: ReactPointerEvent, dir: (typeof DIRS)[number]) {
    e.stopPropagation()
    focusWindow(win.id)
    const start = { mx: e.clientX, my: e.clientY, x: win.x, y: win.y, w: win.width, h: win.height }

    const onMove = (ev: PointerEvent) => {
      const ddx = ev.clientX - start.mx
      const ddy = ev.clientY - start.my
      let nx = start.x
      let ny = start.y
      let nw = start.w
      let nh = start.h
      if (dir.includes('e')) nw = start.w + ddx
      if (dir.includes('s')) nh = start.h + ddy
      if (dir.includes('w')) {
        nw = start.w - ddx
        nx = start.x + ddx
      }
      if (dir.includes('n')) {
        nh = start.h - ddy
        ny = start.y + ddy
      }
      if (nw < MIN_W) {
        if (dir.includes('w')) nx -= MIN_W - nw
        nw = MIN_W
      }
      if (nh < MIN_H) {
        if (dir.includes('n')) ny -= MIN_H - nh
        nh = MIN_H
      }
      resizeWindow(win.id, { x: nx, y: ny, width: nw, height: nh })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  if (win.minimized) return null

  const style = win.maximized
    ? { left: 0, top: 0, width: '100%', height: '100%', borderRadius: 0, zIndex: win.z + 100 }
    : {
        transform: `translate(${win.x}px, ${win.y}px)`,
        width: win.width,
        height: win.height,
        zIndex: win.z + 100,
      }

  const showHandles = !win.maximized && meta.resizable

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
        onContextMenu={onTitleContextMenu}
      >
        <Icon size={15} className={styles.icon} />
        <span className={styles.title}>{win.title}</span>
        <WindowControls
          maximized={win.maximized}
          resizable={!!meta.resizable}
          onMinimize={() => minimizeWindow(win.id)}
          onToggleMaximize={() => toggleMaximize(win.id)}
          onClose={requestClose}
        />
      </div>
      <div className={styles.body}>
        {/* Each app is a lazy chunk; suspend on its first load. */}
        <Suspense fallback={<div className={styles.loading} aria-busy="true" />}>
          <Component winId={win.id} args={win.args} />
        </Suspense>
      </div>

      {showHandles &&
        DIRS.map((dir) => (
          <div
            key={dir}
            className={`${styles.handle} ${styles[`h_${dir}`]}`}
            onPointerDown={(e) => onResizePointerDown(e, dir)}
          />
        ))}
    </div>
  )
}
