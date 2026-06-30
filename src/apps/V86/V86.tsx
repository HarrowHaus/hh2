import { useEffect, useRef, useState } from 'react'
import type { AppProps } from '../../os/types'
import styles from './V86.module.css'

// x86 PC emulator (docs/08 Tier 3 + Tier B) — v86 (BSD-2-Clause) boots a real OS
// in the browser. Engine wasm + SeaBIOS + VGABIOS + a FreeDOS floppy (all freely
// redistributable) are vendored to public/v86/, so it runs fully offline with no
// copyrighted content. The library is lazy-imported (own bundle chunk).
// Tier B adds save-states (manual + periodic autosave, auto-restored when you
// reopen the VM in the same session) and scale-to-fit auto-resize.
const BASE = import.meta.env.BASE_URL

interface Emu {
  destroy?: () => void
  add_listener?: (e: string, cb: (...a: unknown[]) => void) => void
  save_state?: () => Promise<ArrayBuffer>
  restore_state?: (s: ArrayBuffer) => void
}

// Session-scoped save state — survives closing/reopening the VM window (not a
// page reload). Held in memory so multi-MB states never hit storage quotas.
let sessionState: ArrayBuffer | null = null

export function V86App(_props: AppProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const emuRef = useRef<Emu | null>(null)
  const [status, setStatus] = useState<'boot' | 'ready' | 'error'>('boot')
  const [hasState, setHasState] = useState(sessionState !== null)
  const [note, setNote] = useState('')

  async function saveState(manual = true) {
    const em = emuRef.current
    if (!em?.save_state) return
    try {
      sessionState = await em.save_state()
      setHasState(true)
      if (manual) { setNote('state saved'); setTimeout(() => setNote(''), 1500) }
    } catch { if (manual) setNote('save failed') }
  }
  function restoreState() {
    const em = emuRef.current
    if (!em?.restore_state || !sessionState) return
    try { em.restore_state(sessionState); setNote('state restored'); setTimeout(() => setNote(''), 1500) }
    catch { setNote('restore failed') }
  }

  useEffect(() => {
    let disposed = false
    let autosave: ReturnType<typeof setInterval> | undefined

    void (async () => {
      try {
        const { V86 } = await import('v86/build/libv86.mjs')
        if (disposed || !screenRef.current) return
        const em: Emu = new V86({
          wasm_path: `${BASE}v86/v86.wasm`,
          bios: { url: `${BASE}v86/seabios.bin` },
          vga_bios: { url: `${BASE}v86/vgabios.bin` },
          fda: { url: `${BASE}v86/freedos722.img` },
          screen_container: screenRef.current,
          autostart: true,
          disable_speaker: true,
        })
        emuRef.current = em
        em.add_listener?.('emulator-ready', () => {
          if (disposed) return
          setStatus('ready')
          // Auto-restore a state saved earlier this session.
          if (sessionState && em.restore_state) {
            try { em.restore_state(sessionState); setNote('resumed from save') ; setTimeout(() => setNote(''), 1800) } catch { /* fresh boot */ }
          }
          // Periodic autosave so a reopen resumes where you left off.
          autosave = setInterval(() => { void saveState(false) }, 45_000)
        })
      } catch {
        if (!disposed) setStatus('error')
      }
    })()

    return () => {
      disposed = true
      if (autosave) clearInterval(autosave)
      try { emuRef.current?.destroy?.() } catch { /* ignore */ }
      emuRef.current = null
    }
  }, [])

  // Scale-to-fit: keep the emulated screen filling the window, letterboxed,
  // preserving aspect. Recomputed on resize and on a timer (the guest can switch
  // text/graphics resolutions at runtime).
  useEffect(() => {
    const stage = stageRef.current, scr = screenRef.current
    if (!stage || !scr) return
    const fit = () => {
      const natW = scr.offsetWidth, natH = scr.offsetHeight
      if (!natW || !natH) return
      const k = Math.min(stage.clientWidth / natW, stage.clientHeight / natH)
      scr.style.transform = `scale(${k > 0 ? k : 1})`
    }
    const ro = new ResizeObserver(fit)
    ro.observe(stage)
    const t = setInterval(fit, 1000)
    fit()
    return () => { ro.disconnect(); clearInterval(t) }
  }, [])

  return (
    <div className={styles.v86}>
      <div className={styles.bar}>
        <span>FreeDOS · v86</span>
        <button type="button" className={styles.btn} onClick={() => void saveState(true)} disabled={status !== 'ready'}>Save State</button>
        <button type="button" className={styles.btn} onClick={restoreState} disabled={status !== 'ready' || !hasState}>Restore</button>
        <span className={styles.hint}>
          {note || (status === 'boot' ? 'booting…' : status === 'error' ? 'failed to start' : 'click the screen to type')}
        </span>
      </div>
      <div ref={stageRef} className={styles.stage}>
        {/* v86 fills this with a text <div> + graphics <canvas>. */}
        <div ref={screenRef} className={styles.screen}>
          <div className={styles.textmode} />
          <canvas className={styles.canvas} />
        </div>
      </div>
    </div>
  )
}
