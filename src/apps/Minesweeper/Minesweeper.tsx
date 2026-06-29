import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import styles from './Minesweeper.module.css'

// Real, playable Minesweeper (docs/03 GAMES — the parity flex). Classic
// Beginner board: 9x9 with 10 mines, first-click-safe flood reveal, flags,
// mine counter, smiley reset, and the seven-segment timer. No skin lifted —
// the classic grey 3D is recreated from scratch.

const ROWS = 9
const COLS = 9
const MINES = 10

interface Cell {
  mine: boolean
  adj: number
  revealed: boolean
  flagged: boolean
}
type Board = Cell[]
type Status = 'ready' | 'playing' | 'won' | 'lost'

const idx = (r: number, c: number) => r * COLS + c
const inBounds = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS

function neighbors(i: number): number[] {
  const r = Math.floor(i / COLS)
  const c = i % COLS
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      if (inBounds(r + dr, c + dc)) out.push(idx(r + dr, c + dc))
    }
  return out
}

function emptyBoard(): Board {
  return Array.from({ length: ROWS * COLS }, () => ({ mine: false, adj: 0, revealed: false, flagged: false }))
}

// Place mines after the first click, keeping the clicked cell (and its
// neighbors) mine-free so the opening is always a safe flood.
function placeMines(board: Board, safe: number): Board {
  const b = board.map((c) => ({ ...c }))
  const forbidden = new Set<number>([safe, ...neighbors(safe)])
  let placed = 0
  while (placed < MINES) {
    const i = Math.floor(Math.random() * ROWS * COLS)
    if (forbidden.has(i) || b[i].mine) continue
    b[i].mine = true
    placed++
  }
  for (let i = 0; i < b.length; i++) b[i].adj = neighbors(i).filter((n) => b[n].mine).length
  return b
}

// Reveal a cell, flood-filling across zero-adjacency regions.
function revealFrom(board: Board, start: number): Board {
  const b = board.map((c) => ({ ...c }))
  const stack = [start]
  while (stack.length) {
    const i = stack.pop()!
    const cell = b[i]
    if (cell.revealed || cell.flagged) continue
    cell.revealed = true
    if (cell.adj === 0 && !cell.mine) for (const n of neighbors(i)) if (!b[n].revealed) stack.push(n)
  }
  return b
}

export function Minesweeper() {
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [status, setStatus] = useState<Status>('ready')
  const [time, setTime] = useState(0)
  const [face, setFace] = useState<'smile' | 'scared'>('smile')

  const flags = board.filter((c) => c.flagged).length
  const minesLeft = MINES - flags

  // Timer ticks only while a game is in progress.
  useEffect(() => {
    if (status !== 'playing') return
    const t = setInterval(() => setTime((s) => Math.min(999, s + 1)), 1000)
    return () => clearInterval(t)
  }, [status])

  const reset = useCallback(() => {
    setBoard(emptyBoard())
    setStatus('ready')
    setTime(0)
    setFace('smile')
  }, [])

  function checkWin(b: Board) {
    const safeHidden = b.some((c) => !c.mine && !c.revealed)
    if (!safeHidden) {
      setStatus('won')
      // Auto-flag all mines on win, like the original.
      setBoard(b.map((c) => (c.mine ? { ...c, flagged: true } : c)))
      return true
    }
    return false
  }

  function onReveal(i: number) {
    if (status === 'won' || status === 'lost') return
    if (board[i].revealed || board[i].flagged) return

    let b = board
    if (status === 'ready') {
      b = placeMines(board, i)
      setStatus('playing')
    }

    if (b[i].mine) {
      // Boom — reveal every mine, mark the fatal one.
      const dead = b.map((c) => ({ ...c, revealed: c.mine ? true : c.revealed }))
      dead[i] = { ...dead[i], revealed: true }
      setBoard(dead)
      setStatus('lost')
      return
    }

    const revealed = revealFrom(b, i)
    if (!checkWin(revealed)) setBoard(revealed)
  }

  function onFlag(e: MouseEvent, i: number) {
    e.preventDefault()
    if (status === 'won' || status === 'lost' || status === 'ready') {
      if (status === 'ready') return
    }
    if (board[i].revealed) return
    setBoard((b) => b.map((c, j) => (j === i ? { ...c, flagged: !c.flagged } : c)))
  }

  const pad3 = (n: number) => String(Math.max(0, n)).padStart(3, '0')

  return (
    <div
      className={styles.ms}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={styles.hud}>
        <div className={styles.counter}>{pad3(minesLeft)}</div>
        <button
          type="button"
          className={styles.face}
          onClick={reset}
          aria-label="New game"
        >
          {status === 'lost' ? '😵' : status === 'won' ? '😎' : face === 'scared' ? '😮' : '🙂'}
        </button>
        <div className={styles.counter}>{pad3(time)}</div>
      </div>

      <div
        className={styles.grid}
        onMouseDown={() => status !== 'won' && status !== 'lost' && setFace('scared')}
        onMouseUp={() => setFace('smile')}
        onMouseLeave={() => setFace('smile')}
      >
        {board.map((cell, i) => {
          const cls = [styles.cell]
          if (cell.revealed) {
            cls.push(styles.revealed)
            if (cell.mine) cls.push(styles.mine)
          }
          let content = ''
          if (cell.revealed) {
            if (cell.mine) content = '💣'
            else if (cell.adj > 0) content = String(cell.adj)
          } else if (cell.flagged) {
            content = '🚩'
          }
          return (
            <button
              key={i}
              type="button"
              className={cls.join(' ')}
              data-n={cell.revealed && !cell.mine ? cell.adj : undefined}
              onClick={() => onReveal(i)}
              onContextMenu={(e) => onFlag(e, i)}
            >
              {content}
            </button>
          )
        })}
      </div>
    </div>
  )
}
