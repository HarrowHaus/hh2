import { useEffect, useRef, useCallback } from 'react'
import type { AppProps } from '../../os/types'
import styles from './Runner.module.css'

const W = 600
const H = 180
const GROUND = 140
const GRAVITY = 0.55
const JUMP_VY = -11
const BASE_SPEED = 3
const HI_KEY = 'hmd.runner.hi'

type Phase = 'idle' | 'running' | 'dead'

interface Obs {
  x: number
  y: number
  w: number
  h: number
  flying: boolean
  shape: 'tomb' | 'spike' | 'eye'
}

export function Runner({ winId, args }: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    phase: 'idle' as Phase,
    tick: 0,
    score: 0,
    hi: Number(localStorage.getItem(HI_KEY) ?? 0),
    // creature — a small ghost
    cy: GROUND - 28,
    vy: 0,
    onGround: true,
    ducking: false,
    // obstacles
    obs: [] as Obs[],
    nextObs: 90,
    speed: BASE_SPEED,
    // bg cycle
    nightRatio: 0,
    rafId: 0,
  })
  const s = stateRef.current

  const jump = useCallback(() => {
    if (s.phase === 'idle') { s.phase = 'running'; return }
    if (s.phase === 'dead') {
      Object.assign(s, {
        phase: 'running', tick: 0, score: 0,
        cy: GROUND - 28, vy: 0, onGround: true, ducking: false,
        obs: [], nextObs: 90, speed: BASE_SPEED, nightRatio: 0,
      })
      return
    }
    if (s.onGround) { s.vy = JUMP_VY; s.onGround = false }
  }, [s])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // ---- draw helpers ----

    function drawGhost(ctx: CanvasRenderingContext2D, x: number, y: number, duck: boolean) {
      const h = duck ? 20 : 28
      const w = 22
      ctx.save()
      ctx.translate(x, y)
      // body
      ctx.fillStyle = '#c8c8e8'
      ctx.beginPath()
      ctx.arc(w / 2, h * 0.4, w / 2, Math.PI, 0)
      ctx.lineTo(w, h)
      // wavy bottom
      const seg = w / 3
      ctx.quadraticCurveTo(w - seg * 0.5, h + 5, w - seg, h)
      ctx.quadraticCurveTo(w - seg * 1.5, h - 5, w - seg * 2, h)
      ctx.quadraticCurveTo(seg * 0.5, h + 5, 0, h)
      ctx.closePath()
      ctx.fill()
      // eye sockets
      ctx.fillStyle = '#1a1a2e'
      ctx.beginPath(); ctx.ellipse(w * 0.3, h * 0.35, 3.5, 3.5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(w * 0.7, h * 0.35, 3.5, 3.5, 0, 0, Math.PI * 2); ctx.fill()
      // glow pupils
      ctx.fillStyle = '#ff4466'
      ctx.beginPath(); ctx.ellipse(w * 0.3, h * 0.35, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(w * 0.7, h * 0.35, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }

    function drawObs(ctx: CanvasRenderingContext2D, o: Obs) {
      ctx.save()
      ctx.translate(o.x, o.y)
      if (o.shape === 'tomb') {
        ctx.fillStyle = '#555577'
        ctx.fillRect(0, 0, o.w, o.h)
        ctx.fillStyle = '#44446a'
        ctx.fillRect(o.w * 0.2, -8, o.w * 0.6, 12)
        ctx.fillStyle = '#7777aa'
        ctx.font = 'bold 10px monospace'
        ctx.fillText('RIP', o.w * 0.2, o.h * 0.45)
      } else if (o.shape === 'spike') {
        ctx.fillStyle = '#884444'
        const pts = [[0, o.h], [o.w / 2, 0], [o.w, o.h]] as [number, number][]
        ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.closePath(); ctx.fill()
      } else {
        // floating eye
        ctx.fillStyle = '#e8e8cc'
        ctx.beginPath(); ctx.ellipse(o.w / 2, o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#2244cc'
        ctx.beginPath(); ctx.ellipse(o.w / 2, o.h / 2, o.w * 0.3, o.h * 0.3, 0, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#000'
        ctx.beginPath(); ctx.ellipse(o.w / 2, o.h / 2, o.w * 0.15, o.h * 0.15, 0, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
    }

    function spawnObs() {
      const flying = Math.random() < 0.25 && s.tick > 300
      const shape = flying ? 'eye' as const : (Math.random() < 0.5 ? 'tomb' as const : 'spike' as const)
      const w = shape === 'tomb' ? 24 : shape === 'spike' ? 20 : 22
      const h = shape === 'tomb' ? 38 : shape === 'spike' ? 32 : 22
      const y = flying ? GROUND - 60 - Math.random() * 20 : GROUND - h
      s.obs.push({ x: W + 10, y, w, h, flying, shape })
    }

    function rectOverlap(ax: number, ay: number, aw: number, ah: number,
                          bx: number, by: number, bw: number, bh: number) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
    }

    // ---- main loop ----
    function loop() {
      s.rafId = requestAnimationFrame(loop)

      const nightRatio = Math.min(1, s.tick / 2400)
      s.nightRatio = nightRatio
      const skyTop = lerpColor('#3a1c4a', '#0d0d1a', nightRatio)
      const skyBot = lerpColor('#7a3060', '#1a1a3a', nightRatio)

      // sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, skyTop)
      grad.addColorStop(1, skyBot)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // ground
      ctx.fillStyle = lerpColor('#5a3060', '#2a2a4a', nightRatio)
      ctx.fillRect(0, GROUND, W, H - GROUND)
      ctx.strokeStyle = lerpColor('#cc88cc', '#6666aa', nightRatio)
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke()

      if (s.phase === 'running') {
        s.tick++
        s.score = Math.floor(s.tick / 6)
        s.speed = BASE_SPEED + s.score / 180

        // physics
        s.vy += GRAVITY
        s.cy += s.vy
        if (s.cy >= GROUND - (s.ducking ? 20 : 28)) {
          s.cy = GROUND - (s.ducking ? 20 : 28)
          s.vy = 0
          s.onGround = true
        }

        // obstacles
        s.nextObs--
        if (s.nextObs <= 0) {
          spawnObs()
          s.nextObs = Math.max(45, 110 - s.score / 8) + Math.random() * 40
        }
        s.obs.forEach(o => { o.x -= s.speed })
        s.obs = s.obs.filter(o => o.x > -60)

        // collision (shrink hitbox slightly)
        const gh = s.ducking ? 20 : 28
        const gw = 18
        for (const o of s.obs) {
          if (rectOverlap(14 + 2, s.cy + 3, gw - 4, gh - 4, o.x + 2, o.y + 2, o.w - 4, o.h - 4)) {
            s.phase = 'dead'
            if (s.score > s.hi) { s.hi = s.score; localStorage.setItem(HI_KEY, String(s.hi)) }
            break
          }
        }
      }

      // draw obstacles
      s.obs.forEach(o => drawObs(ctx, o))

      // draw ghost
      drawGhost(ctx, 14, s.cy, s.ducking)

      // score HUD
      ctx.fillStyle = '#ddddff'
      ctx.font = '11px "Courier New", monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`HI ${s.hi.toString().padStart(5, '0')}  ${s.score.toString().padStart(5, '0')}`, W - 8, 16)
      ctx.textAlign = 'left'

      // overlays
      if (s.phase === 'idle') {
        overlay(ctx, 'RUNNER.EXE', 'SPACE / CLICK to start')
      } else if (s.phase === 'dead') {
        overlay(ctx, 'GAME OVER', 'SPACE / CLICK to retry')
      }
    }

    function overlay(ctx: CanvasRenderingContext2D, title: string, sub: string) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(W / 2 - 120, H / 2 - 30, 240, 56)
      ctx.strokeStyle = '#aa66cc'
      ctx.lineWidth = 1
      ctx.strokeRect(W / 2 - 120, H / 2 - 30, 240, 56)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(title, W / 2, H / 2 - 10)
      ctx.fillStyle = '#cc99ff'
      ctx.font = '10px "Courier New", monospace'
      ctx.fillText(sub, W / 2, H / 2 + 10)
      ctx.textAlign = 'left'
    }

    function lerpColor(a: string, b: string, t: number): string {
      const ah = parseInt(a.slice(1), 16)
      const bh = parseInt(b.slice(1), 16)
      const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff
      const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff
      const r = Math.round(ar + (br - ar) * t)
      const g = Math.round(ag + (bg - ag) * t)
      const bv = Math.round(ab + (bb - ab) * t)
      return `#${((r << 16) | (g << 8) | bv).toString(16).padStart(6, '0')}`
    }

    loop()

    // input handlers
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump() }
      if (e.code === 'ArrowDown') { s.ducking = !s.onGround ? true : s.ducking }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') s.ducking = false
    }
    const onClick = () => jump()

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(s.rafId)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('click', onClick)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // suppress unused-var lint on winId/args — required by AppProps contract
  void winId; void args

  return (
    <div className={styles.runner}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className={styles.canvas}
      />
    </div>
  )
}
