import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useOS } from '../../os/store'
import { useFS } from '../../os/fs/store'
import { useMenu, type MenuItem } from '../../os/menu'
import { ROOT, baseName, listDir, parentOf } from '../../os/fs/path'
import { routeOpen } from '../../os/fs/routing'
import type { FSNode } from '../../os/fs/types'
import { APPS } from '../../os/apps'
import { FolderIcon, NoteIcon, MusicIcon, ImageIcon } from '../../os/icons'
import type { AppProps } from '../../os/types'
import styles from './Explorer.module.css'

function iconFor(node: FSNode) {
  if (node.app) return APPS[node.app].Icon
  if (node.type === 'folder') return FolderIcon
  if (node.kind === 'audio') return MusicIcon
  if (node.kind === 'image') return ImageIcon
  return NoteIcon
}

const DRAG_THRESHOLD = 5

export function Explorer({ winId, args }: AppProps) {
  const nodes = useFS((s) => s.nodes)
  const createFolder = useFS((s) => s.createFolder)
  const createTextFile = useFS((s) => s.createTextFile)
  const renameNode = useFS((s) => s.rename)
  const removeNode = useFS((s) => s.remove)
  const clipboard = useFS((s) => s.clipboard)
  const setClipboard = useFS((s) => s.setClipboard)
  const paste = useFS((s) => s.paste)
  const moveNodes = useFS((s) => s.moveNodes)
  const openApp = useOS((s) => s.openApp)
  const setWindowTitle = useOS((s) => s.setWindowTitle)
  const openMenu = useMenu((s) => s.openMenu)

  const initial = (args?.path as string) || ROOT
  const [path, setPath] = useState(initial)
  const [back, setBack] = useState<string[]>([])
  const [fwd, setFwd] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [renaming, setRenaming] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ x: number; y: number; count: number } | null>(null)

  const lastIndexRef = useRef<number | null>(null)
  const justDragged = useRef(false)

  const items = useMemo(() => listDir(nodes, path), [nodes, path])
  // Editing (create/paste/delete/move) is blocked at the read-only root (drives).
  const canEdit = path !== ROOT

  // Keep the window title in sync with the current folder.
  useEffect(() => {
    setWindowTitle(winId, path === ROOT ? 'My Computer' : baseName(path))
  }, [path, winId, setWindowTitle])

  function clearSel() {
    setSelected(new Set())
  }

  function navigate(to: string) {
    if (to === path) return
    setBack((b) => [...b, path])
    setFwd([])
    clearSel()
    setPath(to)
  }
  function goBack() {
    setBack((b) => {
      if (!b.length) return b
      const prev = b[b.length - 1]
      setFwd((f) => [path, ...f])
      setPath(prev)
      clearSel()
      return b.slice(0, -1)
    })
  }
  function goForward() {
    setFwd((f) => {
      if (!f.length) return f
      const next = f[0]
      setBack((b) => [...b, path])
      setPath(next)
      clearSel()
      return f.slice(1)
    })
  }
  function goUp() {
    if (path !== ROOT) navigate(parentOf(path))
  }

  function onOpen(node: FSNode) {
    // Locked folders deny access via routeOpen (msgbox) instead of opening.
    if (node.type === 'folder' && !node.locked) {
      navigate(node.path)
      return
    }
    const target = routeOpen(node)
    if (target) openApp(target.appId, target.args)
  }

  // ---- selection ----------------------------------------------------------
  function onItemClick(e: MouseEvent, node: FSNode, index: number) {
    e.stopPropagation()
    if (justDragged.current) {
      justDragged.current = false
      return
    }
    if (e.shiftKey && lastIndexRef.current != null) {
      const [a, b] = [lastIndexRef.current, index].sort((x, y) => x - y)
      setSelected(new Set(items.slice(a, b + 1).map((n) => n.path)))
    } else if (e.ctrlKey || e.metaKey) {
      const next = new Set(selected)
      next.has(node.path) ? next.delete(node.path) : next.add(node.path)
      setSelected(next)
      lastIndexRef.current = index
    } else {
      setSelected(new Set([node.path]))
      lastIndexRef.current = index
    }
  }

  // ---- drag-move ----------------------------------------------------------
  function onItemPointerDown(e: ReactPointerEvent, node: FSNode, index: number) {
    e.stopPropagation()
    if (renaming || e.button !== 0) return
    const additive = e.ctrlKey || e.metaKey || e.shiftKey

    // Establish the drag set synchronously (state is async). A plain drag on an
    // unselected item selects just it; dragging within a selection keeps it.
    let dragSet = new Set(selected)
    if (!dragSet.has(node.path)) {
      dragSet = additive ? new Set(dragSet).add(node.path) : new Set([node.path])
    }
    if (!additive) {
      setSelected(new Set(dragSet))
      lastIndexRef.current = index
    }

    const startX = e.clientX
    const startY = e.clientY
    let moved = false
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return
      moved = true
      setDrag({ x: ev.clientX, y: ev.clientY, count: dragSet.size })
    }
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (!moved) return
      justDragged.current = true
      setDrag(null)
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null
      const dest = el?.closest<HTMLElement>('[data-drop-folder]')?.dataset.dropFolder
      // Don't drop onto a folder that's part of the dragged set, or no-op.
      if (dest && !dragSet.has(dest) && canEdit) {
        moveNodes(Array.from(dragSet), dest)
        clearSel()
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ---- context menus ------------------------------------------------------
  function viewMenu(e: MouseEvent) {
    if (e.target !== e.currentTarget) return
    e.preventDefault()
    const menu: MenuItem[] = [
      { label: 'New Folder', disabled: !canEdit, onClick: () => setRenaming(createFolder(path)) },
      { label: 'New Text Document', disabled: !canEdit, onClick: () => setRenaming(createTextFile(path)) },
      { separator: true },
      {
        label: 'Paste',
        disabled: !canEdit || !clipboard,
        onClick: () => {
          paste(path)
          clearSel()
        },
      },
      { label: 'Select All', disabled: !items.length, onClick: () => setSelected(new Set(items.map((n) => n.path))) },
      { separator: true },
      { label: 'Refresh' },
    ]
    openMenu(e.clientX, e.clientY, menu)
  }

  function itemMenu(e: MouseEvent, node: FSNode) {
    e.preventDefault()
    e.stopPropagation()
    let sel = selected
    if (!sel.has(node.path)) {
      sel = new Set([node.path])
      setSelected(sel)
    }
    const arr = Array.from(sel)
    const single = arr.length === 1
    const menu: MenuItem[] = []
    if (single) menu.push({ label: 'Open', onClick: () => onOpen(node) }, { separator: true })
    menu.push(
      { label: 'Cut', disabled: !canEdit, onClick: () => setClipboard(arr, 'cut') },
      { label: 'Copy', disabled: !canEdit, onClick: () => setClipboard(arr, 'copy') },
    )
    if (single && node.type === 'folder' && !node.locked && clipboard) {
      menu.push({
        label: 'Paste',
        onClick: () => {
          paste(node.path)
          clearSel()
        },
      })
    }
    menu.push(
      { separator: true },
      {
        label: arr.length > 1 ? `Delete ${arr.length} items` : 'Delete',
        disabled: !canEdit,
        onClick: () => {
          arr.forEach(removeNode)
          clearSel()
        },
      },
    )
    if (single) menu.push({ label: 'Rename', disabled: !canEdit, onClick: () => setRenaming(node.path) })
    openMenu(e.clientX, e.clientY, menu)
  }

  // ---- keyboard -----------------------------------------------------------
  function onKeyDown(e: KeyboardEvent) {
    if (renaming) return
    const mod = e.ctrlKey || e.metaKey
    const arr = Array.from(selected)
    const k = e.key.toLowerCase()
    if (mod && k === 'a') {
      e.preventDefault()
      setSelected(new Set(items.map((n) => n.path)))
    } else if (mod && k === 'c' && arr.length && canEdit) {
      setClipboard(arr, 'copy')
    } else if (mod && k === 'x' && arr.length && canEdit) {
      setClipboard(arr, 'cut')
    } else if (mod && k === 'v' && clipboard && canEdit) {
      paste(path)
      clearSel()
    } else if (e.key === 'Delete' && arr.length && canEdit) {
      arr.forEach(removeNode)
      clearSel()
    } else if (e.key === 'F2' && arr.length === 1 && canEdit) {
      setRenaming(arr[0])
    } else if (e.key === 'Escape') {
      clearSel()
    }
  }

  return (
    <div className={styles.explorer} data-drop-folder={path === ROOT ? undefined : path}>
      <div className={styles.menubar}>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Favorites</span>
        <span>Tools</span>
        <span>Help</span>
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={styles.tbtn} onClick={goBack} disabled={!back.length}>
          ← Back
        </button>
        <button type="button" className={styles.tbtn} onClick={goForward} disabled={!fwd.length}>
          Forward →
        </button>
        <button
          type="button"
          className={styles.tbtn}
          onClick={goUp}
          disabled={path === ROOT}
          data-drop-folder={path === ROOT ? undefined : parentOf(path)}
        >
          ↑ Up
        </button>
      </div>

      <div className={styles.address}>
        <span>Address</span>
        <div className={styles.addressbox}>{path === ROOT ? 'My Computer' : path}</div>
      </div>

      <div
        className={styles.view}
        tabIndex={0}
        onClick={clearSel}
        onContextMenu={viewMenu}
        onKeyDown={onKeyDown}
      >
        {items.length === 0 && <div className={styles.empty}>This folder is empty.</div>}
        {items.map((node, index) => {
          const Icon = iconFor(node)
          const isCut = clipboard?.op === 'cut' && clipboard.paths.includes(node.path)
          const dropFolder = node.type === 'folder' && !node.locked ? node.path : undefined
          return (
            <button
              key={node.path}
              type="button"
              data-drop-folder={dropFolder}
              className={`${styles.item} ${selected.has(node.path) ? styles.selected : ''} ${isCut ? styles.cut : ''}`}
              onPointerDown={(e) => onItemPointerDown(e, node, index)}
              onClick={(e) => onItemClick(e, node, index)}
              onDoubleClick={() => onOpen(node)}
              onContextMenu={(e) => itemMenu(e, node)}
            >
              <Icon size={32} />
              {renaming === node.path ? (
                <input
                  className={styles.renameInput}
                  defaultValue={node.name}
                  autoFocus
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') {
                      renameNode(node.path, (e.target as HTMLInputElement).value)
                      setRenaming(null)
                    } else if (e.key === 'Escape') setRenaming(null)
                  }}
                  onBlur={(e) => {
                    renameNode(node.path, e.currentTarget.value)
                    setRenaming(null)
                  }}
                />
              ) : (
                <span className={styles.label}>{node.name}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.statusbar}>
        {selected.size > 0
          ? `${selected.size} of ${items.length} selected`
          : `${items.length} object${items.length === 1 ? '' : 's'}`}
      </div>

      {drag && (
        <div className={styles.ghost} style={{ left: drag.x + 10, top: drag.y + 8 }}>
          {drag.count} item{drag.count === 1 ? '' : 's'}
        </div>
      )}
    </div>
  )
}
