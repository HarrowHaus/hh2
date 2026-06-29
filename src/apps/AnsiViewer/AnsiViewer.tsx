import type { ReactNode } from 'react'
import type { AppProps } from '../../os/types'
import { useFS } from '../../os/fs/store'
import styles from './AnsiViewer.module.css'

// 16-color VGA palette (EGA/CGA canonical)
const VGA_PALETTE: string[] = [
  '#000000', // 0  black
  '#AA0000', // 1  red
  '#00AA00', // 2  green
  '#AA5500', // 3  brown/olive
  '#0000AA', // 4  blue
  '#AA00AA', // 5  magenta
  '#00AAAA', // 6  cyan
  '#AAAAAA', // 7  light grey
  '#555555', // 8  dark grey
  '#FF5555', // 9  bright red
  '#55FF55', // 10 bright green
  '#FFFF55', // 11 bright yellow
  '#5555FF', // 12 bright blue
  '#FF55FF', // 13 bright magenta
  '#55FFFF', // 14 bright cyan
  '#FFFFFF', // 15 bright white
]

interface Span {
  text: string
  fg: number  // 0-15
  bg: number  // 0-15
  bold: boolean
}

interface SauceRecord {
  title: string
  author: string
  group: string
}

// Strip SAUCE record from content and parse title/author/group
function parseSauce(raw: string): { body: string; sauce: SauceRecord | null } {
  // SAUCE magic starts at byte offset (typically last 128 bytes)
  const SAUCE_MAGIC = 'SAUCE00'
  const EOF_CHAR = '\x1a'

  // Look for SAUCE marker
  const sauceIdx = raw.lastIndexOf(SAUCE_MAGIC)
  if (sauceIdx === -1) {
    // No SAUCE — still strip any trailing \x1a (DOS EOF)
    const eofIdx = raw.indexOf(EOF_CHAR)
    const body = eofIdx !== -1 ? raw.slice(0, eofIdx) : raw
    return { body, sauce: null }
  }

  // Strip body: cut at \x1a if it appears before SAUCE, else cut at sauceIdx
  let bodyEnd = sauceIdx
  const eofIdx = raw.indexOf(EOF_CHAR)
  if (eofIdx !== -1 && eofIdx < sauceIdx) {
    bodyEnd = eofIdx
  }
  const body = raw.slice(0, bodyEnd)

  // SAUCE record is 128 bytes; field layout (ASCII/Latin-1 fixed-length):
  // ID        5    offset 0
  // Version   2    offset 5
  // Title    35    offset 7
  // Author   20    offset 42
  // Group    20    offset 62
  const saucePart = raw.slice(sauceIdx)
  const title  = saucePart.slice(7,  42).replace(/\x00/g, '').trimEnd()
  const author = saucePart.slice(42, 62).replace(/\x00/g, '').trimEnd()
  const group  = saucePart.slice(62, 82).replace(/\x00/g, '').trimEnd()

  return { body, sauce: { title, author, group } }
}

// Parse ANSI SGR sequences into a flat list of colored spans
function parseAnsi(text: string): Span[] {
  const spans: Span[] = []
  // Parser state
  let fg = 7      // default: light grey
  let bg = 0      // default: black
  let bold = false

  // Split on ESC[ sequences; capture them
  // Groups: 1 = param string (may be empty), 2 = literal text (non-escape)
  const RE = /\x1b\[([0-9;]*)m|([^\x1b]+)/g
  let match: RegExpExecArray | null

  while ((match = RE.exec(text)) !== null) {
    if (match[2] !== undefined) {
      // Literal text chunk
      if (match[2].length > 0) {
        spans.push({ text: match[2], fg, bg, bold })
      }
    } else {
      // SGR parameter list
      const params = match[1] === '' ? [0] : match[1].split(';').map(Number)
      let i = 0
      while (i < params.length) {
        const p = params[i]
        if (p === 0) { fg = 7; bg = 0; bold = false }
        else if (p === 1) { bold = true }
        else if (p === 22) { bold = false }
        else if (p >= 30 && p <= 37) { fg = p - 30 }
        else if (p === 39) { fg = 7 }
        else if (p >= 40 && p <= 47) { bg = p - 40 }
        else if (p === 49) { bg = 0 }
        else if (p >= 90 && p <= 97) { fg = (p - 90) + 8 }
        else if (p >= 100 && p <= 107) { bg = (p - 100) + 8 }
        i++
      }
    }
  }

  return spans
}

function SpanRow({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((s, i) => (
        <span
          key={i}
          style={{
            color: VGA_PALETTE[s.bold && s.fg < 8 ? s.fg + 8 : s.fg],
            backgroundColor: VGA_PALETTE[s.bg],
          }}
        >
          {s.text}
        </span>
      ))}
    </>
  )
}

function renderLines(body: string): ReactNode[] {
  const hasEscapes = body.includes('\x1b[')

  if (!hasEscapes) {
    // Plain NFO / ASCII art — render as-is (whitespace preserved via CSS)
    return [<span key="plain" style={{ color: VGA_PALETTE[7], backgroundColor: VGA_PALETTE[0] }}>{body}</span>]
  }

  // ANSI: parse per-line so we can render in rows
  const lines = body.split('\n')
  return lines.map((line, li) => {
    const spans = parseAnsi(line)
    return (
      <div key={li} className={styles.ansiLine}>
        <SpanRow spans={spans} />
      </div>
    )
  })
}

export function AnsiViewer({ winId: _winId, args }: AppProps) {
  const path = args?.path as string | undefined
  const content = useFS((s) => (path ? (s.nodes[path]?.content ?? '') : ''))
  const name    = useFS((s) => (path ? (s.nodes[path]?.name ?? 'Untitled') : 'Untitled'))

  const { body, sauce } = parseSauce(content)

  const lineCount = body.split('\n').length
  const rendered  = renderLines(body)

  const statusLeft = `${name}  —  ${lineCount} lines`
  const statusRight = sauce
    ? [sauce.title, sauce.author, sauce.group].filter(Boolean).join(' / ')
    : ''

  return (
    <div className={styles.ansi}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarLeft}>{statusLeft}</span>
        {statusRight && <span className={styles.toolbarRight}>{statusRight}</span>}
      </div>
      <div className={styles.viewport}>
        <div className={styles.canvas}>
          {rendered}
        </div>
      </div>
    </div>
  )
}
