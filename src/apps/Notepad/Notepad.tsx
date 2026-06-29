import { useState, type KeyboardEvent } from 'react'
import { useFS } from '../../os/fs/store'
import { useOS } from '../../os/store'
import { baseName } from '../../os/fs/path'
import type { AppProps } from '../../os/types'
import styles from './Notepad.module.css'

// Real Notepad: loads a text file's content from the FS, edits, and saves back
// (persists via IndexedDB). Opened blank (no path) is an unsaved scratch buffer.
export function Notepad({ winId, args }: AppProps) {
  const path = args?.path as string | undefined
  const initial = useFS((s) => (path ? (s.nodes[path]?.content ?? '') : ''))
  const writeFile = useFS((s) => s.writeFile)
  const setWindowTitle = useOS((s) => s.setWindowTitle)

  const [text, setText] = useState(initial)
  const [dirty, setDirty] = useState(false)

  function save() {
    if (!path) return
    writeFile(path, text)
    setDirty(false)
    setWindowTitle(winId, `${baseName(path)} - Notepad`)
  }

  function onKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      save()
    }
  }

  return (
    <div className={styles.notepad}>
      <div className={styles.menubar}>
        <button type="button" onClick={save} disabled={!path}>
          File
        </button>
        <button type="button" disabled>
          Edit
        </button>
        <button type="button" disabled>
          Format
        </button>
        <button type="button" disabled>
          Help
        </button>
      </div>
      <textarea
        className={styles.area}
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value)
          setDirty(true)
        }}
        onKeyDown={onKeyDown}
        aria-label="Text editor"
      />
      <div className={styles.statusbar}>{dirty ? 'Modified — Ctrl+S to save' : path ? 'Saved' : 'Untitled'}</div>
    </div>
  )
}
