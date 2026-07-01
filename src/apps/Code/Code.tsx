import { useEffect, useRef, useState } from 'react'
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

// Code editor (docs/08 Tier 3 + Tier A) — Monaco (MIT, the VS Code editor core)
// as a real syntax-highlighting editor. Loaded lazily (its own bundle chunk)
// with the editor + JS/TS/JSON/CSS/HTML language workers (all bundled, no
// network). Edits a file from the virtual FS; Ctrl+S saves back. Prettier (MIT,
// lazy) formats the buffer on Shift+Alt+F / the Format button. A status bar
// shows line/column + language.
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
    json: 'json', css: 'css', scss: 'scss', html: 'html', htm: 'html', whtml: 'html',
    md: 'markdown', py: 'python', sh: 'shell', bat: 'bat', xml: 'xml',
    ini: 'ini', cfg: 'ini', cue: 'ini', sql: 'sql', c: 'c', cpp: 'cpp',
  }
  return map[ext] ?? 'plaintext'
}

// Prettier parser + plugin set per Monaco language (lazy-imported on first use).
// Returns null for languages Prettier doesn't format (python, sql, etc.).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function prettierConfig(lang: string): Promise<{ parser: string; plugins: any[] } | null> {
  switch (lang) {
    case 'javascript': {
      const [babel, estree] = await Promise.all([import('prettier/plugins/babel'), import('prettier/plugins/estree')])
      return { parser: 'babel', plugins: [babel.default, estree.default] }
    }
    case 'typescript': {
      const [ts, estree] = await Promise.all([import('prettier/plugins/typescript'), import('prettier/plugins/estree')])
      return { parser: 'typescript', plugins: [ts.default, estree.default] }
    }
    case 'json': {
      const [babel, estree] = await Promise.all([import('prettier/plugins/babel'), import('prettier/plugins/estree')])
      return { parser: 'json', plugins: [babel.default, estree.default] }
    }
    case 'css':
    case 'scss':
    case 'less': {
      const postcss = await import('prettier/plugins/postcss')
      return { parser: lang, plugins: [postcss.default] }
    }
    case 'html': {
      const html = await import('prettier/plugins/html')
      return { parser: 'html', plugins: [html.default] }
    }
    case 'markdown': {
      const md = await import('prettier/plugins/markdown')
      return { parser: 'markdown', plugins: [md.default] }
    }
    default:
      return null
  }
}

export function Code({ winId, args }: AppProps) {
  const path = args?.path as string | undefined
  const name = path ? baseName(path) : 'scratch.js'
  const lang = langFor(name)
  // Read the initial content once (selector also keeps it fresh if reopened).
  const initial = useFS((s) => (path ? (s.nodes[path]?.content ?? '') : SAMPLE))
  const writeFile = useFS((s) => s.writeFile)
  const setWindowTitle = useOS((s) => s.setWindowTitle)

  const hostRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor>()
  const monacoRef = useRef<typeof import('monaco-editor')>()
  const initialRef = useRef(initial)
  const [pos, setPos] = useState({ ln: 1, col: 1 })
  const [status, setStatus] = useState('')

  // Format the buffer with Prettier, preserving the cursor line where possible.
  async function format() {
    const editor = editorRef.current
    if (!editor) return
    try {
      const cfg = await prettierConfig(lang)
      if (!cfg) { setStatus(`no formatter for ${lang}`); return }
      const prettier = await import('prettier/standalone')
      const out = await prettier.format(editor.getValue(), {
        parser: cfg.parser, plugins: cfg.plugins,
        semi: false, singleQuote: true, tabWidth: 2,
      })
      if (out !== editor.getValue()) {
        const sel = editor.getSelection()
        editor.executeEdits('prettier', [{ range: editor.getModel()!.getFullModelRange(), text: out }])
        if (sel) editor.setSelection(sel)
        editor.pushUndoStop()
      }
      setStatus('formatted')
    } catch (e) {
      setStatus('format failed: ' + (e instanceof Error ? e.message.split('\n')[0] : 'error'))
    }
  }

  useEffect(() => {
    let disposed = false

    void (async () => {
      const monaco = await import('monaco-editor')
      if (disposed || !hostRef.current) return
      monacoRef.current = monaco
      const editor = monaco.editor.create(hostRef.current, {
        value: initialRef.current,
        language: lang,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 12,
        scrollBeyondLastLine: false,
        tabSize: 2,
      })
      editorRef.current = editor
      editor.onDidChangeCursorPosition((e) => setPos({ ln: e.position.lineNumber, col: e.position.column }))
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (path) {
          writeFile(path, editor.getValue())
          setWindowTitle(winId, `${name} — Code`)
          setStatus('saved')
        }
      })
      // Shift+Alt+F → Prettier format (the VS Code binding).
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => { void format() })
    })()

    return () => {
      disposed = true
      editorRef.current?.dispose()
    }
    // mount once; the editor owns its buffer thereafter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.code}>
      <div className={styles.bar}>
        <span className={styles.name}>{name}</span>
        <button type="button" className={styles.fmtBtn} onClick={() => void format()} title="Format Document (Shift+Alt+F)">Format</button>
        <span className={styles.hint}>{path ? 'Ctrl+S to save' : 'scratch buffer'}</span>
      </div>
      <div ref={hostRef} className={styles.host} />
      <div className={styles.statusbar}>
        <span>Ln {pos.ln}, Col {pos.col}</span>
        <span className={styles.lang}>{lang}</span>
        {status && <span className={styles.msg}>{status}</span>}
      </div>
    </div>
  )
}
