import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './Solitaire.module.css'

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
type Color = 'red' | 'black'

interface Card {
  id: string
  suit: Suit
  rank: number // 1=Ace .. 13=King
  faceUp: boolean
}

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const SUIT_GLYPH: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}
const RANK_LABEL: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
}

const colorOf = (s: Suit): Color =>
  s === 'hearts' || s === 'diamonds' ? 'red' : 'black'

const rankLabel = (r: number): string => RANK_LABEL[r] ?? String(r)

// A click "source": where a selected card currently lives.
type Source =
  | { kind: 'waste' }
  | { kind: 'tableau'; col: number; index: number }
  | { kind: 'foundation'; pile: number }

interface GameState {
  stock: Card[]
  waste: Card[]
  foundations: Card[][] // 4 piles, indexed by SUITS order
  tableau: Card[][] // 7 columns
  moves: number
  won: boolean
}

let uidCounter = 0
function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: `c${uidCounter++}`, suit, rank, faceUp: false })
    }
  }
  return deck
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function deal(): GameState {
  const deck = shuffle(buildDeck())
  const tableau: Card[][] = [[], [], [], [], [], [], []]
  let idx = 0
  for (let col = 0; col < 7; col++) {
    for (let n = 0; n <= col; n++) {
      const card = deck[idx++]
      card.faceUp = n === col // only top card face-up
      tableau[col].push(card)
    }
  }
  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }))
  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    moves: 0,
    won: false,
  }
}

// Can `card` legally be placed on top of a foundation pile (for its suit)?
function canPlaceOnFoundation(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) return card.rank === 1
  const top = pile[pile.length - 1]
  return top.suit === card.suit && card.rank === top.rank + 1
}

// Can `card` (head of a run) be placed on a tableau column?
function canPlaceOnTableau(card: Card, col: Card[]): boolean {
  if (col.length === 0) return card.rank === 13 // only Kings to empty
  const top = col[col.length - 1]
  if (!top.faceUp) return false
  return colorOf(top.suit) !== colorOf(card.suit) && card.rank === top.rank - 1
}

// Is the slice starting at `index` in a column a valid descending alt-color run?
function isValidRun(col: Card[], index: number): boolean {
  for (let i = index; i < col.length; i++) {
    if (!col[i].faceUp) return false
    if (i > index) {
      const prev = col[i - 1]
      const cur = col[i]
      if (colorOf(prev.suit) === colorOf(cur.suit)) return false
      if (cur.rank !== prev.rank - 1) return false
    }
  }
  return true
}

function isWon(g: GameState): boolean {
  return g.foundations.reduce((sum, p) => sum + p.length, 0) === 52
}

export function Solitaire({ winId, args }: AppProps) {
  void winId
  void args
  const [game, setGame] = useState<GameState>(() => deal())
  const [selected, setSelected] = useState<Source | null>(null)

  const newGame = useCallback(() => {
    setGame(deal())
    setSelected(null)
  }, [])

  // Draw one from stock to waste, or recycle waste -> stock.
  const drawFromStock = useCallback(() => {
    setSelected(null)
    setGame((g) => {
      if (g.stock.length === 0) {
        if (g.waste.length === 0) return g
        const recycled = g.waste
          .slice()
          .reverse()
          .map((c) => ({ ...c, faceUp: false }))
        return { ...g, stock: recycled, waste: [], moves: g.moves + 1 }
      }
      const stock = g.stock.slice()
      const card = stock.pop() as Card
      const waste = g.waste.concat({ ...card, faceUp: true })
      return { ...g, stock, waste, moves: g.moves + 1 }
    })
  }, [])

  // Extract the moving run of cards described by a Source (without mutating).
  const cardsFromSource = useCallback(
    (g: GameState, src: Source): Card[] => {
      if (src.kind === 'waste') {
        const top = g.waste[g.waste.length - 1]
        return top ? [top] : []
      }
      if (src.kind === 'foundation') {
        const pile = g.foundations[src.pile]
        const top = pile[pile.length - 1]
        return top ? [top] : []
      }
      return g.tableau[src.col].slice(src.index)
    },
    [],
  )

  // Remove the run from its source, flipping a newly-exposed tableau card.
  const removeFromSource = useCallback((g: GameState, src: Source): GameState => {
    if (src.kind === 'waste') {
      return { ...g, waste: g.waste.slice(0, -1) }
    }
    if (src.kind === 'foundation') {
      const foundations = g.foundations.map((p, i) =>
        i === src.pile ? p.slice(0, -1) : p,
      )
      return { ...g, foundations }
    }
    const tableau = g.tableau.map((c) => c.slice())
    tableau[src.col] = tableau[src.col].slice(0, src.index)
    const remaining = tableau[src.col]
    if (remaining.length > 0 && !remaining[remaining.length - 1].faceUp) {
      remaining[remaining.length - 1] = {
        ...remaining[remaining.length - 1],
        faceUp: true,
      }
    }
    return { ...g, tableau }
  }, [])

  // Attempt to move the current selection onto a destination. Returns new state or null.
  const tryMoveTo = useCallback(
    (
      g: GameState,
      src: Source,
      dest:
        | { kind: 'tableau'; col: number }
        | { kind: 'foundation'; pile: number },
    ): GameState | null => {
      const run = cardsFromSource(g, src)
      if (run.length === 0) return null

      if (dest.kind === 'foundation') {
        if (run.length !== 1) return null
        const pile = g.foundations[dest.pile]
        if (!canPlaceOnFoundation(run[0], pile)) return null
        let ng = removeFromSource(g, src)
        const foundations = ng.foundations.map((p, i) =>
          i === dest.pile ? p.concat({ ...run[0], faceUp: true }) : p,
        )
        ng = { ...ng, foundations, moves: ng.moves + 1 }
        ng.won = isWon(ng)
        return ng
      }

      // tableau destination
      if (src.kind === 'tableau' && src.col === dest.col) return null
      if (!canPlaceOnTableau(run[0], g.tableau[dest.col])) return null
      let ng = removeFromSource(g, src)
      const tableau = ng.tableau.map((c, i) =>
        i === dest.col ? c.concat(run.map((r) => ({ ...r, faceUp: true }))) : c,
      )
      ng = { ...ng, tableau, moves: ng.moves + 1 }
      ng.won = isWon(ng)
      return ng
    },
    [cardsFromSource, removeFromSource],
  )

  // Find the first foundation pile this single card can go to.
  const findFoundationFor = useCallback(
    (g: GameState, card: Card): number | null => {
      for (let i = 0; i < g.foundations.length; i++) {
        if (canPlaceOnFoundation(card, g.foundations[i])) return i
      }
      return null
    },
    [],
  )

  // Double-click: auto-send a single card to a valid foundation.
  const autoToFoundation = useCallback(
    (src: Source) => {
      setGame((g) => {
        const run = cardsFromSource(g, src)
        if (run.length !== 1) return g
        const pile = findFoundationFor(g, run[0])
        if (pile === null) return g
        const ng = tryMoveTo(g, src, { kind: 'foundation', pile })
        return ng ?? g
      })
      setSelected(null)
    },
    [cardsFromSource, findFoundationFor, tryMoveTo],
  )

  // Click a destination column / foundation while something is selected.
  const handleDest = useCallback(
    (dest:
      | { kind: 'tableau'; col: number }
      | { kind: 'foundation'; pile: number }) => {
      if (!selected) return
      setGame((g) => {
        const ng = tryMoveTo(g, selected, dest)
        return ng ?? g
      })
      setSelected(null)
    },
    [selected, tryMoveTo],
  )

  // Click a tableau card: select a valid run, retarget a column, or move existing selection here.
  const handleTableauCardClick = useCallback(
    (col: number, index: number) => {
      const column = game.tableau[col]
      const card = column[index]
      // If selection exists and this is a different column, treat as move-to-this-column.
      if (selected) {
        if (!(selected.kind === 'tableau' && selected.col === col)) {
          handleDest({ kind: 'tableau', col })
          return
        }
      }
      if (!card.faceUp) {
        // clicking a face-down covered card does nothing
        return
      }
      if (!isValidRun(column, index)) return
      // toggle selection
      if (
        selected &&
        selected.kind === 'tableau' &&
        selected.col === col &&
        selected.index === index
      ) {
        setSelected(null)
      } else {
        setSelected({ kind: 'tableau', col, index })
      }
    },
    [game.tableau, selected, handleDest],
  )

  const handleWasteClick = useCallback(() => {
    if (game.waste.length === 0) return
    if (selected && selected.kind === 'waste') {
      setSelected(null)
    } else {
      setSelected({ kind: 'waste' })
    }
  }, [game.waste.length, selected])

  const isSelectedCard = useCallback(
    (src: Source): boolean => {
      if (!selected) return false
      if (selected.kind === 'waste' && src.kind === 'waste') return true
      if (
        selected.kind === 'tableau' &&
        src.kind === 'tableau' &&
        selected.col === src.col &&
        selected.index <= src.index
      )
        return true
      return false
    },
    [selected],
  )

  const wasteTop = game.waste[game.waste.length - 1]

  const renderCardFace = (card: Card, key?: string) => {
    const color = colorOf(card.suit)
    return (
      <div
        key={key ?? card.id}
        className={`${styles.cardFace} ${color === 'red' ? styles.red : styles.black}`}
      >
        <span className={styles.corner}>
          {rankLabel(card.rank)}
          {SUIT_GLYPH[card.suit]}
        </span>
        <span className={styles.center}>{SUIT_GLYPH[card.suit]}</span>
      </div>
    )
  }

  const renderCardBack = (key: string) => (
    <div key={key} className={`${styles.cardFace} ${styles.cardBack}`}>
      <span className={styles.backPattern} />
    </div>
  )

  const stockCount = game.stock.length
  const moveCounter = useMemo(() => game.moves, [game.moves])

  // Keyboard shortcut: N = new game.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'n' || e.key === 'N') newGame()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [newGame])

  return (
    <div className={styles.solitaire}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.btn} onClick={newGame}>
          New Game
        </button>
        <button type="button" className={styles.btn} onClick={newGame}>
          Deal
        </button>
        <span className={styles.moves}>Moves: {moveCounter}</span>
        {game.won && <span className={styles.wonText}>You won! 🎉</span>}
      </div>

      <div className={styles.table}>
        <div className={styles.topRow}>
          <div className={styles.stockArea}>
            {/* Stock */}
            <div
              className={styles.pileSlot}
              onClick={drawFromStock}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') drawFromStock()
              }}
            >
              {stockCount > 0 ? (
                renderCardBack('stock-top')
              ) : (
                <span className={styles.recycle}>↻</span>
              )}
            </div>
            {/* Waste */}
            <div className={styles.pileSlot} onClick={handleWasteClick}>
              {wasteTop ? (
                <div
                  className={
                    isSelectedCard({ kind: 'waste' }) ? styles.selected : ''
                  }
                  onDoubleClick={() => autoToFoundation({ kind: 'waste' })}
                >
                  {renderCardFace(wasteTop)}
                </div>
              ) : (
                <span className={styles.empty} />
              )}
            </div>
          </div>

          <div className={styles.foundations}>
            {game.foundations.map((pile, pIdx) => {
              const top = pile[pile.length - 1]
              return (
                <div
                  key={`f${pIdx}`}
                  className={styles.pileSlot}
                  onClick={() => handleDest({ kind: 'foundation', pile: pIdx })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      handleDest({ kind: 'foundation', pile: pIdx })
                  }}
                >
                  {top ? (
                    renderCardFace(top)
                  ) : (
                    <span className={styles.foundationHint}>
                      {SUIT_GLYPH[SUITS[pIdx]]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.tableauRow}>
          {game.tableau.map((col, cIdx) => (
            <div
              key={`col${cIdx}`}
              className={styles.column}
              onClick={() => {
                // Clicking empty space in a column (or its base) = destination.
                if (col.length === 0 && selected)
                  handleDest({ kind: 'tableau', col: cIdx })
              }}
            >
              {col.length === 0 ? (
                <div
                  className={styles.emptyColumn}
                  onClick={() => handleDest({ kind: 'tableau', col: cIdx })}
                />
              ) : (
                col.map((card, idx) => (
                  <div
                    key={card.id}
                    className={styles.stackedCard}
                    style={{ top: `${idx * 22}px` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTableauCardClick(cIdx, idx)
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      if (
                        card.faceUp &&
                        idx === col.length - 1
                      )
                        autoToFoundation({ kind: 'tableau', col: cIdx, index: idx })
                    }}
                  >
                    {card.faceUp ? (
                      <div
                        className={
                          isSelectedCard({
                            kind: 'tableau',
                            col: cIdx,
                            index: idx,
                          })
                            ? styles.selected
                            : ''
                        }
                      >
                        {renderCardFace(card)}
                      </div>
                    ) : (
                      renderCardBack(card.id)
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
