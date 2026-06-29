import { useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useOS } from '../../os/store'
import type { AppId } from '../../os/types'
import { ComputerIcon, MonitorIcon } from '../../os/icons'
import { Taskbar } from '../Taskbar/Taskbar'
import { StartMenu } from '../StartMenu/StartMenu'
import { Window } from '../Window/Window'
import styles from './Desktop.module.css'

interface Ctx {
  x: number
  y: number
}

const DESKTOP_ICONS: { appId: AppId; args?: Record<string, unknown>; label: string; Icon: typeof ComputerIcon }[] = [
  { appId: 'explorer', args: { path: '/', title: 'My Computer' }, label: 'My Computer', Icon: ComputerIcon },
  { appId: 'display', label: 'Control Panel', Icon: MonitorIcon },
]

export function Desktop() {
  const windows = useOS((s) => s.windows)
  const startMenuOpen = useOS((s) => s.startMenuOpen)
  const closeStartMenu = useOS((s) => s.closeStartMenu)
  const openApp = useOS((s) => s.openApp)
  const snapPreview = useOS((s) => s.snapPreview)
  const [ctx, setCtx] = useState<Ctx | null>(null)

  const snapStyle =
    snapPreview === 'max'
      ? { inset: 0 }
      : snapPreview === 'left'
        ? { left: 0, top: 0, width: '50%', height: '100%' }
        : snapPreview === 'right'
          ? { left: '50%', top: 0, width: '50%', height: '100%' }
          : null

  const onSurfacePointerDown = (e: ReactPointerEvent) => {
    if (e.target !== e.currentTarget) return
    closeStartMenu()
    setCtx(null)
  }

  const onContextMenu = (e: MouseEvent) => {
    if (e.target !== e.currentTarget) return
    e.preventDefault()
    closeStartMenu()
    setCtx({ x: e.clientX, y: e.clientY })
  }

  return (
    <main className={styles.desktop} aria-label="Desktop">
      <div
        className={styles.surface}
        onPointerDown={onSurfacePointerDown}
        onContextMenu={onContextMenu}
      >
        <div className={styles.icons}>
          {DESKTOP_ICONS.map(({ appId, args, label, Icon }) => (
            <button
              key={label}
              type="button"
              className={styles.deskicon}
              onDoubleClick={() => openApp(appId, args)}
            >
              <Icon size={32} />
              <span className={styles.label}>{label}</span>
            </button>
          ))}
        </div>

        {snapStyle && <div className={styles.snapPreview} style={snapStyle} />}

        {windows.map((w) => (
          <Window key={w.id} win={w} />
        ))}

        {ctx && (
          <div
            className={styles.ctx}
            style={{ left: ctx.x, top: ctx.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className={`${styles.ctxItem} ${styles.disabled}`}>Arrange Icons By</div>
            <div className={`${styles.ctxItem}`} onClick={() => setCtx(null)}>
              Refresh
            </div>
            <div className={styles.ctxSep} />
            <div className={`${styles.ctxItem} ${styles.disabled}`}>New</div>
            <div className={styles.ctxSep} />
            <div
              className={styles.ctxItem}
              onClick={() => {
                openApp('display')
                setCtx(null)
              }}
            >
              Properties
            </div>
          </div>
        )}
      </div>

      {startMenuOpen && <StartMenu />}
      <Taskbar />
    </main>
  )
}
