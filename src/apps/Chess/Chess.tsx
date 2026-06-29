import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess as ChessGame } from 'chess.js'
import type { Move, Square, PieceSymbol, Color } from 'chess.js'
import type { AppProps } from '../../os/types'
import { stockfishBestMove } from './stockfish'
import styles from './Chess.module.css'

// --- Rendering helpers -------------------------------------------------------

const WHITE_GLYPHS: Record<PieceSymbol, string> = {
  k: '♔',
  q: '♕',
  r: '♖',
  b: '♗',
  n: '♘',
  p: '♙',
}
const BLACK_GLYPHS: Record<PieceSymbol, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const

function glyphFor(type: PieceSymbol, color: Color): string {
  return color === 'w' ? WHITE_GLYPHS[type] : BLACK_GLYPHS[type]
}

// --- Engine ------------------------------------------------------------------
// Material values (centipawns) plus simple piece-square tables for positional
// nuance. Evaluation is always from WHITE's perspective; the search negates as
// it descends so each side maximises its own outcome.

const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
}

// A single pawn-style table reused (mirrored) for both colours. Index 0 = a8.
const PAWN_PST = [
  0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30,
  20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10,
  0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
]
const KNIGHT_PST = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30,
  0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20,
  20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20,
  -40, -50, -40, -30, -30, -30, -30, -40, -50,
]
const BISHOP_PST = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
  10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0,
  -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10,
  -10, -10, -10, -10, -10, -20,
]
const ROOK_PST = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0,
  -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0,
  -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
]
const QUEEN_PST = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
  5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5,
  5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10,
  -20,
]
const KING_PST = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40,
  -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40,
  -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20,
  -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
]

const PST: Record<PieceSymbol, number[]> = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
  r: ROOK_PST,
  q: QUEEN_PST,
  k: KING_PST,
}

/** Static evaluation in centipawns, positive = good for White. */
function evaluate(game: ChessGame): number {
  if (game.isCheckmate()) {
    // Side to move is checkmated → bad for them.
    return game.turn() === 'w' ? -100000 : 100000
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0
  }
  let score = 0
  const board = game.board()
  for (let r = 0; r < 8; r += 1) {
    for (let f = 0; f < 8; f += 1) {
      const piece = board[r][f]
      if (!piece) continue
      const idx = r * 8 + f
      const base = PIECE_VALUE[piece.type]
      // White uses table as-is (a8 = idx 0); Black mirrors vertically.
      const pst =
        piece.color === 'w' ? PST[piece.type][idx] : PST[piece.type][63 - idx]
      const val = base + pst
      score += piece.color === 'w' ? val : -val
    }
  }
  return score
}

/** Negamax with alpha-beta. Returns score from the perspective of side-to-move. */
function search(
  game: ChessGame,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (depth === 0 || game.isGameOver()) {
    const e = evaluate(game)
    return game.turn() === 'w' ? e : -e
  }
  let best = -Infinity
  const moves = game.moves({ verbose: true }) as Move[]
  // Order captures first for better pruning.
  moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0))
  let a = alpha
  for (const m of moves) {
    game.move({ from: m.from, to: m.to, promotion: m.promotion ?? 'q' })
    const score = -search(game, depth - 1, -beta, -a)
    game.undo()
    if (score > best) best = score
    if (best > a) a = best
    if (a >= beta) break
  }
  return best
}

/** Built-in alpha-beta minimax engine. Returns a move object or null. */
function builtinMove(
  game: ChessGame,
  depth: number,
): { from: Square; to: Square; promotion?: PieceSymbol } | null {
  const moves = game.moves({ verbose: true }) as Move[]
  if (moves.length === 0) return null
  moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0))

  let bestScore = -Infinity
  let bestMoves: Move[] = []
  let alpha = -Infinity
  const beta = Infinity
  for (const m of moves) {
    game.move({ from: m.from, to: m.to, promotion: m.promotion ?? 'q' })
    const score = -search(game, depth - 1, -beta, -alpha)
    game.undo()
    if (score > bestScore) {
      bestScore = score
      bestMoves = [m]
    } else if (score === bestScore) {
      bestMoves.push(m)
    }
    if (score > alpha) alpha = score
  }
  // Break ties randomly so the engine isn't perfectly deterministic.
  const pick = bestMoves[Math.floor(Math.random() * bestMoves.length)]
  return { from: pick.from, to: pick.to, promotion: pick.promotion ?? 'q' }
}

/**
 * THE single swap point for engine move selection. The orchestrator will
 * replace the body of this function with a stronger engine; nothing else in
 * this component decides a move.
 */
async function chooseEngineMove(
  game: ChessGame,
  depth: number,
): Promise<{ from: Square; to: Square; promotion?: PieceSymbol } | null> {
  // Prefer Stockfish (isolated GPL worker); fall back to the built-in minimax
  // if the engine/wasm can't load. depth maps to think-time + Skill Level.
  try {
    const movetime = depth <= 1 ? 150 : 500
    const skill = depth <= 1 ? 2 : 14
    const best = await stockfishBestMove(game.fen(), movetime, skill)
    if (best) {
      return {
        from: best.from as Square,
        to: best.to as Square,
        promotion: (best.promotion as PieceSymbol | undefined) ?? 'q',
      }
    }
  } catch {
    // engine unavailable — use the local minimax below
  }
  return builtinMove(game, depth)
}

// --- Component ---------------------------------------------------------------

type Difficulty = 'easy' | 'normal'
const DEPTH: Record<Difficulty, number> = { easy: 1, normal: 3 }

interface BoardCell {
  square: Square
  type: PieceSymbol | null
  color: Color | null
}

export function Chess({ winId, args }: AppProps) {
  void winId
  void args
  const gameRef = useRef<ChessGame>(new ChessGame())
  const [, forceRender] = useState(0)
  const tick = useCallback(() => forceRender((n) => n + 1), [])

  const [selected, setSelected] = useState<Square | null>(null)
  const [legalTargets, setLegalTargets] = useState<Set<Square>>(new Set())
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  )
  const [thinking, setThinking] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')

  const game = gameRef.current

  // Flatten the board into 64 cells, rendered rank 8 → 1, file a → h, so White
  // sits at the bottom.
  const cells = useMemo<BoardCell[]>(() => {
    const board = game.board()
    const out: BoardCell[] = []
    for (let r = 0; r < 8; r += 1) {
      for (let f = 0; f < 8; f += 1) {
        const piece = board[r][f]
        const square = `${FILES[f]}${RANKS[r]}` as Square
        out.push({
          square,
          type: piece ? piece.type : null,
          color: piece ? piece.color : null,
        })
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.fen()])

  const runEngine = useCallback(() => {
    if (game.isGameOver()) return
    setThinking(true)
    setSelected(null)
    setLegalTargets(new Set())
    // Defer so React can paint the "thinking…" state before the (sync) search.
    const id = window.setTimeout(() => {
      void chooseEngineMove(game, DEPTH[difficulty]).then((move) => {
        if (move) {
          const applied = game.move(move)
          if (applied) setLastMove({ from: applied.from, to: applied.to })
        }
        setThinking(false)
        tick()
      })
    }, 60)
    return () => window.clearTimeout(id)
  }, [game, difficulty, tick])

  const captured = useMemo(() => {
    // Reconstruct captured pieces from the move history.
    const white: PieceSymbol[] = []
    const black: PieceSymbol[] = []
    for (const m of game.history({ verbose: true }) as Move[]) {
      if (m.captured) {
        // The captured piece belonged to the opponent of the mover.
        if (m.color === 'w') black.push(m.captured)
        else white.push(m.captured)
      }
    }
    return { white, black }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.fen()])

  const onSquareClick = useCallback(
    (square: Square) => {
      if (thinking || game.isGameOver() || game.turn() !== 'w') return

      // Clicking a legal destination of the current selection → move.
      if (selected && legalTargets.has(square)) {
        const applied = game.move({
          from: selected,
          to: square,
          promotion: 'q',
        })
        if (applied) {
          setLastMove({ from: applied.from, to: applied.to })
          setSelected(null)
          setLegalTargets(new Set())
          tick()
          runEngine()
        }
        return
      }

      // Otherwise (re)select a White piece and show its legal targets.
      const piece = game.get(square)
      if (piece && piece.color === 'w') {
        const moves = game.moves({ square, verbose: true }) as Move[]
        setSelected(square)
        setLegalTargets(new Set(moves.map((m) => m.to)))
      } else {
        setSelected(null)
        setLegalTargets(new Set())
      }
    },
    [thinking, game, selected, legalTargets, tick, runEngine],
  )

  const newGame = useCallback(() => {
    gameRef.current = new ChessGame()
    setSelected(null)
    setLegalTargets(new Set())
    setLastMove(null)
    setThinking(false)
    tick()
  }, [tick])

  const undo = useCallback(() => {
    if (thinking) return
    // Undo a full pair so it's White's turn again.
    game.undo() // engine (Black) move
    game.undo() // human (White) move
    setSelected(null)
    setLegalTargets(new Set())
    const hist = game.history({ verbose: true }) as Move[]
    const last = hist[hist.length - 1]
    setLastMove(last ? { from: last.from, to: last.to } : null)
    tick()
  }, [thinking, game, tick])

  // Clean up a pending engine timeout if the component unmounts.
  const cleanupRef = useRef<(() => void) | undefined>(undefined)
  useEffect(() => cleanupRef.current, [])

  const status = useMemo(() => {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? 'Checkmate — Black wins' : 'Checkmate — White wins'
    }
    if (game.isStalemate()) return 'Draw — stalemate'
    if (game.isDraw()) return 'Draw'
    if (game.isCheck()) {
      return `${game.turn() === 'w' ? 'White' : 'Black'} to move — Check!`
    }
    if (thinking) return 'Black is thinking…'
    return `${game.turn() === 'w' ? 'White' : 'Black'} to move`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.fen(), thinking])

  const inCheckSquare = useMemo<Square | null>(() => {
    if (!game.isCheck()) return null
    const turn = game.turn()
    const board = game.board()
    for (let r = 0; r < 8; r += 1) {
      for (let f = 0; f < 8; f += 1) {
        const p = board[r][f]
        if (p && p.type === 'k' && p.color === turn) {
          return `${FILES[f]}${RANKS[r]}` as Square
        }
      }
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.fen()])

  return (
    <div className={styles.chess}>
      <div className={styles.toolbar}>
        <button className={styles.btn} onClick={newGame} type="button">
          New Game
        </button>
        <button
          className={styles.btn}
          onClick={undo}
          type="button"
          disabled={thinking || game.history().length < 2}
        >
          Undo
        </button>
        <label className={styles.diff}>
          Level
          <select
            className={styles.select}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
          </select>
        </label>
      </div>

      <div className={styles.body}>
        <div className={styles.boardWrap}>
          <div className={styles.board}>
            {cells.map((cell) => {
              const fileIdx = FILES.indexOf(
                cell.square[0] as (typeof FILES)[number],
              )
              const rankNum = Number(cell.square[1])
              const isDark = (fileIdx + rankNum) % 2 === 0
              const isSelected = selected === cell.square
              const isTarget = legalTargets.has(cell.square)
              const isCapture = isTarget && cell.type !== null
              const isLast =
                lastMove &&
                (lastMove.from === cell.square || lastMove.to === cell.square)
              const isCheck = inCheckSquare === cell.square
              const classNames = [
                styles.square,
                isDark ? styles.dark : styles.light,
                isSelected ? styles.selected : '',
                isLast ? styles.lastMove : '',
                isCheck ? styles.check : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <div
                  key={cell.square}
                  className={classNames}
                  onClick={() => onSquareClick(cell.square)}
                  role="button"
                  tabIndex={-1}
                >
                  {cell.type && cell.color && (
                    <span
                      className={
                        cell.color === 'w'
                          ? styles.pieceWhite
                          : styles.pieceBlack
                      }
                    >
                      {glyphFor(cell.type, cell.color)}
                    </span>
                  )}
                  {isTarget &&
                    (isCapture ? (
                      <span className={styles.captureRing} />
                    ) : (
                      <span className={styles.moveDot} />
                    ))}
                  {fileIdx === 0 && (
                    <span className={styles.rankLabel}>{rankNum}</span>
                  )}
                  {rankNum === 1 && (
                    <span className={styles.fileLabel}>{cell.square[0]}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.status} aria-live="polite">
            {status}
          </div>
          <div className={styles.trayLabel}>Captured by White</div>
          <div className={styles.tray}>
            {captured.black.length === 0 ? (
              <span className={styles.trayEmpty}>—</span>
            ) : (
              captured.black.map((t, i) => (
                <span key={`cb${i}`} className={styles.trayPieceBlack}>
                  {glyphFor(t, 'b')}
                </span>
              ))
            )}
          </div>
          <div className={styles.trayLabel}>Captured by Black</div>
          <div className={styles.tray}>
            {captured.white.length === 0 ? (
              <span className={styles.trayEmpty}>—</span>
            ) : (
              captured.white.map((t, i) => (
                <span key={`cw${i}`} className={styles.trayPieceWhite}>
                  {glyphFor(t, 'w')}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
