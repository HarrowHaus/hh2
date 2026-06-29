import { useEffect, useRef, useState } from 'react'
import styles from './Keygen.module.css'

// Warez keygen prop (docs/07 warez/emulation vein, docs/08 Tier 2). A diorama of
// the scene keygen — ASCII group logo, a fake serial, greetz scroller, and the
// signature CHIPTUNE that kicks in (an ORIGINAL Web Audio square-wave engine, no
// libopenmpt/.mod). INERT: invented group + product, random gibberish serial, no
// real crack code or real software. Non-narrating (Rule 2).

// --- original chiptune engine (square/tri leads + noise hat, lookahead clock) ---
const LEAD = [440, 0, 659.25, 523.25, 440, 0, 329.63, 392, 440, 0, 659.25, 783.99, 880, 659.25, 523.25, 392]
const BASS = [110, 110, 0, 110, 98, 98, 0, 98, 87.31, 87.31, 0, 87.31, 82.41, 0, 110, 0]

function startChiptune(ctx: AudioContext): () => void {
  const master = ctx.createGain()
  master.gain.value = 0.16
  master.connect(ctx.destination)

  // pre-baked noise buffer for the hat
  const nb = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate)
  const nd = nb.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1

  const bpm = 134
  const stepDur = 60 / bpm / 4
  let step = 0
  let nextTime = ctx.currentTime + 0.05

  const tone = (freq: number, t: number, dur: number, type: OscillatorType, vol: number) => {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(master)
    o.start(t)
    o.stop(t + dur + 0.02)
  }
  const hat = (t: number) => {
    const s = ctx.createBufferSource()
    s.buffer = nb
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.12, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 6000
    s.connect(hp)
    hp.connect(g)
    g.connect(master)
    s.start(t)
    s.stop(t + 0.05)
  }

  const tick = () => {
    while (nextTime < ctx.currentTime + 0.12) {
      const lead = LEAD[step % LEAD.length]
      if (lead) tone(lead, nextTime, stepDur * 0.9, 'square', 0.4)
      const bass = BASS[step % BASS.length]
      if (bass) tone(bass, nextTime, stepDur * 1.9, 'triangle', 0.5)
      if (step % 2 === 0) hat(nextTime)
      nextTime += stepDur
      step++
    }
  }
  const timer = window.setInterval(tick, 25)
  return () => {
    window.clearInterval(timer)
    master.disconnect()
  }
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
function makeSerial(): string {
  const grp = () =>
    Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
  return [grp(), grp(), grp(), grp()].join('-')
}

const LOGO = String.raw`
 ▄▄▄· ▄ .▄▄▄▄·  ▄▄· ▄▄▄  ▄· ▄▌▄▄▄·▄▄▄▄▄
▐█ ▄███▪▐█▐█ ▀█▪▐█ ▌▪▀▄ █·▐█▪██▌▐█ ▄█•██
 ██▀·██▀▐█▐█▀▀█▄██ ▄▄▐▀▀▄ ▐█▌▐█▪ ██▀· ▐█.▪
▐█▪·•██▌▐▀██▄▪▐█▐███▌▐█•█▌ ▐█▀·.▐█▪·• ▐█▌·
.▀   ▀▀▀ ··▀▀▀▀ ·▀▀▀ .▀  ▀  ▀ • .▀    ▀▀▀`

const GREETZ = 'greetz to: NEKROMANTIK · BASEMENT TAPES · DICKCRUSH · the whole scene · keep it ugly · '

export function Keygen() {
  const [serial, setSerial] = useState('—————')
  const [music, setMusic] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const stopRef = useRef<(() => void) | null>(null)

  const toggleMusic = (on: boolean) => {
    if (on) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = ctxRef.current ?? new AC()
      ctxRef.current = ctx
      void ctx.resume()
      stopRef.current?.()
      stopRef.current = startChiptune(ctx)
      setMusic(true)
    } else {
      stopRef.current?.()
      stopRef.current = null
      setMusic(false)
    }
  }

  const generate = () => {
    setSerial(makeSerial())
    if (!music) toggleMusic(true) // the music kicks in with the crack
  }

  useEffect(() => {
    return () => {
      stopRef.current?.()
      void ctxRef.current?.close()
    }
  }, [])

  return (
    <div className={styles.keygen}>
      <pre className={styles.logo} aria-hidden="true">{LOGO}</pre>
      <div className={styles.product}>DarkWave Audio Pro v3.2 — keymaker</div>
      <div className={styles.row}>
        <span className={styles.label}>Name:</span>
        <input className={styles.input} defaultValue="moldmouth" spellCheck={false} />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Serial:</span>
        <input className={styles.serial} value={serial} readOnly />
      </div>
      <div className={styles.btns}>
        <button type="button" className={styles.btn} onClick={generate}>Generate</button>
        <button type="button" className={styles.btn} onClick={() => toggleMusic(!music)}>
          {music ? '♪ Music: ON' : '♪ Music: OFF'}
        </button>
      </div>
      <div className={styles.marquee}>
        <span className={styles.scroll}>{GREETZ.repeat(3)}</span>
      </div>
    </div>
  )
}
