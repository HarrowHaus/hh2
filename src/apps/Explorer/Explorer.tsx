import { useEffect, useMemo, useState } from 'react'
import { useOS } from '../../os/store'
import { useFS } from '../../os/fs/store'
import { ROOT, baseName, listDir, parentOf } from '../../os/fs/path'
import { routeOpen } from '../../os/fs/routing'
import type { FSNode } from '../../os/fs/types'
import { FolderIcon, NoteIcon, MusicIcon } from '../../os/icons'
import type { AppProps } from '../../os/types'
import styles from './Explorer.module.css'

function iconFor(node: FSNode) {
  if (node.type === 'folder') return FolderIcon
  if (node.kind === 'audio') return MusicIcon
  return NoteIcon
}

export function Explorer({ winId, args }: AppProps) {
  const nodes = useFS((s) => s.nodes)
  const openApp = useOS((s) => s.openApp)
  const setWindowTitle = useOS((s) => s.setWindowTitle)

  const initial = (args?.path as string) || ROOT
  const [path, setPath] = useState(initial)
  const [back, setBack] = useState<string[]>([])
  const [fwd, setFwd] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const items = useMemo(() => listDir(nodes, path), [nodes, path])

  // Keep the window title in sync with the current folder.
  useEffect(() => {
    setWindowTitle(winId, path === ROOT ? 'My Computer' : baseName(path))
  }, [path, winId, setWindowTitle])

  function navigate(to: string) {
    if (to === path) return
    setBack((b) => [...b, path])
    setFwd([])
    setSelected(null)
    setPath(to)
  }
  function goBack() {
    setBack((b) => {
      if (!b.length) return b
      const prev = b[b.length - 1]
      setFwd((f) => [path, ...f])
      setPath(prev)
      setSelected(null)
      return b.slice(0, -1)
    })
  }
  function goForward() {
    setFwd((f) => {
      if (!f.length) return f
      const next = f[0]
      setBack((b) => [...b, path])
      setPath(next)
      setSelected(null)
      return f.slice(1)
    })
  }
  function goUp() {
    if (path !== ROOT) navigate(parentOf(path))
  }

  function onOpen(node: FSNode) {
    if (node.type === 'folder') {
      navigate(node.path)
      return
    }
    const target = routeOpen(node)
    if (target) openApp(target.appId, target.args)
  }

  return (
    <div className={styles.explorer}>
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
        <button type="button" className={styles.tbtn} onClick={goUp} disabled={path === ROOT}>
          ↑ Up
        </button>
      </div>

      <div className={styles.address}>
        <span>Address</span>
        <div className={styles.addressbox}>{path === ROOT ? 'My Computer' : path}</div>
      </div>

      <div className={styles.view} onClick={() => setSelected(null)}>
        {items.length === 0 && <div className={styles.empty}>This folder is empty.</div>}
        {items.map((node) => {
          const Icon = iconFor(node)
          return (
            <button
              key={node.path}
              type="button"
              className={`${styles.item} ${selected === node.path ? styles.selected : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setSelected(node.path)
              }}
              onDoubleClick={() => onOpen(node)}
            >
              <Icon size={32} />
              <span className={styles.label}>{node.name}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.statusbar}>
        {items.length} object{items.length === 1 ? '' : 's'}
      </div>
    </div>
  )
}
