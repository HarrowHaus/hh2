import { useEffect, useRef, useState } from 'react'
import { registerCloseGuard, unregisterCloseGuard } from '../../os/closeGuards'
import type { AppProps } from '../../os/types'
import styles from './Paint.module.css'

// Paint (docs/08 Tier B) — the real MS-Paint-style editor, jsPaint
// (1j01/jspaint, MIT), vendored offline to public/jspaint/ (Dustin Brett's
// daedalOS ships the same offline build; ours is that copy) and loaded in an
// iframe. Sits alongside miniPaint (the "Photoshop" app). "Paint" is nominative;
// the engine is jsPaint — credited in CREDITS.md, name terms respected.
const PAINT_URL = `${import.meta.env.BASE_URL}jspaint/index.html`

// jsPaint exposes a global `saved` flag and an `are_you_sure(action, canceled)`
// helper (its native "Save changes?" dialog). The iframe is same-origin, so on
// window-close we trigger that real dialog instead of silently dropping the work.
interface JsPaintWindow extends Window {
  saved?: boolean
  are_you_sure?: (action: () => void, canceled?: () => void) => void
}

export function Paint({ winId }: AppProps) {
  const [ok, setOk] = useState<boolean | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    let alive = true
    fetch(PAINT_URL, { method: 'HEAD' })
      .then((r) => alive && setOk(r.ok))
      .catch(() => alive && setOk(false))
    return () => { alive = false }
  }, [])

  // Guard the window close: if there's unsaved work, run jsPaint's own
  // "Save changes?" dialog before the window goes away.
  useEffect(() => {
    registerCloseGuard(winId, (proceed) => {
      const w = iframeRef.current?.contentWindow as JsPaintWindow | null | undefined
      if (!w || w.saved !== false || typeof w.are_you_sure !== 'function') return false
      // Take over: jsPaint prompts; on save/discard it calls proceed(); cancel
      // leaves the window open.
      w.are_you_sure(() => proceed())
      return true
    })
    return () => unregisterCloseGuard(winId)
  }, [winId])

  if (ok === false) {
    return <div className={styles.missing}>Paint isn’t installed (public/jspaint/ missing).</div>
  }
  return <iframe ref={iframeRef} className={styles.frame} src={PAINT_URL} title="Paint" />
}
