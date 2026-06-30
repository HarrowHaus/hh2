import { useState } from 'react'
import styles from './Taskbar.module.css'

// Calendar popup (OS-subsystem parity) — opens from the tray clock. Month grid
// with today highlighted, prev/next-month navigation, and a full-date footer.
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function Calendar({ now }: { now: Date }) {
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() }
  const [view, setView] = useState({ y: today.y, m: today.m })

  const firstDay = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  // Leading blanks + day cells.
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const step = (delta: number) => {
    setView((v) => {
      const m = v.m + delta
      if (m < 0) return { y: v.y - 1, m: 11 }
      if (m > 11) return { y: v.y + 1, m: 0 }
      return { y: v.y, m }
    })
  }

  return (
    <div className={styles.calendar} role="dialog" aria-label="Calendar">
      <div className={styles.calHead}>
        <button type="button" className={styles.calNav} onClick={() => step(-1)} aria-label="Previous month">‹</button>
        <span className={styles.calTitle}>{MONTHS[view.m]} {view.y}</span>
        <button type="button" className={styles.calNav} onClick={() => step(1)} aria-label="Next month">›</button>
      </div>
      <div className={styles.calGrid}>
        {WEEKDAYS.map((w, i) => <span key={`w${i}`} className={styles.calWeekday}>{w}</span>)}
        {cells.map((d, i) => {
          const isToday = d !== null && view.y === today.y && view.m === today.m && d === today.d
          return (
            <span key={i} className={`${styles.calDay} ${d === null ? styles.calBlank : ''} ${isToday ? styles.calToday : ''}`}>
              {d ?? ''}
            </span>
          )
        })}
      </div>
      <div className={styles.calFoot}>
        {now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  )
}
