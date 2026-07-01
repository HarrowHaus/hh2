import {
  useEffect,
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
import { ComputerIcon, FolderIcon, NoteIcon, MusicIcon, ImageIcon, RecycleBinIcon, IeIcon, BlogIcon } from '../../os/icons'
import { Taskbar } from '../Taskbar/Taskbar'
import { StartMenu } from '../StartMenu/StartMenu'
import { Window } from '../Window/Window'
import { ContextMenu } from '../ContextMenu/ContextMenu'
import { CrtOverlay } from '../CrtOverlay/CrtOverlay'
import { Oneko } from '../Oneko/Oneko'
import { ScreenSaver } from '../ScreenSaver/ScreenSaver'
import { WallpaperView, type WallFit } from './Slideshow'
import styles from './Desktop.module.css'

const ICON_W = 76
const ICON_H = 74
const GRID_X = 8
const GRID_Y = 8
// Invisible XP grid cell (docs/10 §5.1) — icons snap to these on drop.
const CELL_W = 78
const CELL_H = 76

const MYDOCS = '/Local Disk (C:)/Documents and Settings/owner/My Documents'
const BLOG_PATH = `${MYDOCS}/Blog Posts`

interface DeskIcon {
  id: string
  label: string
  Icon: FC<{ size?: number }>
  open: () => void
  node?: FSNode
  /** Shows the XP shortcut-arrow overlay (launchers + folder shortcuts). */
  shortcut?: boolean
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
  const autoArrange = useOS((s) => s.autoArrange)
  const setAutoArrange = useOS((s) => s.setAutoArrange)
  const alignToGrid = useOS((s) => s.alignToGrid)
  const setAlignToGrid = useOS((s) => s.setAlignToGrid)
  const wallpaper = useOS((s) => s.wallpaper)
  const wallpaperImage = useOS((s) => s.wallpaperImage)
  const wallpaperFit = useOS((s) => s.wallpaperFit)

  const openMenu = useMenu((s) => s.openMenu)

  const surfaceRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  // Surface height drives how many grid rows a column holds (auto-arrange/flow).
  const [surfaceH, setSurfaceH] = useState(() => (typeof window !== 'undefined' ? window.innerHeight - 80 : 600))
  useEffect(() => {
    const el = surfaceRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((es) => { for (const e of es) setSurfaceH(e.contentRect.height) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Files/launchers living in the Desktop FS folder (app-launchers = shortcuts).
  const fsIcons: DeskIcon[] = listDir(nodes, DESKTOP_PATH).map((node) => ({
    id: node.path,
    label: node.name,
    Icon: iconFor(node),
    node,
    shortcut: !!node.app,
    open: () => {
      const t = routeOpen(node)
      if (t) openApp(t.appId, t.args)
    },
  }))
  // A curated default loadout, ordered as if the owner set the PC up (docs/10
  // §5.3): the shell staples, then his shortcuts, then whatever else is on the
  // desktop. Column-major grid flow keeps it tidy, not a random pile.
  const icons: DeskIcon[] = [
    { id: 'sys:computer', label: 'My Computer', Icon: ComputerIcon, open: () => openApp('explorer', { path: '/', title: 'My Computer' }) },
    { id: 'sys:mydocs', label: 'My Documents', Icon: FolderIcon, shortcut: true, open: () => openApp('explorer', { path: MYDOCS, title: 'My Documents' }) },
    { id: 'sys:recyclebin', label: 'Recycle Bin', Icon: RecycleBinIcon, open: () => openApp('recyclebin') },
    { id: 'sys:ie', label: 'Internet Explorer', Icon: IeIcon, shortcut: true, open: () => openApp('ie') },
    { id: 'sys:blog', label: 'Blog', Icon: BlogIcon, shortcut: true, open: () => openApp('explorer', { path: BLOG_PATH, title: 'Blog Posts' }) },
    ...fsIcons,
  ]

  // Column-major grid flow position for an icon index (auto-arrange + default).
  const rows = Math.max(1, Math.floor((surfaceH - GRID_Y) / CELL_H))
  const flowPos = (index: number) => ({ x: GRID_X + Math.floor(index / rows) * CELL_W, y: GRID_Y + (index % rows) * CELL_H })
  const posFor = (id: string, index: number) =>
    autoArrange ? flowPos(index) : desktopPos[id] ?? flowPos(index)

  // Snap a free position to the nearest empty grid cell (column-major probe).
  const cellKey = (p: { x: number; y: number }) => `${Math.max(0, Math.round((p.x - GRID_X) / CELL_W))},${Math.max(0, Math.round((p.y - GRID_Y) / CELL_H))}`
  function snapToFree(raw: { x: number; y: number }, occupied: Set<string>) {
    let cx = Math.max(0, Math.round((raw.x - GRID_X) / CELL_W))
    let cy = Math.max(0, Math.round((raw.y - GRID_Y) / CELL_H))
    let guard = 0
    while (occupied.has(`${cx},${cy}`) && guard++ < 500) {
      cy++
      if (cy >= rows) { cy = 0; cx++ }
    }
    return { x: GRID_X + cx * CELL_W, y: GRID_Y + cy * CELL_H }
  }

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

  // Drag an icon to rearrange (persists to FS desktopPos). Under Auto Arrange the
  // grid owns placement, so dragging just selects. Otherwise, on drop the icon
  // snaps to the nearest free grid cell when Align to Grid is on (docs/10 §5.1).
  function onIconPointerDown(e: ReactPointerEvent, ic: DeskIcon, index: number) {
    e.stopPropagation()
    setSelected(new Set([ic.id]))
    if (autoArrange) return
    const startPos = posFor(ic.id, index)
    const origin = localPoint(e)
    let moved = false
    const last = { x: startPos.x, y: startPos.y }
    const onMove = (ev: PointerEvent) => {
      const p = localPoint(ev)
      const dx = p.x - origin.x
      const dy = p.y - origin.y
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return
      moved = true
      last.x = Math.max(0, startPos.x + dx)
      last.y = Math.max(0, startPos.y + dy)
      setDesktopPos(ic.id, { x: last.x, y: last.y })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (moved && alignToGrid) {
        const occupied = new Set<string>()
        icons.forEach((o, i) => { if (o.id !== ic.id) occupied.add(cellKey(posFor(o.id, i))) })
        setDesktopPos(ic.id, snapToFree(last, occupied))
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function desktopMenu(e: MouseEvent) {
    if (e.target !== e.currentTarget) return
    e.preventDefault()
    closeStartMenu()
    const items: MenuItem[] = [
      { label: `${autoArrange ? '✓ ' : '    '}Auto Arrange`, onClick: () => setAutoArrange(!autoArrange) },
      { label: `${alignToGrid ? '✓ ' : '    '}Align to Grid`, onClick: () => setAlignToGrid(!alignToGrid) },
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
      {wallpaper !== 'none' && (
        <div className={styles.wallpaper} aria-hidden="true">
          <WallpaperView id={wallpaper} image={wallpaperImage} fit={wallpaperFit as WallFit} />
        </div>
      )}
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
              // a11y: keyboard users open the icon with Enter (mouse uses
              // double-click). Guard to the button itself so the rename input's
              // own Enter handler isn't double-fired.
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target === e.currentTarget) {
                  e.preventDefault()
                  ic.open()
                }
              }}
            >
              <span className={styles.iconWrap}>
                <ic.Icon size={32} />
                {ic.shortcut && (
                  <svg className={styles.shortcut} viewBox="0 0 12 12" aria-hidden="true">
                    <rect width="12" height="12" rx="1.5" fill="#fff" stroke="#7a7a7a" strokeWidth="0.6" />
                    <path d="M3.5 8.5 L8 4 M8 4 H5 M8 4 V7" fill="none" stroke="#111" strokeWidth="1.1" strokeLinecap="square" />
                  </svg>
                )}
              </span>
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
