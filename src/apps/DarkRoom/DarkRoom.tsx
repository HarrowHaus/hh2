import { useEffect, useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './DarkRoom.module.css'

// A Dark Room (docs/08 Tier C) — the real open-source game (doublespeakgames/
// adarkroom, MPL-2.0), vendored offline to public/adarkroom/ (English only; all
// its content is free/open) and loaded in an iframe. Original game, credited.
const URL = `${import.meta.env.BASE_URL}adarkroom/index.html`

export function DarkRoom(_props: AppProps) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    fetch(URL, { method: 'HEAD' }).then((r) => alive && setOk(r.ok)).catch(() => alive && setOk(false))
    return () => { alive = false }
  }, [])
  if (ok === false) return <div className={styles.missing}>A Dark Room isn’t installed (public/adarkroom/ missing).</div>
  return <iframe className={styles.frame} src={URL} title="A Dark Room" />
}
