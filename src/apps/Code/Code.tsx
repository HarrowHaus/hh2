import { useEffect, useRef } from 'react'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useFS } from '../../os/fs/store'
import { useOS } from '../../os/store'
import { baseName } from '../../os/fs/path'
import type { AppProps } from '../../os/types'
import styles from './Code.module.css'

// Code editor (docs/08 Tier 3) — Monaco (MIT, the VS Code editor core) as a real
// syntax-highlighting editor, replacing the SKIP'd Vim.js/TinyMCE. Loaded lazily
// (its own bundle chunk) with the editor + JS/TS/JSON/CSS/HTML language workers
// (all bundled, no network). Edits a file from the virtual FS; Ctrl+S saves back.
;(self as unknown as { MonacoEnvironment: { getWorker: (id: string, label: string) => Worker } }).MonacoEnvironment = {
  getWorker(_id: string, label: string) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  },
}

const SAMPLE = [
  '// scratch.js — a real editor, finally.',
  "function tapeHiss(track) {",
  '  return track.replace(/silence/g, "noise")',
  '}',
  '',
  'console.log(tapeHiss("silence"))',
].join('\n')

function langFor(name: string): string {
  const ext = name.toLowerCase().split('.').pop() ?? ''
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', mjs: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    json: 'json', css: 'css', scss: 'scss', html: 'html', htm: 'html',
    md: 'markdown', py: 'python', sh: 'shell', bat: 'bat', xml: 'xml',
    ini: 'ini', cfg: 'ini', cue: 'ini', sql: 'sql', c: 'c', cpp: 'cpp',
  }
  return map[ext] ?? 'plaintext'
}

export function Code({ winId, args }: AppProps) {
  const path = args?.path as string | undefined
  const name = path ? baseName(path) : 'scratch.js'
  // Read the initial content once (selector also keeps it fresh if reopened).
  const initial = useFS((s) => (path ? (s.nodes[path]?.content ?? '') : SAMPLE))
  const writeFile = useFS((s) => s.writeFile)
  const setWindowTitle = useOS((s) => s.setWindowTitle)

  const hostRef = useRef<HTMLDivElement>(null)
  const initialRef = useRef(initial)

  useEffect(() => {
    let disposed = false
    let editor: MonacoEditor.IStandaloneCodeEditor | undefined

    void (async () => {
      const monaco = await import('monaco-editor')
      if (disposed || !hostRef.current) return
      editor = monaco.editor.create(hostRef.current, {
        value: initialRef.current,
        language: langFor(name),
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 12,
        scrollBeyondLastLine: false,
        tabSize: 2,
      })
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (path && editor) {
          writeFile(path, editor.getValue())
          setWindowTitle(winId, `${name} — Code`)
        }
      })
    })()

    return () => {
      disposed = true
      editor?.dispose()
    }
    // mount once; the editor owns its buffer thereafter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.code}>
      <div className={styles.bar}>
        <span className={styles.name}>{name}</span>
        <span className={styles.hint}>{path ? 'Ctrl+S to save' : 'scratch buffer'}</span>
      </div>
      <div ref={hostRef} className={styles.host} />
    </div>
  )
}
