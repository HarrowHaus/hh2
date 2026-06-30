import { useRef, useState } from 'react'
import { useOS } from '../../os/store'
import { useFS } from '../../os/fs/store'
import { routeOpen } from '../../os/fs/routing'
import { parentOf } from '../../os/fs/path'
import { RunIcon } from '../../os/icons'
import type { AppArgs, AppId, AppProps } from '../../os/types'
import styles from './Run.module.css'

// Run dialog (docs/02 OS-subsystem parity) — Start ▸ Run and Win+R. Resolves an
// app alias, a VFS path, or a URI (http(s):// / ipfs:// → Internet Explorer;
// nostr: → Messenger) and opens it, like the real "Open:" box.
const ALIASES: Record<string, { appId: AppId; args?: AppArgs }> = {
  notepad: { appId: 'notepad' }, write: { appId: 'wordpad' }, wordpad: { appId: 'wordpad' },
  calc: { appId: 'calc' }, charmap: { appId: 'charmap' },
  mspaint: { appId: 'paint' }, paint: { appId: 'paint' }, pbrush: { appId: 'paint' },
  photoshop: { appId: 'photoshop' },
  iexplore: { appId: 'ie' }, explorer: { appId: 'explorer' },
  cmd: { appId: 'terminal' }, command: { appId: 'terminal' },
  sndrec32: { appId: 'recorder' }, sol: { appId: 'solitaire' }, freecell: { appId: 'freecell' },
  mshearts: { appId: 'chess' }, winmine: { appId: 'minesweeper' }, mine: { appId: 'minesweeper' },
  code: { appId: 'code' }, fontview: { appId: 'opentype' }, mplayer: { appId: 'videoplayer' },
  control: { appId: 'display' }, regedit: { appId: 'display' },
  aim: { appId: 'aim' }, mirc: { appId: 'mirc' }, foobar2000: { appId: 'foobar' }, foobar: { appId: 'foobar' },
}

export function Run({ winId }: AppProps) {
  const openApp = useOS((s) => s.openApp)
  const closeWindow = useOS((s) => s.closeWindow)
  const nodes = useFS((s) => s.nodes)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function done() { closeWindow(winId) }

  function run() {
    const v = value.trim()
    if (!v) return
    const lower = v.toLowerCase().replace(/\.exe$/, '')

    // 1) Known app alias.
    if (ALIASES[lower]) { openApp(ALIASES[lower].appId, ALIASES[lower].args); return done() }

    // 2) URI schemes.
    if (/^nostr:/i.test(v)) { openApp('aim'); return done() }
    if (/^(https?|ipfs):\/\//i.test(v)) { openApp('ie', { url: v }); return done() }

    // 3) VFS path (C:\… or /…) → open via routing.
    const node = resolveNode(v)
    if (node) {
      const t = routeOpen(node)
      if (t) { openApp(t.appId, t.args); return done() }
    }

    // 4) Bare host/domain → treat as a web address.
    if (/^[\w-]+(\.[\w-]+)+/.test(v)) { openApp('ie', { url: v }); return done() }

    setError(`Windows cannot find '${v}'. Make sure you typed the name correctly, and then try again.`)
  }

  // Resolve a Windows-style or POSIX path against the VFS.
  function resolveNode(input: string) {
    const drive = '/Local Disk (C:)'
    let p = input.replace(/\\/g, '/')
    if (/^c:/i.test(p)) p = drive + p.slice(2)
    else if (p.startsWith('/')) p = drive + p
    else return undefined
    p = p.replace(/\/+$/, '')
    if (nodes[p]) return nodes[p]
    // case-insensitive single-segment fallback under root folders
    const lc = p.toLowerCase()
    return Object.values(nodes).find((n) => n.path.toLowerCase() === lc && parentOf(n.path))
  }

  return (
    <div className={styles.run}>
      <div className={styles.top}>
        <RunIcon size={32} className={styles.icon} />
        <p className={styles.prompt}>
          Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.
        </p>
      </div>
      <form
        className={styles.row}
        onSubmit={(e) => { e.preventDefault(); run() }}
      >
        <label className={styles.label}>Open:</label>
        <input
          ref={inputRef}
          className={styles.input}
          value={value}
          autoFocus
          spellCheck={false}
          onChange={(e) => { setValue(e.target.value); setError('') }}
          aria-label="Open"
        />
      </form>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.buttons}>
        <button type="button" className={styles.btn} onClick={run}>OK</button>
        <button type="button" className={styles.btn} onClick={done}>Cancel</button>
        <button type="button" className={styles.btn} disabled>Browse...</button>
      </div>
    </div>
  )
}
