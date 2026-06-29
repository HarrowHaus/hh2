import { useCallback, useMemo, useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './FreeCell.module.css'

type Suit = 'S' | 'H' | 'D' | 'C'
type Color = 'red' | 'black'

interface Card {
  id: string
  rank: number // 1 = Ace .. 13 = King
  suit: Suit
}

const SUITS: Suit[] = ['S', 'H', 'D', 'C']
const SUIT_GLYPH: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const RANK_LABEL: Record<number, string> = {
  1: 'A', 11: 'J', 12: 'Q', 13: 'K',
}

function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank)
}

function suitColor(suit: Suit): Color {
  return suit === 'H' || suit === 'D' ? 'red' : 'black'
}

function makeDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: `${suit}${rank}`, rank, suit })
    }
  }
  return deck
}

function shuffle(deck: Card[]): Card[] {
  const a = deck.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface GameState {
  cascades: Card[][] // 8 tableau columns
  free: (Card | null)[] // 4 free cells
  foundations: Card[][] // 4 foundations indexed by SUITS order
}

function deal(): GameState {
  const deck = shuffle(makeDeck())
  const cascades: Card[][] = [[], [], [], [], [], [], [], []]
  let idx = 0
  for (let col = 0; col < 8; col++) {
    const count = col < 4 ? 7 : 6
    for (let n = 0; n < count; n++) {
      cascades[col].push(deck[idx++])
    }
  }
  return {
    cascades,
    free: [null, null, null, null],
    foundations: [[], [], [], []],
  }
}

/** Two cards form a valid tableau sequence if alternating color & descending rank. */
function tableauSequential(upper: Card, lower: Card): boolean {
  return suitColor(upper.suit) !== suitColor(lower.suit) && upper.rank === lower.rank + 1
}

/** From a cascade, how many cards starting at `start` form a valid moveable run. */
function runLengthFrom(col: Card[], start: number): number {
  let len = 1
  for (let i = start; i < col.length - 1; i++) {
    if (tableauSequential(col[i], col[i + 1])) len++
    else return col.length - start === len ? len : 0 // must be the bottom-most run
  }
  return col.length - start
}

function emptyCascadeCount(cascades: Card[][], excludeCol: number): number {
  let count = 0
  for (let i = 0; i < cascades.length; i++) {
    if (i === excludeCol) continue
    if (cascades[i].length === 0) count++
  }
  return count
}

function freeCount(free: (Card | null)[]): number {
  return free.filter((c) => c === null).length
}

/** Max cards moveable as a supermove. destEmpty reduces the empty-column multiplier. */
function maxSupermove(free: (Card | null)[], emptyCols: number, destEmpty: boolean): number {
  const e = destEmpty ? Math.max(0, emptyCols - 1) : emptyCols
  return (1 + freeCount(free)) * 2 ** e
}

function canPlaceOnFoundation(found: Card[], card: Card): boolean {
  if (found.length === 0) return card.rank === 1
  const top = found[found.length - 1]
  return top.suit === card.suit && card.rank === top.rank + 1
}

function canPlaceOnCascade(col: Card[], card: Card): boolean {
  if (col.length === 0) return true
  return tableauSequential(col[col.length - 1], card)
}

type Selection =
  | { kind: 'cascade'; col: number; index: number }
  | { kind: 'free'; index: number }
  | null

export function FreeCell({ winId: _winId, args: _args }: AppProps) {
  const [state, setState] = useState<GameState>(() => deal())
  const [selection, setSelection] = useState<Selection>(null)
  const [moves, setMoves] = useState(0)

  const won = useMemo(
    () => state.foundations.reduce((sum, f) => sum + f.length, 0) === 52,
    [state.foundations],
  )

  const newGame = useCallback(() => {
    setState(deal())
    setSelection(null)
    setMoves(0)
  }, [])

  /** Returns the cards currently selected (a run from a cascade, or one free cell card). */
  const selectedCards = useCallback(
    (sel: Selection): Card[] => {
      if (!sel) return []
      if (sel.kind === 'free') {
        const c = state.free[sel.index]
        return c ? [c] : []
      }
      return state.cascades[sel.col].slice(sel.index)
    },
    [state],
  )

  const applyMove = useCallback((next: GameState) => {
    setState(next)
    setMoves((m) => m + 1)
    setSelection(null)
  }, [])

  /** Try to move the given run onto a destination cascade. */
  const tryMoveToCascade = useCallback(
    (sel: Selection, destCol: number): boolean => {
      if (!sel) return false
      const cards = selectedCards(sel)
      if (cards.length === 0) return false
      if (sel.kind === 'cascade' && sel.col === destCol) return false

      const dest = state.cascades[destCol]
      if (!canPlaceOnCascade(dest, cards[0])) return false

      const destEmpty = dest.length === 0
      const empties = emptyCascadeCount(
        state.cascades,
        sel.kind === 'cascade' ? sel.col : -1,
      )
      const limit = maxSupermove(state.free, empties, destEmpty)
      if (cards.length > limit) return false

      const next: GameState = {
        cascades: state.cascades.map((c) => c.slice()),
        free: state.free.slice(),
        foundations: state.foundations.map((f) => f.slice()),
      }
      if (sel.kind === 'free') {
        next.free[sel.index] = null
      } else {
        next.cascades[sel.col] = next.cascades[sel.col].slice(0, sel.index)
      }
      next.cascades[destCol] = next.cascades[destCol].concat(cards)
      applyMove(next)
      return true
    },
    [state, selectedCards, applyMove],
  )

  const tryMoveToFree = useCallback(
    (sel: Selection, cellIndex: number): boolean => {
      if (!sel) return false
      const cards = selectedCards(sel)
      if (cards.length !== 1) return false // free cells hold exactly one card
      if (state.free[cellIndex] !== null) return false
      if (sel.kind === 'free' && sel.index === cellIndex) return false

      const next: GameState = {
        cascades: state.cascades.map((c) => c.slice()),
        free: state.free.slice(),
        foundations: state.foundations.map((f) => f.slice()),
      }
      const card = cards[0]
      if (sel.kind === 'free') next.free[sel.index] = null
      else next.cascades[sel.col] = next.cascades[sel.col].slice(0, sel.index)
      next.free[cellIndex] = card
      applyMove(next)
      return true
    },
    [state, selectedCards, applyMove],
  )

  const tryMoveToFoundation = useCallback(
    (sel: Selection, foundIndex: number): boolean => {
      if (!sel) return false
      const cards = selectedCards(sel)
      if (cards.length !== 1) return false // only single cards to foundations
      const card = cards[0]
      if (!canPlaceOnFoundation(state.foundations[foundIndex], card)) return false

      const next: GameState = {
        cascades: state.cascades.map((c) => c.slice()),
        free: state.free.slice(),
        foundations: state.foundations.map((f) => f.slice()),
      }
      if (sel.kind === 'free') next.free[sel.index] = null
      else next.cascades[sel.col] = next.cascades[sel.col].slice(0, sel.index)
      next.foundations[foundIndex] = next.foundations[foundIndex].concat([card])
      applyMove(next)
      return true
    },
    [state, selectedCards, applyMove],
  )

  /** Double-click: auto-send a single card to its foundation, else an open free cell. */
  const autoSend = useCallback(
    (sel: Selection): void => {
      const cards = selectedCards(sel)
      if (cards.length !== 1) return
      const card = cards[0]
      const foundIdx = SUITS.indexOf(card.suit)
      if (canPlaceOnFoundation(state.foundations[foundIdx], card)) {
        tryMoveToFoundation(sel, foundIdx)
        return
      }
      const freeIdx = state.free.findIndex((c) => c === null)
      if (freeIdx >= 0) tryMoveToFree(sel, freeIdx)
    },
    [state, selectedCards, tryMoveToFoundation, tryMoveToFree],
  )

  // ---- Click handlers ----

  const onCascadeCardClick = useCallback(
    (col: number, index: number) => {
      if (won) return
      if (!selection) {
        // Can only pick up a valid bottom-anchored run.
        const len = runLengthFrom(state.cascades[col], index)
        if (len > 0) setSelection({ kind: 'cascade', col, index })
        return
      }
      // A selection exists: treat click as destination (the cascade column).
      if (!tryMoveToCascade(selection, col)) {
        // Re-select within the same/other cascade if it's a valid pickup.
        const len = runLengthFrom(state.cascades[col], index)
        if (
          len > 0 &&
          !(selection.kind === 'cascade' && selection.col === col && selection.index === index)
        ) {
          setSelection({ kind: 'cascade', col, index })
        } else {
          setSelection(null)
        }
      }
    },
    [won, selection, state.cascades, tryMoveToCascade],
  )

  const onCascadeEmptyClick = useCallback(
    (col: number) => {
      if (won || !selection) return
      if (!tryMoveToCascade(selection, col)) setSelection(null)
    },
    [won, selection, tryMoveToCascade],
  )

  const onFreeClick = useCallback(
    (index: number) => {
      if (won) return
      const occupant = state.free[index]
      if (!selection) {
        if (occupant) setSelection({ kind: 'free', index })
        return
      }
      if (!tryMoveToFree(selection, index)) {
        if (occupant && !(selection.kind === 'free' && selection.index === index)) {
          setSelection({ kind: 'free', index })
        } else {
          setSelection(null)
        }
      }
    },
    [won, selection, state.free, tryMoveToFree],
  )

  const onFoundationClick = useCallback(
    (index: number) => {
      if (won || !selection) return
      if (!tryMoveToFoundation(selection, index)) setSelection(null)
    },
    [won, selection, tryMoveToFoundation],
  )

  // ---- Rendering helpers ----

  const isSelected = useCallback(
    (kind: 'cascade' | 'free', col: number, index: number): boolean => {
      if (!selection) return false
      if (kind === 'free') return selection.kind === 'free' && selection.index === col
      return selection.kind === 'cascade' && selection.col === col && index >= selection.index
    },
    [selection],
  )

  const renderCardFace = (card: Card) => {
    const color = suitColor(card.suit)
    return (
      <>
        <span className={styles.corner}>
          {rankLabel(card.rank)}
          {SUIT_GLYPH[card.suit]}
        </span>
        <span className={`${styles.pip} ${color === 'red' ? styles.red : styles.black}`}>
          {SUIT_GLYPH[card.suit]}
        </span>
      </>
    )
  }

  return (
    <div className={styles.freecell}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.button} onClick={newGame}>
          New Game
        </button>
        <span className={styles.moves}>Moves: {moves}</span>
        {won && <span className={styles.won}>You won!</span>}
      </div>

      <div className={styles.topRow}>
        <div className={styles.freeGroup}>
          {state.free.map((card, i) => (
            <div
              key={`free-${i}`}
              className={`${styles.slot} ${isSelected('free', i, 0) ? styles.selected : ''}`}
              onClick={() => onFreeClick(i)}
            >
              {card ? (
                <div
                  className={`${styles.card} ${suitColor(card.suit) === 'red' ? styles.red : styles.black}`}
                >
                  {renderCardFace(card)}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className={styles.foundGroup}>
          {state.foundations.map((found, i) => {
            const top = found[found.length - 1]
            return (
              <div
                key={`found-${i}`}
                className={styles.slot}
                onClick={() => onFoundationClick(i)}
              >
                {top ? (
                  <div
                    className={`${styles.card} ${suitColor(top.suit) === 'red' ? styles.red : styles.black}`}
                  >
                    {renderCardFace(top)}
                  </div>
                ) : (
                  <span className={styles.slotGlyph}>{SUIT_GLYPH[SUITS[i]]}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.tableau}>
        {state.cascades.map((col, ci) => (
          <div key={`col-${ci}`} className={styles.cascade}>
            {col.length === 0 ? (
              <div
                className={`${styles.slot} ${styles.cascadeEmpty}`}
                onClick={() => onCascadeEmptyClick(ci)}
              />
            ) : (
              col.map((card, ri) => (
                <div
                  key={card.id}
                  className={`${styles.cascadeCard} ${suitColor(card.suit) === 'red' ? styles.red : styles.black} ${isSelected('cascade', ci, ri) ? styles.selected : ''}`}
                  style={{ top: `${ri * 1.55}em` }}
                  onClick={() => onCascadeCardClick(ci, ri)}
                  onDoubleClick={() => {
                    if (ri === col.length - 1) autoSend({ kind: 'cascade', col: ci, index: ri })
                  }}
                >
                  {renderCardFace(card)}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
