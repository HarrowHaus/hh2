import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOS } from '../../os/store'
import type { AppProps } from '../../os/types'
import styles from './WinUpdate.module.css'

// Fake Windows Update easter egg (Tier 1, docs/08). A full-screen "configuring
// updates" gag that climbs to 100% then lets you dismiss. Diegetic, non-
// narrating (Rule 2). Inert — nothing is installed.
const TOTAL = 3

export function WinUpdate({ winId }: AppProps) {
  const closeWindow = useOS((s) => s.closeWindow)
  const [pct, setPct] = useState(0)
  const [stage, setStage] = useState(1)

  useEffect(() => {
    const t = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          clearInterval(t)
          return 100
        }
        const next = Math.min(100, p + (Math.random() < 0.15 ? 0 : 1))
        setStage(Math.min(TOTAL, Math.floor(next / (100 / TOTAL)) + 1))
        return next
      })
    }, 110)
    return () => clearInterval(t)
  }, [])

  const done = pct >= 100
  useEffect(() => {
    if (!done) return
    const dismiss = () => closeWindow(winId)
    window.addEventListener('keydown', dismiss)
    window.addEventListener('mousedown', dismiss)
    return () => {
      window.removeEventListener('keydown', dismiss)
      window.removeEventListener('mousedown', dismiss)
    }
  }, [done, winId, closeWindow])

  return createPortal(
    <div className={styles.update} role="alertdialog" aria-label="Configuring updates">
      <div className={styles.spinner} aria-hidden="true" />
      <div className={styles.headline}>
        {done ? 'Updates configured.' : `Configuring updates: stage ${stage} of ${TOTAL}`}
      </div>
      <div className={styles.pct}>{pct}% complete</div>
      <div className={styles.warn}>
        {done ? 'Press any key to continue.' : "Do not turn off your computer."}
      </div>
    </div>,
    document.body,
  )
}
