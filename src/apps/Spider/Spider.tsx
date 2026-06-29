import { useCallback, useMemo, useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './Spider.module.css'

/* ── Types & constants ─────────────────────────────────────────────── */

type Suit = 'S' | 'H' | 'D' | 'C'
type SuitCount = 1 | 2 | 4

interface Card {
  id: number
  rank: number // 1 (Ace) .. 13 (King)
  suit: Suit
  faceUp: boolean
}

type Column = Card[]

interface GameState {
  columns: Column[] // 10 columns
  stock: Card[] // remaining cards to deal (face-down)
  completed: number // completed K→A sets (0..8)
}

interface Selection {
  col: number
  index: number // start index of the picked-up run within the column
}

const RED_SUITS: ReadonlySet<Suit> = new Set<Suit>(['H', 'D'])
const SUIT_GLYPH: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const RANK_LABEL: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
}

function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank)
}

/* ── Deck construction & dealing ───────────────────────────────────── */

function suitsForCount(count: SuitCount): Suit[] {
  if (count === 1) return ['S']
  if (count === 2) return ['S', 'H']
  return ['S', 'H', 'D', 'C']
}

/** Build a 104-card double-deck from the chosen suit set. */
function buildDeck(count: SuitCount): Card[] {
  const suits = suitsForCount(count)
  const copies = 104 / (suits.length * 13)
  const deck: Card[] = []
  let id = 0
  for (let c = 0; c < copies; c++) {
    for (const suit of suits) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({ id: id++, rank, suit, faceUp: false })
      }
    }
  }
  return deck
}

function shuffle<T>(input: T[]): T[] {
  const arr = input.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

function dealGame(count: SuitCount): GameState {
  const deck = shuffle(buildDeck(count))
  const columns: Column[] = Array.from({ length: 10 }, () => [])
  let pos = 0
  // Columns 0-3 get 6 cards, columns 4-9 get 5 cards (54 dealt).
  for (let col = 0; col < 10; col++) {
    const size = col < 4 ? 6 : 5
    for (let k = 0; k < size; k++) {
      columns[col].push({ ...deck[pos++], faceUp: false })
    }
  }
  // Flip the top card of each column face-up.
  for (const column of columns) {
    if (column.length > 0) column[column.length - 1].faceUp = true
  }
  const stock = deck.slice(pos).map((c) => ({ ...c, faceUp: false }))
  return { columns, stock, completed: 0 }
}

/* ── Move validation helpers ───────────────────────────────────────── */

/** A run is movable if every card is face-up, same suit, strictly descending. */
function isMovableRun(column: Column, start: number): boolean {
  if (start < 0 || start >= column.length) return false
  if (!column[start].faceUp) return false
  for (let i = start; i < column.length - 1; i++) {
    const a = column[i]
    const b = column[i + 1]
    if (!b.faceUp) return false
    if (a.suit !== b.suit) return false
    if (a.rank !== b.rank + 1) return false
  }
  return true
}

/** Can the run starting at `from[start]` land on `to`? */
function canDrop(from: Column, start: number, to: Column): boolean {
  const moving = from[start]
  if (to.length === 0) return true // empty column accepts any valid run
  const target = to[to.length - 1]
  if (!target.faceUp) return false
  return target.rank === moving.rank + 1 // one rank higher, any suit
}

/** Remove a completed K→A same-suit run from the tail of a column, if present. */
function extractCompletedSet(column: Column): boolean {
  if (column.length < 13) return false
  const start = column.length - 13
  // The 13-card tail must be face-up King..Ace, same suit, descending.
  for (let i = 0; i < 13; i++) {
    const card = column[start + i]
    if (!card.faceUp) return false
    if (card.rank !== 13 - i) return false
    if (card.suit !== column[start].suit) return false
  }
  column.splice(start, 13)
  return true
}

/* ── State mutation (immutable clone then operate) ─────────────────── */

function cloneColumns(columns: Column[]): Column[] {
  return columns.map((col) => col.map((card) => ({ ...card })))
}

function flipExposed(column: Column): void {
  if (column.length > 0) {
    const top = column[column.length - 1]
    if (!top.faceUp) top.faceUp = true
  }
}

/* ── Component ─────────────────────────────────────────────────────── */

export function Spider({ winId, args }: AppProps): JSX.Element {
  void winId
  void args
  const [difficulty, setDifficulty] = useState<SuitCount>(1)
  const [game, setGame] = useState<GameState>(() => dealGame(1))
  const [selection, setSelection] = useState<Selection | null>(null)

  const won = game.completed >= 8

  const newGame = useCallback((count: SuitCount) => {
    setSelection(null)
    setGame(dealGame(count))
  }, [])

  const handleNewGame = useCallback(() => {
    newGame(difficulty)
  }, [difficulty, newGame])

  const handleDifficulty = useCallback(
    (count: SuitCount) => {
      setDifficulty(count)
      newGame(count)
    },
    [newGame],
  )

  /** Deal one card face-up to every column (only if no column is empty). */
  const dealFromStock = useCallback(() => {
    setGame((prev) => {
      if (prev.stock.length < 10) return prev
      if (prev.columns.some((col) => col.length === 0)) return prev
      const columns = cloneColumns(prev.columns)
      const stock = prev.stock.slice()
      for (let col = 0; col < 10; col++) {
        const card = stock.shift()
        if (card) columns[col].push({ ...card, faceUp: true })
      }
      let completed = prev.completed
      for (const column of columns) {
        if (extractCompletedSet(column)) {
          completed++
          flipExposed(column)
        }
      }
      return { columns, stock, completed }
    })
    setSelection(null)
  }, [])

  /** Click a face-up card: either select its run, or drop the held run here. */
  const handleCardClick = useCallback(
    (col: number, index: number) => {
      if (won) return
      const column = game.columns[col]
      const card = column[index]
      if (!card.faceUp) return

      if (selection) {
        // Attempt to drop onto the clicked column (target = its base column).
        attemptMove(col)
        return
      }
      // Start a selection only if it forms a movable run.
      if (isMovableRun(column, index)) {
        setSelection({ col, index })
      }
    },
    // attemptMove declared below via closure; depend on game/selection/won
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, selection, won],
  )

  /** Click an (empty) column area to drop the held run. */
  const attemptMove = useCallback(
    (toCol: number) => {
      if (!selection) return
      if (selection.col === toCol) {
        setSelection(null)
        return
      }
      setGame((prev) => {
        const fromColumn = prev.columns[selection.col]
        if (!isMovableRun(fromColumn, selection.index)) return prev
        if (!canDrop(fromColumn, selection.index, prev.columns[toCol])) {
          return prev
        }
        const columns = cloneColumns(prev.columns)
        const moving = columns[selection.col].splice(selection.index)
        columns[toCol].push(...moving)
        flipExposed(columns[selection.col])
        let completed = prev.completed
        if (extractCompletedSet(columns[toCol])) {
          completed++
          flipExposed(columns[toCol])
        }
        return { columns, stock: prev.stock, completed }
      })
      setSelection(null)
    },
    [selection],
  )

  const handleColumnClick = useCallback(
    (col: number) => {
      if (won) return
      if (selection) attemptMove(col)
    },
    [won, selection, attemptMove],
  )

  const stockDealsLeft = Math.floor(game.stock.length / 10)
  const stockDealable =
    stockDealsLeft > 0 && !game.columns.some((col) => col.length === 0)

  const stockPiles = useMemo(
    () => Array.from({ length: stockDealsLeft }, (_, i) => i),
    [stockDealsLeft],
  )

  return (
    <div className={styles.spider}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.button}
          onClick={handleNewGame}
        >
          New Game
        </button>
        <div className={styles.difficulty}>
          {([1, 2, 4] as SuitCount[]).map((count) => (
            <button
              key={count}
              type="button"
              className={
                count === difficulty
                  ? `${styles.diffBtn} ${styles.diffActive}`
                  : styles.diffBtn
              }
              onClick={() => handleDifficulty(count)}
            >
              {count}-suit
            </button>
          ))}
        </div>
        <div className={styles.status}>
          Sets: {game.completed}/8
        </div>
      </div>

      <div className={styles.table}>
        <div className={styles.board}>
          {game.columns.map((column, colIndex) => {
            const isEmpty = column.length === 0
            return (
              <div
                key={colIndex}
                className={styles.column}
                onClick={() => handleColumnClick(colIndex)}
              >
                {isEmpty && <div className={styles.slot} />}
                {column.map((card, cardIndex) => {
                  const selected =
                    selection !== null &&
                    selection.col === colIndex &&
                    cardIndex >= selection.index
                  return (
                    <Face
                      key={card.id}
                      card={card}
                      offset={cardIndex}
                      selected={selected}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCardClick(colIndex, cardIndex)
                      }}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>

        <div className={styles.footer}>
          <div
            className={
              stockDealable
                ? `${styles.stock} ${styles.stockReady}`
                : styles.stock
            }
            onClick={stockDealable ? dealFromStock : undefined}
            title={
              stockDealable
                ? 'Deal a row'
                : stockDealsLeft === 0
                  ? 'No deals left'
                  : 'Fill every column first'
            }
          >
            {stockPiles.map((i) => (
              <div
                key={i}
                className={styles.stockCard}
                style={{ left: `${i * 10}px` }}
              />
            ))}
          </div>
        </div>

        {won && (
          <div className={styles.overlay}>
            <div className={styles.overlayBox}>
              <div className={styles.overlayTitle}>You won!</div>
              <button
                type="button"
                className={styles.button}
                onClick={handleNewGame}
              >
                New Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Card face ─────────────────────────────────────────────────────── */

interface FaceProps {
  card: Card
  offset: number
  selected: boolean
  onClick: (e: React.MouseEvent) => void
}

function Face({ card, offset, selected, onClick }: FaceProps): JSX.Element {
  const top = offset * 22
  if (!card.faceUp) {
    return (
      <div
        className={`${styles.card} ${styles.back}`}
        style={{ top: `${top}px` }}
      />
    )
  }
  const red = RED_SUITS.has(card.suit)
  const className = [
    styles.card,
    styles.faceCard,
    red ? styles.red : styles.black,
    selected ? styles.selected : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={className} style={{ top: `${top}px` }} onClick={onClick}>
      <span className={styles.corner}>
        {rankLabel(card.rank)}
        {SUIT_GLYPH[card.suit]}
      </span>
      <span className={styles.pip}>{SUIT_GLYPH[card.suit]}</span>
    </div>
  )
}
