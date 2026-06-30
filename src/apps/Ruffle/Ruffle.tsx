import { useEffect, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import type { AppProps } from '../../os/types'
import { useOS } from '../../os/store'
import styles from './Ruffle.module.css'

// Flash Player (docs/08 Tier 3) — the Ruffle engine (MIT/Apache, vendored to
// public/ruffle/) plays .swf movies in pure wasm, no plugin. Shipped as a ready
// shell: no third-party SWF dumps are bundled (licensing). You open your own
// .swf via the loader (same model as the foobar/theme loaders); the owner's
// original flyer movie drops in here later. Engine is lazy-loaded on first use.
const BASE = import.meta.env.BASE_URL

let scriptPromise: Promise<void> | null = null
function loadEngine(): Promise<void> {
  if (window.RufflePlayer) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `${BASE}ruffle/ruffle.js`
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('ruffle load failed'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export function Ruffle(_props: AppProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<RuffleInstance | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [movieName, setMovieName] = useState('')
  const openApp = useOS((s) => s.openApp)

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.remove()
      } catch {
        /* ignore */
      }
    }
  }, [])

  async function play(buf: ArrayBuffer, name: string) {
    setState('loading')
    setMovieName(name)
    try {
      await loadEngine()
      const src = window.RufflePlayer
      if (!src || !hostRef.current) throw new Error('no engine')
      src.config = { publicPath: `${BASE}ruffle/`, autoplay: 'on', unmuteOverlay: 'visible', logLevel: 'error' }
      playerRef.current?.remove()
      const player = src.newest().createPlayer()
      player.style.width = '100%'
      player.style.height = '100%'
      hostRef.current.appendChild(player)
      playerRef.current = player
      await player.load({ data: new Uint8Array(buf) })
      setState('playing')
    } catch {
      setState('error')
    }
  }

  function onFile(file: File | undefined) {
    if (!file) return
    if (!/\.swf$/i.test(file.name)) {
      setState('error')
      return
    }
    file.arrayBuffer().then((b) => play(b, file.name)).catch(() => setState('error'))
  }
  function onInput(e: ChangeEvent<HTMLInputElement>) {
    onFile(e.target.files?.[0])
  }
  function onDrop(e: DragEvent) {
    e.preventDefault()
    onFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className={styles.ruffle}>
      <div className={styles.bar}>
        <label className={styles.btn}>
          Open Movie…
          <input type="file" accept=".swf" onChange={onInput} hidden />
        </label>
        <span className={styles.name}>{movieName || 'no movie loaded'}</span>
      </div>

      <div
        ref={hostRef}
        className={styles.stage}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {state !== 'playing' && (
          <div className={styles.placeholder}>
            {state === 'loading' ? (
              <p>loading movie…</p>
            ) : state === 'error' ? (
              <p>couldn't play that file. drop a valid <b>.swf</b>.</p>
            ) : (
              <>
                <div className={styles.flashMark}>SWF</div>
                <p>drop a <b>.swf</b> here, or use <b>Open Movie…</b></p>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => openApp('ie', { url: 'http://web.archive.org/web/2008/http://www.newgrounds.com/' })}
                >
                  find more flash on the Old Net →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
