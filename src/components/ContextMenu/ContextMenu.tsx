import { useEffect, useRef, useState } from 'react'
import { useMenu } from '../../os/menu'
import styles from './ContextMenu.module.css'

// Enabled, focusable menu items within a menu container (skips separators/disabled).
function enabledItems(el: HTMLElement | null): HTMLButtonElement[] {
  if (!el) return []
  return Array.from(el.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])'))
}

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

  // a11y: focus the first enabled item when the menu opens, so it's keyboard-
  // operable immediately (arrow keys then move between items — see onKeyDown).
  useEffect(() => {
    if (!open) return
    enabledItems(ref.current)[0]?.focus()
  }, [open])

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

  // Up/Down cycle through enabled items; Home/End jump to ends (Esc/Enter handled
  // elsewhere — Esc globally, Enter by the focused <button>).
  function onMenuKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const btns = enabledItems(ref.current)
    if (!btns.length) return
    const i = btns.indexOf(document.activeElement as HTMLButtonElement)
    let next = -1
    if (e.key === 'ArrowDown') next = i < 0 ? 0 : (i + 1) % btns.length
    else if (e.key === 'ArrowUp') next = i <= 0 ? btns.length - 1 : i - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = btns.length - 1
    if (next >= 0) {
      e.preventDefault()
      btns[next].focus()
    }
  }

  if (!open) return null

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={onMenuKey}
      role="menu"
    >
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} className={styles.sep} />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
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
