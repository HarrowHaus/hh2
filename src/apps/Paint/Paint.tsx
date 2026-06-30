import { useEffect, useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './Paint.module.css'

// Paint (docs/08 Tier B) — the real MS-Paint-style editor, jsPaint
// (1j01/jspaint, MIT), vendored offline to public/jspaint/ (Dustin Brett's
// daedalOS ships the same offline build; ours is that copy) and loaded in an
// iframe. Sits alongside miniPaint (the "Photoshop" app). "Paint" is nominative;
// the engine is jsPaint — credited in CREDITS.md, name terms respected.
const PAINT_URL = `${import.meta.env.BASE_URL}jspaint/index.html`

export function Paint(_props: AppProps) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    fetch(PAINT_URL, { method: 'HEAD' })
      .then((r) => alive && setOk(r.ok))
      .catch(() => alive && setOk(false))
    return () => { alive = false }
  }, [])

  if (ok === false) {
    return <div className={styles.missing}>Paint isn’t installed (public/jspaint/ missing).</div>
  }
  return <iframe className={styles.frame} src={PAINT_URL} title="Paint" />
}
