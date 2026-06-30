import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useFS } from '../../os/fs/store'
import { useOS } from '../../os/store'
import { listDir, parentOf } from '../../os/fs/path'
import { routeOpen } from '../../os/fs/routing'
import { LABELS, BANDS } from '../foobar/catalog'
import type { FSNode } from '../../os/fs/types'
import type { AppArgs, AppId, AppProps } from '../../os/types'
import styles from './Terminal.module.css'

// A real xterm.js terminal over the virtual FS (docs/08 Tier A): the actual
// daedalOS terminal engine, driving a cmd.exe-style shell we own. Real line
// editing, command history, Tab autocomplete, and pipes (| grep / more / sort /
// wc). Plus a leak surface — hidden commands found by typing, never listed in
// help (Rule 2: nothing on screen announces the concept). git / python / ffmpeg
// arrive with the vendored wasm pack (later tier); until then they read as
// "not recognized", which is the honest XP behavior.

const DRIVE = '/Local Disk (C:)'
const HOME = `${DRIVE}/Documents and Settings/owner`

// ANSI colors (scene-kid dark palette).
const A = {
  reset: '\x1b[0m',
  err: '\x1b[91m',
  dim: '\x1b[90m',
  prompt: '\x1b[92m',
  accent: '\x1b[96m',
  warn: '\x1b[93m',
}

// FS path -> Windows-style display path (C:\Foo\Bar).
function winPath(p: string): string {
  if (p === DRIVE) return 'C:\\'
  return 'C:' + p.slice(DRIVE.length).replace(/\//g, '\\')
}

// Commands offered by Tab-autocomplete (visible ones; hidden stay hidden).
const COMMANDS = [
  'cd', 'cls', 'clear', 'dir', 'ls', 'echo', 'exit', 'help', 'open', 'start',
  'type', 'cat', 'ver', 'pwd', 'history', 'date', 'time', 'neofetch', 'weather',
]

// A line-editing shell bound to one xterm instance. State lives on the instance
// (not React) so the read loop never sees stale closures.
class Shell {
  private cwd = HOME
  private buf = ''
  private pos = 0
  private history: string[] = []
  private hIdx = -1
  private busy = false

  constructor(
    private term: XTerm,
    private deps: {
      nodes: () => Record<string, FSNode>
      openApp: (id: AppId, args?: AppArgs) => void
      closeWindow: () => void
    },
  ) {}

  start() {
    this.term.writeln('Microsoft Windows XP [Version 5.1.2600]')
    this.term.writeln('(C) Copyright 1985-2001 Microsoft Corp.')
    this.term.writeln('')
    this.prompt()
    this.term.onData((d) => this.onData(d))
  }

  private promptStr() {
    return `${A.prompt}${winPath(this.cwd)}>${A.reset}`
  }
  private prompt() {
    this.term.write(this.promptStr())
  }
  // Rewrite the current input line in place (handles mid-line edits cleanly).
  private render() {
    this.term.write('\r\x1b[K' + this.promptStr() + this.buf)
    const back = this.buf.length - this.pos
    if (back > 0) this.term.write(`\x1b[${back}D`)
  }

  private println(s = '', color?: string) {
    this.term.writeln(color ? color + s + A.reset : s)
  }

  private onData(data: string) {
    if (this.busy) return
    // Escape sequences (arrows, delete).
    if (data === '\x1b[A') return this.histUp()
    if (data === '\x1b[B') return this.histDown()
    if (data === '\x1b[C') { if (this.pos < this.buf.length) { this.pos++; this.term.write('\x1b[C') } return }
    if (data === '\x1b[D') { if (this.pos > 0) { this.pos--; this.term.write('\x1b[D') } return }
    if (data === '\x1b[3~') { // delete
      if (this.pos < this.buf.length) { this.buf = this.buf.slice(0, this.pos) + this.buf.slice(this.pos + 1); this.render() }
      return
    }
    if (data === '\r') return this.submit()
    if (data === '\x7f' || data === '\b') return this.backspace()
    if (data === '\t') return this.complete()
    if (data === '\x03') { this.term.write('^C\r\n'); this.buf = ''; this.pos = 0; this.hIdx = -1; this.prompt(); return }
    if (data === '\x0c') { this.term.write('\x1b[2J\x1b[H'); this.prompt(); this.render(); return } // Ctrl+L
    // Printable (ignore other control/escape chunks).
    if (data.charCodeAt(0) < 32) return
    this.buf = this.buf.slice(0, this.pos) + data + this.buf.slice(this.pos)
    this.pos += data.length
    this.render()
  }

  private backspace() {
    if (this.pos === 0) return
    this.buf = this.buf.slice(0, this.pos - 1) + this.buf.slice(this.pos)
    this.pos--
    this.render()
  }
  private histUp() {
    if (!this.history.length) return
    this.hIdx = this.hIdx < 0 ? this.history.length - 1 : Math.max(0, this.hIdx - 1)
    this.buf = this.history[this.hIdx]; this.pos = this.buf.length; this.render()
  }
  private histDown() {
    if (this.hIdx < 0) return
    const i = this.hIdx + 1
    if (i >= this.history.length) { this.hIdx = -1; this.buf = ''; this.pos = 0 }
    else { this.hIdx = i; this.buf = this.history[i]; this.pos = this.buf.length }
    this.render()
  }

  // Tab autocomplete: first word → command name; later words → path in cwd.
  private complete() {
    const head = this.buf.slice(0, this.pos)
    const parts = head.split(/\s+/)
    const word = parts[parts.length - 1]
    const isFirst = parts.length === 1
    let pool: string[]
    if (isFirst) pool = COMMANDS
    else pool = listDir(this.deps.nodes(), this.cwd).map((n) => n.name)
    const matches = pool.filter((c) => c.toLowerCase().startsWith(word.toLowerCase()))
    if (!matches.length) return
    let add: string
    if (matches.length === 1) add = matches[0]
    else {
      // longest common prefix
      add = matches.reduce((p, c) => {
        let i = 0; while (i < p.length && i < c.length && p[i].toLowerCase() === c[i].toLowerCase()) i++
        return p.slice(0, i)
      })
      if (add.length <= word.length) { // show options
        this.term.write('\r\n')
        this.println(matches.join('   '), A.dim)
        this.prompt(); this.render(); return
      }
    }
    const insert = add.slice(word.length)
    this.buf = this.buf.slice(0, this.pos) + insert + this.buf.slice(this.pos)
    this.pos += insert.length
    this.render()
  }

  private async submit() {
    const cmd = this.buf
    this.term.write('\r\n')
    this.buf = ''; this.pos = 0; this.hIdx = -1
    const trimmed = cmd.trim()
    if (trimmed) this.history.push(trimmed)
    if (trimmed) {
      this.busy = true
      try { await this.run(trimmed) } finally { this.busy = false }
    }
    this.prompt()
  }

  // ── command pipeline ────────────────────────────────────────────────────
  private async run(line: string) {
    const segments = line.split('|').map((s) => s.trim())
    let lines: string[] | null = await this.exec(segments[0])
    for (let i = 1; i < segments.length; i++) {
      lines = this.filter(lines ?? [], segments[i])
    }
    if (lines) for (const l of lines) this.println(l)
  }

  // Pipe filters: grep/find <pat>, more/head [n], sort, wc.
  private filter(input: string[], seg: string): string[] {
    const [name, ...rest] = seg.split(/\s+/)
    const arg = rest.join(' ')
    switch (name.toLowerCase()) {
      case 'grep':
      case 'find': {
        const pat = arg.replace(/^["']|["']$/g, '').toLowerCase()
        return input.filter((l) => l.toLowerCase().includes(pat))
      }
      case 'more':
      case 'head': {
        const n = parseInt(arg, 10) || 20
        return input.slice(0, n)
      }
      case 'tail': {
        const n = parseInt(arg, 10) || 20
        return input.slice(-n)
      }
      case 'sort':
        return [...input].sort((a, b) => a.localeCompare(b))
      case 'wc':
        return [String(input.length)]
      default:
        return [`${A.err}'${name}' is not a recognized filter.${A.reset}`]
    }
  }

  // Resolve a cd-style argument against cwd; returns a folder path or null.
  private resolveDir(arg: string): string | null {
    const nodes = this.deps.nodes()
    let dir = this.cwd
    const parts = arg.replace(/\//g, '\\').split('\\').filter(Boolean)
    if (arg.startsWith('\\') || arg.startsWith('/')) dir = DRIVE
    for (const part of parts) {
      if (part === '.') continue
      if (part === '..') { dir = dir === DRIVE ? DRIVE : parentOf(dir); continue }
      const child = Object.values(nodes).find(
        (n) => parentOf(n.path) === dir && n.type === 'folder' && n.name.toLowerCase() === part.toLowerCase(),
      )
      if (!child) return null
      dir = child.path
    }
    return dir
  }
  private findChild(name: string): FSNode | undefined {
    const nodes = this.deps.nodes()
    const lc = name.toLowerCase()
    return Object.values(nodes).find((n) => parentOf(n.path) === this.cwd && n.name.toLowerCase() === lc)
  }

  // Execute one command segment → output lines (or null for side-effect-only).
  private async exec(cmd: string): Promise<string[] | null> {
    const [name, ...rest] = cmd.split(/\s+/)
    const arg = rest.join(' ')
    const lc = name.toLowerCase()
    const nodes = this.deps.nodes()
    switch (lc) {
      case 'help':
      case '?':
        return [
          'For more information on a specific command, type HELP command-name',
          'CD       Displays the name of or changes the current directory.',
          'CLS      Clears the screen.',
          'DIR      Displays a list of files and subdirectories in a directory.',
          'ECHO     Displays messages.',
          'EXIT     Quits the CMD.EXE program (command interpreter).',
          'HISTORY  Displays the command history.',
          'NEOFETCH Displays system information.',
          'OPEN     Opens a file or program in its default application.',
          'PWD      Displays the current directory path.',
          'TYPE     Displays the contents of a text file.',
          'VER      Displays the Windows version.',
          'WEATHER  Shows the weather for a city (needs a connection).',
          '',
          'Commands can be piped:  dir | grep tape | sort',
        ]
      case 'ver':
        return ['', 'Microsoft Windows XP [Version 5.1.2600]', '']
      case 'cls':
      case 'clear':
        this.term.write('\x1b[2J\x1b[H')
        return null
      case 'echo':
        return [arg || 'ECHO is on.']
      case 'exit':
        this.deps.closeWindow()
        return null
      case 'pwd':
        return [winPath(this.cwd)]
      case 'history':
        return this.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`)
      case 'date':
        return [`The current date is: ${new Date().toDateString()}`]
      case 'time':
        return [`The current time is: ${new Date().toLocaleTimeString()}`]
      case 'cd':
      case 'chdir': {
        if (!arg) return [winPath(this.cwd)]
        const dir = this.resolveDir(arg)
        if (!dir) return [`${A.err}The system cannot find the path specified.${A.reset}`]
        if (nodes[dir]?.locked) return [`${A.err}Access is denied.${A.reset}`]
        this.cwd = dir
        return null
      }
      case 'dir':
      case 'ls': {
        const items = listDir(nodes, this.cwd)
        const out = [` Directory of ${winPath(this.cwd)}`, '']
        for (const n of items) {
          const d = new Date(n.ts)
          const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          const tag = n.type === 'folder' ? '<DIR>        ' : '             '
          out.push(`${date}  ${tag} ${n.name}`)
        }
        out.push(`              ${items.length} item(s)`, '')
        return out
      }
      case 'type':
      case 'cat': {
        if (!arg) return [`${A.err}The syntax of the command is incorrect.${A.reset}`]
        const node = this.findChild(arg)
        if (!node) return [`${A.err}The system cannot find the file specified.${A.reset}`]
        if (node.type === 'folder') return [`${A.err}Access is denied.${A.reset}`]
        if (typeof node.content === 'string') return node.content.split('\n')
        return [`${A.dim}(binary file — open it in its program with OPEN)${A.reset}`]
      }
      case 'open':
      case 'start': {
        const node = this.findChild(arg)
        if (!node) return [`${A.err}The system cannot find the file specified.${A.reset}`]
        const t = routeOpen(node)
        if (t) { this.deps.openApp(t.appId, t.args); return [`${A.dim}Opening ${node.name}...${A.reset}`] }
        return [`${A.err}No application is associated with this file.${A.reset}`]
      }
      case 'neofetch':
        return this.neofetch()
      case 'weather':
        return this.weather(arg)

      // ---- hidden commands (not in help; found by typing) ----
      case 'whoami':
        return ['the-hand-me-down\\moldmouth']
      case 'discog': {
        const out = ['', 'LABELS', '------']
        for (const l of LABELS) out.push(`  ${l.name}${l.founded ? `  (est. ${l.founded})` : ''}`)
        const dated = BANDS.filter((b) => b.year)
        const roster = BANDS.filter((b) => !b.year)
        out.push('', 'BANDS', '-----')
        for (const b of dated.sort((a, b) => (a.year ?? 0) - (b.year ?? 0))) out.push(`  ${b.year}  ${b.name}`)
        out.push('', 'ROSTER', '------')
        for (let i = 0; i < roster.length; i += 3) out.push('  ' + roster.slice(i, i + 3).map((b) => b.name).join('  ·  '))
        out.push('')
        return out
      }
      case 'metal':
        return ['', 'ran the labels. traded the tapes. logged every rip.', '  Dickcrush Records — 2012', '  Shaking Dog Tapes — 2013', '  the basement comps, the splits, the demos nobody else kept.', '', 'soulseek found the unfindable. the rest i ripped myself.', '']
      case 'horror':
        return ['', 'the church of the ugly transfer:', '  giallo over gore (but gore is fine)', '  fulci. argento. the video nasties list, top to bottom.', '  SOV tapes with tracking lines = relics, not flaws.', '', 'if it was banned somewhere, it went to the top of the queue.', '']
      case 'weird':
        return [`${A.dim}`, 'you went looking. of course you did.', '', 'C:\\weird is locked. it stays locked for now.', 'numbers stations, sigils in MS Paint, threads that 404 before dawn.', 'some of it is bored people at 3am. the rest is the point.', `${A.reset}`]

      default:
        return [`${A.err}'${name}' is not recognized as an internal or external command,${A.reset}`, `${A.err}operable program or batch file.${A.reset}`]
    }
  }

  private neofetch(): string[] {
    const art = [
      `${A.accent}        .-=========-.    ${A.reset}`,
      `${A.accent}       /  .  ___  .  \\   ${A.reset}`,
      `${A.accent}      |  /  (o o)  \\  |  ${A.reset}`,
      `${A.accent}      |  \\   \\_/   /  |  ${A.reset}`,
      `${A.accent}       \\  '-._.-'  /   ${A.reset}`,
      `${A.accent}        '-=======-'    ${A.reset}`,
    ]
    const info = [
      `${A.warn}moldmouth${A.reset}@${A.warn}the-hand-me-down${A.reset}`,
      '-------------------------',
      `${A.accent}OS${A.reset}:      Windows XP Professional SP3`,
      `${A.accent}Host${A.reset}:    BASEMENT-PC (hand-me-down)`,
      `${A.accent}Kernel${A.reset}:  5.1.2600`,
      `${A.accent}Shell${A.reset}:   cmd.exe (xterm.js)`,
      `${A.accent}WM${A.reset}:      Luna / bug.msstyles`,
      `${A.accent}Theme${A.reset}:   bug.msstyles (dark)`,
      `${A.accent}CPU${A.reset}:     Pentium 4 @ 2.4GHz`,
      `${A.accent}Memory${A.reset}:  512 MB`,
    ]
    const out: string[] = []
    const rows = Math.max(art.length, info.length)
    for (let i = 0; i < rows; i++) out.push((art[i] ?? ' '.repeat(26)) + '  ' + (info[i] ?? ''))
    return out
  }

  private async weather(city: string): Promise<string[]> {
    const place = city.trim() || ''
    this.println(`${A.dim}contacting wttr.in...${A.reset}`)
    try {
      const r = await fetch(`https://wttr.in/${encodeURIComponent(place)}?format=3`, { headers: { 'User-Agent': 'curl' } })
      if (!r.ok) throw new Error(String(r.status))
      const text = (await r.text()).trim()
      return [text]
    } catch {
      return [`${A.err}weather: could not reach wttr.in (no connection?).${A.reset}`]
    }
  }
}

export function Terminal({ winId }: AppProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const closeWindow = useOS((s) => s.closeWindow)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const term = new XTerm({
      convertEol: false,
      cursorBlink: true,
      fontFamily: "'Lucida Console', 'Courier New', monospace",
      fontSize: 13,
      theme: {
        background: '#0a0a0e',
        foreground: '#d8d8d8',
        cursor: '#9aff9a',
        selectionBackground: '#33335a',
      },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(host)
    fit.fit()

    const shell = new Shell(term, {
      nodes: () => useFS.getState().nodes,
      openApp: (id, args) => useOS.getState().openApp(id, args),
      closeWindow: () => closeWindow(winId),
    })
    shell.start()
    term.focus()

    const ro = new ResizeObserver(() => { try { fit.fit() } catch { /* detached */ } })
    ro.observe(host)
    return () => { ro.disconnect(); term.dispose() }
  }, [winId, closeWindow])

  return <div ref={hostRef} className={styles.host} onMouseDown={(e) => e.currentTarget.querySelector('textarea')?.focus()} />
}
