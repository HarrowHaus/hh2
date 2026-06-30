import { useEffect, useRef, useState } from 'react'
import Webamp from 'webamp'
import type { AppProps } from '../../os/types'
import styles from './Webamp.module.css'

// Winamp (docs/08 Tier B) — Webamp (captbaritone/webamp, MIT), the real Winamp
// 2 in the browser, as our BONUS player (custom foobar2000 stays the music
// pillar). Ships with Webamp's bundled classic base skin and full transport +
// playlist + EQ; drag audio onto it (or Eject) to play, hotkeys on. Rendered
// into our window container so it stays inside the frame.
//
// Deferred (named): Winamp Skin Museum random-skin loading and butterchurn
// Milkdrop — both need extra integration (cross-origin skin fetch / the milkdrop
// window) and couldn't be verified here; revisit. The Winamp/Nullsoft names and
// the classic skin are Nullsoft/Llama-Group property, used nominatively — no
// implied affiliation.

export function WebampApp(_props: AppProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const webampRef = useRef<Webamp | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let disposed = false

    let webamp: Webamp
    try {
      webamp = new Webamp({ enableHotkeys: true, zIndex: 1 })
    } catch {
      setFailed(true)
      return
    }
    webampRef.current = webamp
    webamp
      .renderWhenReady(el)
      .then(() => {
        if (disposed) { webamp.dispose(); return }
        // Webamp defaults its windows to viewport-centered coords that escape a
        // contained window. Anchor main + EQ + playlist to the top-left of our
        // frame and push milkdrop off-screen (daedalOS does the same).
        try {
          const store = (webamp as unknown as { store?: { dispatch: (a: unknown) => void } }).store
          store?.dispatch({
            type: 'UPDATE_WINDOW_POSITIONS',
            positions: {
              main: { x: 0, y: 0 },
              equalizer: { x: 0, y: 116 },
              playlist: { x: 0, y: 232 },
              milkdrop: { x: -9999, y: -9999 },
            },
          })
        } catch { /* positioning is best-effort */ }
      })
      .catch(() => { if (!disposed) setFailed(true) })

    return () => {
      disposed = true
      try { webamp.dispose() } catch { /* already gone */ }
      webampRef.current = null
    }
  }, [])

  if (failed) {
    return <div className={styles.missing}>Winamp couldn’t start in this browser.</div>
  }
  return <div ref={containerRef} className={styles.container} />
}
