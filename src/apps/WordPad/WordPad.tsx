import { useEffect, useRef, useState } from 'react'
import tinymce from 'tinymce/tinymce'
import 'tinymce/themes/silver/theme.min.js'
import 'tinymce/models/dom/model.min.js'
import 'tinymce/icons/default/icons.min.js'
import 'tinymce/plugins/lists/plugin.min.js'
import 'tinymce/plugins/link/plugin.min.js'
import 'tinymce/plugins/table/plugin.min.js'
import 'tinymce/plugins/code/plugin.min.js'
import 'tinymce/plugins/searchreplace/plugin.min.js'
import 'tinymce/skins/ui/oxide/skin.min.css'
import contentCss from 'tinymce/skins/content/default/content.min.css?raw'
import contentUiCss from 'tinymce/skins/ui/oxide/content.min.css?raw'
import type { Editor } from 'tinymce'
import { useFS } from '../../os/fs/store'
import { useOS } from '../../os/store'
import { baseName } from '../../os/fs/path'
import type { AppProps } from '../../os/types'
import styles from './WordPad.module.css'

// WordPad (docs/08 Tier B) — a real RTF/WYSIWYG editor on TinyMCE
// (tinymce/tinymce, GPL-2.0). Self-hosted (no cloud, no API key — license_key:
// 'gpl', the owner ruling), all skins/plugins bundled into this lazy chunk, so
// it runs fully offline. Edits an .htm/.html/.rtf-ish doc from the VFS; Save (or
// Ctrl+S) writes the HTML back. TinyMCE is isolated as a separately-licensed
// module; our OS code stays MIT. "WordPad" is nominative period dressing.

const SAMPLE = '<p>A real WYSIWYG editor. Type something, then <b>Save</b>.</p>'

export function WordPad({ winId, args }: AppProps) {
  const path = args?.path as string | undefined
  const name = path ? baseName(path) : 'Document'
  const initial = useFS((s) => (path ? (s.nodes[path]?.content ?? '') : SAMPLE))
  const writeFile = useFS((s) => s.writeFile)
  const createTextFile = useFS((s) => s.createTextFile)
  const setWindowTitle = useOS((s) => s.setWindowTitle)

  const hostRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const initialRef = useRef(initial)
  const pathRef = useRef(path)
  const [status, setStatus] = useState('')

  function save() {
    const editor = editorRef.current
    if (!editor) return
    const html = editor.getContent()
    let target = pathRef.current
    if (!target) {
      // Scratch buffer → create a new document in Documents.
      target = createTextFile('/Local Disk (C:)/Documents and Settings/owner/My Documents')
      pathRef.current = target
    }
    writeFile(target, html)
    setWindowTitle(winId, `${baseName(target)} — WordPad`)
    setStatus('saved')
    setTimeout(() => setStatus(''), 1500)
  }

  useEffect(() => {
    let removed = false
    void tinymce.init({
      target: hostRef.current!,
      menubar: false,
      statusbar: false,
      plugins: 'lists link table code searchreplace',
      toolbar:
        'undo redo | blocks | bold italic underline | forecolor | alignleft aligncenter alignright | bullist numlist | link table | code',
      skin: false,
      content_css: false,
      content_style: contentCss + '\n' + contentUiCss,
      license_key: 'gpl',
      promotion: false,
      branding: false,
      resize: false,
      height: '100%',
      setup: (editor) => {
        editorRef.current = editor
        editor.on('init', () => { if (!removed) editor.setContent(initialRef.current) })
        // Ctrl+S → save to the VFS (not the browser's save dialog).
        editor.addShortcut('meta+s', 'Save document', () => save())
      },
    })
    return () => {
      removed = true
      editorRef.current?.remove()
      editorRef.current = null
    }
    // mount once; the editor owns its buffer thereafter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.wordpad}>
      <div className={styles.bar}>
        <span className={styles.name}>{name}</span>
        <button type="button" className={styles.saveBtn} onClick={save}>Save</button>
        <span className={styles.hint}>{status || 'Ctrl+S to save'}</span>
      </div>
      <div className={styles.host}>
        <textarea ref={hostRef} defaultValue="" />
      </div>
    </div>
  )
}
