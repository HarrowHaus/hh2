import { useEffect, useRef } from 'react'
import styles from './Oneko.module.css'

// oneko desktop pet (Tier 1, docs/08). A small original cat that chases the
// cursor and curls up when it catches it. Inspired by oneko.js (MIT) + the
// public-domain Neko sprite, but the art here is our own SVG (CREDITS.md).
// Toggled in Display Properties → Effects. Decorative; never intercepts input.
export function Oneko() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const pos = { x: window.innerWidth / 2, y: window.innerHeight - 80 }
    const target = { x: pos.x, y: pos.y }
    let facing = 1
    let idle = 0
    let raf = 0

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
    }
    window.addEventListener('mousemove', onMove)

    const SPEED = reduce ? 0 : 3
    const apply = () => {
      el.style.transform = `translate(${pos.x - 16}px, ${pos.y - 20}px) scaleX(${facing})`
    }
    apply()

    const loop = () => {
      const dx = target.x - pos.x
      const dy = target.y - pos.y
      const dist = Math.hypot(dx, dy)
      if (dist > 16 && SPEED > 0) {
        pos.x += (dx / dist) * SPEED
        pos.y += (dy / dist) * SPEED
        if (Math.abs(dx) > 1) facing = dx < 0 ? -1 : 1
        idle = 0
        el.dataset.state = 'run'
        apply()
      } else {
        idle++
        el.dataset.state = idle > 240 ? 'sleep' : 'idle'
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div ref={ref} className={styles.neko} data-state="idle" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="32" height="32">
        {/* tail */}
        <path className={styles.tail} d="M6 20 q-5 -2 -3 -7 q1 -3 4 -2" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
        {/* body */}
        <ellipse cx="17" cy="21" rx="9" ry="6" fill="#111" />
        {/* legs */}
        <rect className={styles.legF} x="12" y="24" width="3" height="5" rx="1.4" fill="#111" />
        <rect className={styles.legB} x="20" y="24" width="3" height="5" rx="1.4" fill="#111" />
        {/* head */}
        <circle cx="23" cy="15" r="6" fill="#111" />
        <path d="M18 11 l2 -4 l3 3 Z" fill="#111" />
        <path d="M24 10 l3 -3 l1 4 Z" fill="#111" />
        {/* eyes */}
        <circle className={styles.eye} cx="22" cy="15" r="1.3" fill="#ffd23f" />
        <circle className={styles.eye} cx="26" cy="15" r="1.3" fill="#ffd23f" />
        {/* whisker hint */}
        <path d="M27 16 h4 M27 17.5 h3.5" stroke="#333" strokeWidth="0.5" />
      </svg>
      <span className={styles.zzz}>z</span>
    </div>
  )
}
