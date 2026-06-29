import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useFS } from '../../os/fs/store'
import { useOS } from '../../os/store'
import { listDir, parentOf } from '../../os/fs/path'
import { routeOpen } from '../../os/fs/routing'
import { LABELS, BANDS } from '../foobar/catalog'
import type { FSNode } from '../../os/fs/types'
import type { AppProps } from '../../os/types'
import styles from './Terminal.module.css'

// A real cmd.exe over the virtual FS (docs/03): dir / cd / type / open + the
// standard cruft, AND a leak surface — hidden commands found by typing, never
// listed in help (Rule 2: nothing on screen announces the concept). Everything
// the hidden commands print is diegetic flavor, not narration.

const DRIVE = '/Local Disk (C:)'
const HOME = `${DRIVE}/Documents and Settings/owner`

// FS path -> Windows-style display path (C:\Foo\Bar).
function winPath(p: string): string {
  if (p === DRIVE) return 'C:\\'
  return 'C:' + p.slice(DRIVE.length).replace(/\//g, '\\')
}

interface Line {
  text: string
  cls?: 'in' | 'err' | 'dim'
}

export function Terminal({ winId }: AppProps) {
  const nodes = useFS((s) => s.nodes)
  const openApp = useOS((s) => s.openApp)
  const closeWindow = useOS((s) => s.closeWindow)

  const [cwd, setCwd] = useState(HOME)
  const [history, setHistory] = useState<string[]>([])
  const [hIdx, setHIdx] = useState(-1)
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<Line[]>([
    { text: 'Microsoft Windows XP [Version 5.1.2600]' },
    { text: '(C) Copyright 1985-2001 Microsoft Corp.' },
    { text: '' },
  ])

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [lines])

  const print = (out: Line[] | string[], cls?: Line['cls']) =>
    setLines((ls) => [...ls, ...out.map((t) => (typeof t === 'string' ? { text: t, cls } : t))])

  // Resolve a cd-style argument against cwd; returns a folder path or null.
  function resolveDir(arg: string): string | null {
    let dir = cwd
    const parts = arg.replace(/\//g, '\\').split('\\').filter(Boolean)
    if (arg.startsWith('\\') || arg.startsWith('/')) dir = DRIVE
    for (const part of parts) {
      if (part === '.') continue
      if (part === '..') {
        dir = dir === DRIVE ? DRIVE : parentOf(dir)
        continue
      }
      const child = Object.values(nodes).find(
        (n) => parentOf(n.path) === dir && n.type === 'folder' && n.name.toLowerCase() === part.toLowerCase(),
      )
      if (!child) return null
      dir = child.path
    }
    return dir
  }

  function findChild(name: string): FSNode | undefined {
    const lc = name.toLowerCase()
    return Object.values(nodes).find(
      (n) => parentOf(n.path) === cwd && n.name.toLowerCase() === lc,
    )
  }

  function run(raw: string) {
    const cmd = raw.trim()
    print([{ text: `${winPath(cwd)}>${raw}`, cls: 'in' }])
    if (!cmd) return
    setHistory((h) => [...h, cmd])

    const [name, ...rest] = cmd.split(/\s+/)
    const arg = rest.join(' ')
    const lc = name.toLowerCase()

    switch (lc) {
      case 'help':
      case '?':
        print([
          'For more information on a specific command, type HELP command-name',
          'CD       Displays the name of or changes the current directory.',
          'CLS      Clears the screen.',
          'DIR      Displays a list of files and subdirectories in a directory.',
          'ECHO     Displays messages.',
          'EXIT     Quits the CMD.EXE program (command interpreter).',
          'OPEN     Opens a file or program in its default application.',
          'TYPE     Displays the contents of a text file.',
          'VER      Displays the Windows version.',
        ])
        break
      case 'ver':
        print(['', 'Microsoft Windows XP [Version 5.1.2600]', ''])
        break
      case 'cls':
      case 'clear':
        setLines([])
        break
      case 'echo':
        print([arg || 'ECHO is on.'])
        break
      case 'exit':
        closeWindow(winId)
        break
      case 'cd':
      case 'chdir': {
        if (!arg) { print([winPath(cwd)]); break }
        const dir = resolveDir(arg)
        if (!dir) print(['The system cannot find the path specified.'], 'err')
        else if (nodes[dir]?.locked) print(['Access is denied.'], 'err')
        else setCwd(dir)
        break
      }
      case 'dir':
      case 'ls': {
        const items = listDir(nodes, cwd)
        print([` Directory of ${winPath(cwd)}`, ''])
        for (const n of items) {
          const d = new Date(n.ts)
          const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          const tag = n.type === 'folder' ? '<DIR>        ' : '             '
          print([`${date}  ${tag} ${n.name}`])
        }
        print([`              ${items.length} item(s)`, ''])
        break
      }
      case 'type':
      case 'cat': {
        if (!arg) { print(['The syntax of the command is incorrect.'], 'err'); break }
        const node = findChild(arg)
        if (!node) print([`The system cannot find the file specified.`], 'err')
        else if (node.type === 'folder') print(['Access is denied.'], 'err')
        else if (typeof node.content === 'string') print(node.content.split('\n'))
        else print(['(binary file — open it in its program with OPEN)'], 'dim')
        break
      }
      case 'open':
      case 'start': {
        const node = findChild(arg)
        if (!node) { print([`The system cannot find the file specified.`], 'err'); break }
        const t = routeOpen(node)
        if (t) { openApp(t.appId, t.args); print([`Opening ${node.name}...`], 'dim') }
        else print(['No application is associated with this file.'], 'err')
        break
      }

      // ---- hidden commands (not in help; found by typing) ----
      case 'whoami':
        print(['the-hand-me-down\\moldmouth'])
        break
      case 'discog': {
        print(['', 'LABELS', '------'])
        for (const l of LABELS) print([`  ${l.name}${l.founded ? `  (est. ${l.founded})` : ''}`])
        const dated = BANDS.filter((b) => b.year)
        const roster = BANDS.filter((b) => !b.year)
        print(['', 'BANDS', '-----'])
        for (const b of dated.sort((a, b) => (a.year ?? 0) - (b.year ?? 0)))
          print([`  ${b.year}  ${b.name}`])
        print(['', 'ROSTER', '------'])
        // wrap the long roster a few names per line
        for (let i = 0; i < roster.length; i += 3)
          print(['  ' + roster.slice(i, i + 3).map((b) => b.name).join('  ·  ')])
        print([''])
        break
      }
      case 'metal':
        print([
          '',
          'ran the labels. traded the tapes. logged every rip.',
          '  Dickcrush Records — 2012',
          '  Shaking Dog Tapes — 2013',
          '  the basement comps, the splits, the demos nobody else kept.',
          '',
          'soulseek found the unfindable. the rest i ripped myself.',
          '',
        ])
        break
      case 'horror':
        print([
          '',
          'the church of the ugly transfer:',
          '  giallo over gore (but gore is fine)',
          '  fulci. argento. the video nasties list, top to bottom.',
          '  SOV tapes with tracking lines = relics, not flaws.',
          '',
          'if it was banned somewhere, it went to the top of the queue.',
          '',
        ])
        break
      case 'weird':
        print([
          '',
          'you went looking. of course you did.',
          '',
          'C:\\weird is locked. it stays locked for now.',
          'numbers stations, sigils in MS Paint, threads that 404 before dawn.',
          'some of it is bored people at 3am. the rest is the point.',
          '',
        ], 'dim')
        break

      default:
        print([`'${name}' is not recognized as an internal or external command,`, 'operable program or batch file.'], 'err')
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      run(input)
      setInput('')
      setHIdx(-1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const i = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1)
      setHIdx(i)
      setInput(history[i])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (hIdx < 0) return
      const i = hIdx + 1
      if (i >= history.length) { setHIdx(-1); setInput('') }
      else { setHIdx(i); setInput(history[i]) }
    }
  }

  return (
    <div className={styles.term} onMouseDown={() => inputRef.current?.focus()}>
      <div className={styles.screen}>
        {lines.map((l, i) => (
          <div key={i} className={`${styles.line} ${l.cls ? styles[l.cls] : ''}`}>
            {l.text || ' '}
          </div>
        ))}
        <div className={styles.prompt}>
          <span className={styles.cwd}>{winPath(cwd)}&gt;</span>
          <input
            ref={inputRef}
            className={styles.input}
            value={input}
            spellCheck={false}
            autoFocus
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Command input"
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  )
}
