import {
  useRef,
  useState,
  type FC,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useOS } from '../../os/store'
import { useFS } from '../../os/fs/store'
import { useKeyboard } from '../../os/useKeyboard'
import { useMenu, type MenuItem } from '../../os/menu'
import { DESKTOP_PATH, listDir } from '../../os/fs/path'
import { routeOpen } from '../../os/fs/routing'
import type { FSNode } from '../../os/fs/types'
import { APPS } from '../../os/apps'
import { ComputerIcon, MonitorIcon, FolderIcon, NoteIcon, MusicIcon, ImageIcon, RecycleBinIcon } from '../../os/icons'
import { Taskbar } from '../Taskbar/Taskbar'
import { StartMenu } from '../StartMenu/StartMenu'
import { Window } from '../Window/Window'
import { ContextMenu } from '../ContextMenu/ContextMenu'
import { CrtOverlay } from '../CrtOverlay/CrtOverlay'
import { Oneko } from '../Oneko/Oneko'
import { ScreenSaver } from '../ScreenSaver/ScreenSaver'
import styles from './Desktop.module.css'

const ICON_W = 76
const ICON_H = 74
const GRID_X = 8
const GRID_Y = 8

interface DeskIcon {
  id: string
  label: string
  Icon: FC<{ size?: number }>
  open: () => void
  node?: FSNode
}

function iconFor(node: FSNode): FC<{ size?: number }> {
  if (node.app) return APPS[node.app].Icon
  if (node.type === 'folder') return FolderIcon
  if (node.kind === 'audio') return MusicIcon
  if (node.kind === 'image') return ImageIcon
  return NoteIcon
}

export function Desktop() {
  useKeyboard()
  const windows = useOS((s) => s.windows)
  const startMenuOpen = useOS((s) => s.startMenuOpen)
  const closeStartMenu = useOS((s) => s.closeStartMenu)
  const openApp = useOS((s) => s.openApp)
  const snapPreview = useOS((s) => s.snapPreview)

  const nodes = useFS((s) => s.nodes)
  const desktopPos = useFS((s) => s.desktopPos)
  const setDesktopPos = useFS((s) => s.setDesktopPos)
  const createFolder = useFS((s) => s.createFolder)
  const createTextFile = useFS((s) => s.createTextFile)
  const removeNode = useFS((s) => s.remove)
  const renameNode = useFS((s) => s.rename)
  const clipboard = useFS((s) => s.clipboard)
  const setClipboard = useFS((s) => s.setClipboard)
  const paste = useFS((s) => s.paste)

  const crt = useOS((s) => s.crt)
  const neko = useOS((s) => s.neko)

  const openMenu = useMenu((s) => s.openMenu)

  const surfaceRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)

  // System launchers, then whatever lives in the Desktop FS folder.
  const fsIcons: DeskIcon[] = listDir(nodes, DESKTOP_PATH).map((node) => ({
    id: node.path,
    label: node.name,
    Icon: iconFor(node),
    node,
    open: () => {
      const t = routeOpen(node)
      if (t) openApp(t.appId, t.args)
    },
  }))
  const icons: DeskIcon[] = [
    {
      id: 'sys:computer',
      label: 'My Computer',
      Icon: ComputerIcon,
      open: () => openApp('explorer', { path: '/', title: 'My Computer' }),
    },
    { id: 'sys:display', label: 'Control Panel', Icon: MonitorIcon, open: () => openApp('display') },
    { id: 'sys:recyclebin', label: 'Recycle Bin', Icon: RecycleBinIcon, open: () => openApp('recyclebin') },
    ...fsIcons,
  ]

  const posFor = (id: string, index: number) =>
    desktopPos[id] ?? { x: GRID_X, y: GRID_Y + index * ICON_H }

  const snapStyle =
    snapPreview === 'max'
      ? { inset: 0 }
      : snapPreview === 'left'
        ? { left: 0, top: 0, width: '50%', height: '100%' }
        : snapPreview === 'right'
          ? { left: '50%', top: 0, width: '50%', height: '100%' }
          : null

  function localPoint(e: { clientX: number; clientY: number }) {
    const r = surfaceRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  // Marquee selection on empty desktop.
  function onSurfacePointerDown(e: ReactPointerEvent) {
    if (e.target !== e.currentTarget) return
    closeStartMenu()
    setSelected(new Set())
    const start = localPoint(e)
    const onMove = (ev: PointerEvent) => {
      const p = localPoint(ev)
      const rect = {
        x: Math.min(start.x, p.x),
        y: Math.min(start.y, p.y),
        w: Math.abs(p.x - start.x),
        h: Math.abs(p.y - start.y),
      }
      setMarquee(rect)
      const hit = new Set<string>()
      icons.forEach((ic, i) => {
        const pos = posFor(ic.id, i)
        const intersects =
          pos.x < rect.x + rect.w &&
          pos.x + ICON_W > rect.x &&
          pos.y < rect.y + rect.h &&
          pos.y + ICON_H > rect.y
        if (intersects) hit.add(ic.id)
      })
      setSelected(hit)
    }
    const onUp = () => {
      setMarquee(null)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Drag an icon to rearrange (persists to FS desktopPos).
  function onIconPointerDown(e: ReactPointerEvent, ic: DeskIcon, index: number) {
    e.stopPropagation()
    setSelected(new Set([ic.id]))
    const startPos = posFor(ic.id, index)
    const origin = localPoint(e)
    let moved = false
    const onMove = (ev: PointerEvent) => {
      const p = localPoint(ev)
      const dx = p.x - origin.x
      const dy = p.y - origin.y
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return
      moved = true
      setDesktopPos(ic.id, { x: Math.max(0, startPos.x + dx), y: Math.max(0, startPos.y + dy) })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function desktopMenu(e: MouseEvent) {
    if (e.target !== e.currentTarget) return
    e.preventDefault()
    closeStartMenu()
    const items: MenuItem[] = [
      { label: 'Arrange Icons By', disabled: true },
      { label: 'Refresh' },
      { separator: true },
      { label: 'Paste', disabled: !clipboard, onClick: () => paste(DESKTOP_PATH) },
      { separator: true },
      { label: 'New Folder', onClick: () => setRenaming(createFolder(DESKTOP_PATH)) },
      { label: 'New Text Document', onClick: () => setRenaming(createTextFile(DESKTOP_PATH)) },
      { separator: true },
      { label: 'Properties', onClick: () => openApp('display') },
    ]
    openMenu(e.clientX, e.clientY, items)
  }

  function iconMenu(e: MouseEvent, ic: DeskIcon) {
    e.preventDefault()
    e.stopPropagation()
    // Keep an existing multi-selection if right-clicking inside it; else select one.
    let sel = selected
    if (!sel.has(ic.id)) {
      sel = new Set([ic.id])
      setSelected(sel)
    }
    const fsPaths = Array.from(sel).filter((id) => nodes[id]) // FS-backed icons only
    const items: MenuItem[] = [{ label: 'Open', onClick: ic.open }]
    if (ic.node) {
      items.push(
        { separator: true },
        { label: 'Cut', onClick: () => setClipboard(fsPaths, 'cut') },
        { label: 'Copy', onClick: () => setClipboard(fsPaths, 'copy') },
        { separator: true },
      )
      if (fsPaths.length === 1) items.push({ label: 'Rename', onClick: () => setRenaming(ic.id) })
      items.push({
        label: fsPaths.length > 1 ? `Delete ${fsPaths.length} items` : 'Delete',
        onClick: () => {
          fsPaths.forEach(removeNode)
          setSelected(new Set())
        },
      })
    }
    items.push({ separator: true }, { label: 'Properties', onClick: () => openApp('display') })
    openMenu(e.clientX, e.clientY, items)
  }

  return (
    <main className={styles.desktop} aria-label="Desktop">
      <div
        ref={surfaceRef}
        className={styles.surface}
        data-drop-folder={DESKTOP_PATH}
        onPointerDown={onSurfacePointerDown}
        onContextMenu={desktopMenu}
      >
        {icons.map((ic, i) => {
          const pos = posFor(ic.id, i)
          return (
            <button
              key={ic.id}
              type="button"
              className={`${styles.deskicon} ${selected.has(ic.id) ? styles.iconSelected : ''}`}
              style={{ left: pos.x, top: pos.y }}
              onPointerDown={(e) => onIconPointerDown(e, ic, i)}
              onClick={(e) => {
                e.stopPropagation()
                setSelected(new Set([ic.id]))
              }}
              onDoubleClick={ic.open}
              onContextMenu={(e) => iconMenu(e, ic)}
            >
              <ic.Icon size={32} />
              {renaming === ic.id && ic.node ? (
                <input
                  className={styles.rename}
                  defaultValue={ic.label}
                  autoFocus
                  onFocus={(e) => e.currentTarget.select()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      renameNode(ic.node!.path, (e.target as HTMLInputElement).value)
                      setRenaming(null)
                    } else if (e.key === 'Escape') setRenaming(null)
                  }}
                  onBlur={(e) => {
                    renameNode(ic.node!.path, e.currentTarget.value)
                    setRenaming(null)
                  }}
                />
              ) : (
                <span className={styles.label}>{ic.label}</span>
              )}
            </button>
          )
        })}

        {marquee && (
          <div
            className={styles.marquee}
            style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
          />
        )}

        {snapStyle && <div className={styles.snapPreview} style={snapStyle} />}

        {windows.map((w) => (
          <Window key={w.id} win={w} />
        ))}
      </div>

      {startMenuOpen && <StartMenu />}
      <Taskbar />
      <ContextMenu />
      {neko && <Oneko />}
      <ScreenSaver />
      {crt && <CrtOverlay />}
    </main>
  )
}
