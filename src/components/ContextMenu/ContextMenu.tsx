import { useEffect, useRef, useState } from 'react'
import { useMenu } from '../../os/menu'
import styles from './ContextMenu.module.css'

// Single global context menu. Closes on outside pointerdown, Esc, or selection.
// Clamps within the viewport so it never opens off-screen.
export function ContextMenu() {
  const { open, x, y, items, closeMenu } = useMenu()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  useEffect(() => {
    if (!open) return
    const el = ref.current
    let nx = x
    let ny = y
    if (el) {
      const r = el.getBoundingClientRect()
      if (x + r.width > window.innerWidth) nx = Math.max(0, window.innerWidth - r.width - 2)
      if (y + r.height > window.innerHeight) ny = Math.max(0, window.innerHeight - r.height - 2)
    }
    setPos({ x: nx, y: ny })
  }, [open, x, y])

  useEffect(() => {
    if (!open) return
    const onDown = () => closeMenu()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, closeMenu])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
      role="menu"
    >
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} className={styles.sep} />
        ) : (
          <button
            key={i}
            type="button"
            className={styles.item}
            disabled={it.disabled}
            onClick={() => {
              it.onClick?.()
              closeMenu()
            }}
          >
            {it.label}
          </button>
        ),
      )}
    </div>
  )
}
