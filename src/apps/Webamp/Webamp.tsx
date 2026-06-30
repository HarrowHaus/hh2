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
    let webamp: Webamp | null = null

    // renderWhenReady() runs centerWindowsInContainer(el) — Webamp centers its
    // own windows inside `el` by reading its bounds. So we must NOT dispatch our
    // own positions (that pushed them to page 0,0 = viewport top-left), and we
    // must wait until the window-open animation has settled so `el`'s bounds are
    // final before Webamp measures them.
    const start = () => {
      if (disposed) return
      try {
        webamp = new Webamp({ enableHotkeys: true })
      } catch {
        setFailed(true)
        return
      }
      webampRef.current = webamp
      webamp
        .renderWhenReady(el)
        .then(() => { if (disposed) webamp?.dispose() })
        .catch(() => { if (!disposed) setFailed(true) })
    }
    const timer = window.setTimeout(start, 220)

    return () => {
      disposed = true
      window.clearTimeout(timer)
      try { webamp?.dispose() } catch { /* already gone */ }
      webampRef.current = null
    }
  }, [])

  if (failed) {
    return <div className={styles.missing}>Winamp couldn’t start in this browser.</div>
  }
  return <div ref={containerRef} className={styles.container} />
}
