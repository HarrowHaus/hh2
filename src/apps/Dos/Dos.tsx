import { useEffect, useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './Dos.module.css'

// MS-DOS Prompt (docs/08 Tier B) — js-dos v8 (caiiyycuk/js-dos, GPL-2.0),
// vendored offline to public/jsdos/ and isolated in an iframe (its own dir +
// LICENSE, the copyleft-isolation model). Classic DOSBox backend, cloud off. No
// DOS content bundled — you load your own .jsdos/.zip; DOSBox runs it locally.
// js-dos auto-persists the drive to IndexedDB (its built-in save state).
const DOS_URL = `${import.meta.env.BASE_URL}jsdos/index.html`

export function Dos(_props: AppProps) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    fetch(DOS_URL, { method: 'HEAD' })
      .then((r) => alive && setOk(r.ok))
      .catch(() => alive && setOk(false))
    return () => { alive = false }
  }, [])

  if (ok === false) {
    return <div className={styles.missing}>DOSBox isn’t installed (public/jsdos/ missing).</div>
  }
  return (
    <iframe
      className={styles.frame}
      src={DOS_URL}
      title="MS-DOS Prompt"
      allow="autoplay; gamepad; fullscreen"
    />
  )
}
