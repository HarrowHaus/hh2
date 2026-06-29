import { useState, useCallback } from 'react'
import type { AppProps } from '../../os/types'
import { useFS } from '../../os/fs/store'
import styles from './HexEditor.module.css'

const BYTES_PER_ROW = 16

function toHex(b: number): string {
  return b.toString(16).toUpperCase().padStart(2, '0')
}

function isPrintable(b: number): boolean {
  return b >= 0x20 && b <= 0x7e
}

function formatOffset(n: number): string {
  return n.toString(16).toUpperCase().padStart(8, '0')
}

function formatCount(n: number): string {
  return n.toLocaleString()
}

export function HexEditor({ args }: AppProps) {
  const path = args?.path as string | undefined
  const content = useFS((s) => (path ? (s.nodes[path]?.content ?? '') : ''))
  const name = useFS((s) => (path ? (s.nodes[path]?.name ?? 'Untitled') : 'Untitled'))

  const bytes = new TextEncoder().encode(content)
  const totalBytes = bytes.length

  // Selected byte index for highlight
  const [selected, setSelected] = useState<number | null>(null)

  const handleHexClick = useCallback((idx: number) => {
    setSelected((prev) => (prev === idx ? null : idx))
  }, [])

  const rows: JSX.Element[] = []

  for (let rowStart = 0; rowStart < totalBytes || rowStart === 0; rowStart += BYTES_PER_ROW) {
    const rowBytes = Array.from(bytes.slice(rowStart, rowStart + BYTES_PER_ROW))
    const isLastRow = rowStart + BYTES_PER_ROW >= totalBytes

    // Build hex cells (two groups of 8)
    const hexCells: JSX.Element[] = []
    for (let i = 0; i < BYTES_PER_ROW; i++) {
      const byteIdx = rowStart + i
      const b = rowBytes[i]
      const isSel = selected === byteIdx
      const isEmpty = b === undefined

      if (i === 8) {
        hexCells.push(<span key="gap" className={styles.gap}> </span>)
      }

      hexCells.push(
        <span
          key={i}
          className={`${styles.hexByte} ${isSel ? styles.selected : ''} ${isEmpty ? styles.empty : ''}`}
          onClick={isEmpty ? undefined : () => handleHexClick(byteIdx)}
          role={isEmpty ? undefined : 'button'}
          tabIndex={isEmpty ? undefined : 0}
          onKeyDown={
            isEmpty
              ? undefined
              : (e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleHexClick(byteIdx)
                }
          }
        >
          {isEmpty ? '  ' : toHex(b)}
        </span>,
      )
    }

    // Build ASCII gutter
    const asciiCells: JSX.Element[] = rowBytes.map((b, i) => {
      const byteIdx = rowStart + i
      const isSel = selected === byteIdx
      return (
        <span
          key={i}
          className={`${styles.asciiChar} ${isSel ? styles.selected : ''}`}
          onClick={() => handleHexClick(byteIdx)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleHexClick(byteIdx)
          }}
        >
          {isPrintable(b) ? String.fromCharCode(b) : '.'}
        </span>
      )
    })

    rows.push(
      <div key={rowStart} className={styles.row}>
        <span className={styles.offset}>{formatOffset(rowStart)}</span>
        <span className={styles.hexGroup}>{hexCells}</span>
        <span className={styles.ascii}>{asciiCells}</span>
      </div>,
    )

    if (totalBytes === 0 || (isLastRow && totalBytes > 0)) break
  }

  return (
    <div className={styles.hex}>
      <div className={styles.header}>
        <span className={styles.offsetHeader}>Offset</span>
        <span className={styles.hexHeader}>
          {'00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F'}
        </span>
        <span className={styles.asciiHeader}>ASCII</span>
      </div>
      <div className={styles.body}>
        {totalBytes === 0 ? (
          <div className={styles.empty}>{'<empty — 0 bytes>'}</div>
        ) : (
          rows
        )}
      </div>
      <div className={styles.statusBar}>
        <span className={styles.fileName}>{name}</span>
        <span className={styles.sep}>—</span>
        <span className={styles.byteCount}>{formatCount(totalBytes)} bytes</span>
        {selected !== null && (
          <>
            <span className={styles.sep}>|</span>
            <span className={styles.selInfo}>
              Offset: {formatOffset(selected)} ({selected}) = {toHex(bytes[selected]!)}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
