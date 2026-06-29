import { useEffect, useRef, useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './V86.module.css'

// x86 PC emulator (docs/08 Tier 3) — v86 (BSD-2-Clause) boots a real OS in the
// browser. Engine wasm + SeaBIOS + VGABIOS + a FreeDOS floppy (all freely
// redistributable) are vendored to public/v86/, so it runs fully offline with
// no copyrighted content. The library is lazy-imported (own bundle chunk).
const BASE = import.meta.env.BASE_URL

export function V86App(_props: AppProps) {
  const screenRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'boot' | 'ready' | 'error'>('boot')

  useEffect(() => {
    let emulator: { destroy?: () => void; add_listener?: (e: string, cb: () => void) => void } | null = null
    let disposed = false

    void (async () => {
      try {
        const { V86 } = await import('v86/build/libv86.mjs')
        if (disposed || !screenRef.current) return
        const em = new V86({
          wasm_path: `${BASE}v86/v86.wasm`,
          bios: { url: `${BASE}v86/seabios.bin` },
          vga_bios: { url: `${BASE}v86/vgabios.bin` },
          fda: { url: `${BASE}v86/freedos722.img` },
          screen_container: screenRef.current,
          autostart: true,
          disable_speaker: true,
        })
        emulator = em
        em.add_listener?.('emulator-ready', () => {
          if (!disposed) setStatus('ready')
        })
      } catch {
        if (!disposed) setStatus('error')
      }
    })()

    return () => {
      disposed = true
      try {
        emulator?.destroy?.()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return (
    <div className={styles.v86}>
      <div className={styles.bar}>
        <span>FreeDOS · v86</span>
        <span className={styles.hint}>
          {status === 'boot' ? 'booting…' : status === 'error' ? 'failed to start' : 'click the screen to type'}
        </span>
      </div>
      {/* v86 fills this with a text <div> + graphics <canvas>. */}
      <div ref={screenRef} className={styles.screen}>
        <div className={styles.textmode} />
        <canvas className={styles.canvas} />
      </div>
    </div>
  )
}
