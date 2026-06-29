import { useState, type MouseEvent } from 'react'
import { useFS } from '../../os/fs/store'
import { useOS } from '../../os/store'
import { listDir } from '../../os/fs/path'
import { routeOpen } from '../../os/fs/routing'
import { APPS } from '../../os/apps'
import { NoteIcon } from '../../os/icons'
import type { FSNode } from '../../os/fs/types'
import styles from './RecycleBin.module.css'

// Recycle Bin (docs/03 leak-and-hide). A real special folder backed by
// C:\RECYCLER: lists "deleted" items with the XP task pane, Restore + Empty.
// normal_person.exe sits here as the maturation gag — shown, never told.
export const RECYCLER = '/Local Disk (C:)/RECYCLER'

function iconFor(node: FSNode) {
  if (node.app) return APPS[node.app].Icon
  return NoteIcon
}

export function RecycleBin() {
  const nodes = useFS((s) => s.nodes)
  const remove = useFS((s) => s.remove)
  const openApp = useOS((s) => s.openApp)
  const [selected, setSelected] = useState<string | null>(null)

  const items = listDir(nodes, RECYCLER)

  function open(node: FSNode) {
    const t = routeOpen(node)
    if (t) openApp(t.appId, t.args)
  }
  function emptyBin(e: MouseEvent) {
    e.preventDefault()
    for (const n of items) remove(n.path)
    setSelected(null)
  }
  function restore() {
    // "Restore" simply takes the item out of the bin (the file's prior home is
    // the Phase-8 payload's concern). Functional enough to feel real.
    if (selected) remove(selected)
    setSelected(null)
  }

  return (
    <div className={styles.bin}>
      <div className={styles.menubar}>
        <span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span>
      </div>
      <div className={styles.body}>
        <aside className={styles.tasks}>
          <div className={styles.taskPanel}>
            <div className={styles.taskHead}>Recycle Bin Tasks</div>
            <button type="button" className={styles.task} onClick={emptyBin} disabled={!items.length}>
              Empty the Recycle Bin
            </button>
            <button type="button" className={styles.task} onClick={restore} disabled={!selected}>
              Restore this item
            </button>
          </div>
        </aside>

        <div className={styles.view} onClick={() => setSelected(null)} onContextMenu={emptyBin}>
          {items.length === 0 && <div className={styles.empty}>The Recycle Bin is empty.</div>}
          {items.map((node) => {
            const Icon = iconFor(node)
            return (
              <button
                key={node.path}
                type="button"
                className={`${styles.item} ${selected === node.path ? styles.selected : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelected(node.path) }}
                onDoubleClick={() => open(node)}
              >
                <Icon size={32} />
                <span className={styles.label}>{node.name}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className={styles.statusbar}>{items.length} object{items.length === 1 ? '' : 's'}</div>
    </div>
  )
}
