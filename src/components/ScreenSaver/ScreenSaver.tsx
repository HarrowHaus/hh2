import { useEffect, useRef, useState, useCallback } from 'react'
import { useOS } from '../../os/store'
import styles from './ScreenSaver.module.css'

// ---------------------------------------------------------------------------
// Public saver list
// ---------------------------------------------------------------------------
export const SAVERS: { id: string; label: string }[] = [
  { id: 'none',     label: '(None)' },
  { id: 'starfield', label: 'Starfield' },
  { id: 'mystify',   label: 'Mystify' },
  { id: 'matrix',   label: 'Matrix' },
  { id: 'pipes',    label: '3D Pipes' },
]

// ---------------------------------------------------------------------------
// Individual saver draw functions
// Each receives a canvas context + a frame-counter mutable ref object.
// Returns a "tick" function called each RAF frame.
// ---------------------------------------------------------------------------

type Ctx = CanvasRenderingContext2D

// ── Starfield ────────────────────────────────────────────────────────────────
function initStarfield(ctx: Ctx) {
  const N = 300
  const stars = Array.from({ length: N }, () => ({
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: Math.random(),
  }))
  return function tick() {
    const { width: W, height: H } = ctx.canvas
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(0, 0, W, H)
    const cx = W / 2, cy = H / 2
    for (const s of stars) {
      s.z -= 0.008
      if (s.z <= 0) { s.x = (Math.random() - 0.5) * 2; s.y = (Math.random() - 0.5) * 2; s.z = 1 }
      const pz = s.z
      const sx = (s.x / pz) * W * 0.5 + cx
      const sy = (s.y / pz) * H * 0.5 + cy
      const r  = Math.max(0.3, (1 - pz) * 2.8)
      const bright = Math.floor((1 - pz) * 255)
      ctx.beginPath()
      ctx.arc(sx, sy, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${bright},${bright},${Math.min(255, bright + 60)})`
      ctx.fill()
    }
  }
}

// ── Mystify ──────────────────────────────────────────────────────────────────
function initMystify(ctx: Ctx) {
  const NUM_POLYS = 3
  const VERTS = 5
  type Poly = { pts: {x:number;y:number}[]; vel: {vx:number;vy:number}[]; hue: number; dh: number }
  function makePoly(): Poly {
    const { width: W, height: H } = ctx.canvas
    return {
      pts:  Array.from({ length: VERTS }, () => ({ x: Math.random()*W, y: Math.random()*H })),
      vel:  Array.from({ length: VERTS }, () => ({ vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3 })),
      hue:  Math.random()*360,
      dh:   (Math.random()-0.5)*0.8,
    }
  }
  const polys: Poly[] = Array.from({ length: NUM_POLYS }, makePoly)
  const TRAIL = 18
  const history: { pts: {x:number;y:number}[]; hue: number }[][] = polys.map(() => [])

  return function tick() {
    const { width: W, height: H } = ctx.canvas
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.fillRect(0, 0, W, H)
    for (let p = 0; p < polys.length; p++) {
      const poly = polys[p]
      // move
      for (let i = 0; i < VERTS; i++) {
        poly.pts[i].x += poly.vel[i].vx; poly.pts[i].y += poly.vel[i].vy
        if (poly.pts[i].x < 0 || poly.pts[i].x > W) poly.vel[i].vx *= -1
        if (poly.pts[i].y < 0 || poly.pts[i].y > H) poly.vel[i].vy *= -1
      }
      poly.hue = (poly.hue + poly.dh + 360) % 360
      // record history
      history[p].push({ pts: poly.pts.map(pt => ({ ...pt })), hue: poly.hue })
      if (history[p].length > TRAIL) history[p].shift()
      // draw trail
      for (let t = 0; t < history[p].length; t++) {
        const { pts, hue } = history[p][t]
        const alpha = (t + 1) / history[p].length * 0.85
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        ctx.closePath()
        ctx.strokeStyle = `hsla(${hue},100%,65%,${alpha})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }
  }
}

// ── Matrix ───────────────────────────────────────────────────────────────────
const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF'
function initMatrix(ctx: Ctx) {
  const FONT_SIZE = 14
  const { width: W, height: H } = ctx.canvas
  const cols = Math.floor(W / FONT_SIZE)
  const drops: number[] = Array.from({ length: cols }, () => Math.random() * -(H / FONT_SIZE))

  return function tick() {
    const { width: cW, height: cH } = ctx.canvas
    const newCols = Math.floor(cW / FONT_SIZE)
    while (drops.length < newCols) drops.push(0)
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0, 0, cW, cH)
    ctx.font = `${FONT_SIZE}px monospace`
    for (let i = 0; i < newCols; i++) {
      const ch = KATAKANA[Math.floor(Math.random() * KATAKANA.length)]
      const bright = drops[i] < 1 ? '255,255,255' : '0,200,0'
      ctx.fillStyle = `rgb(${bright})`
      ctx.fillText(ch, i * FONT_SIZE, drops[i] * FONT_SIZE)
      if (drops[i] * FONT_SIZE > cH && Math.random() > 0.975) drops[i] = 0
      drops[i] += 0.5
    }
  }
}

// ── 3D Pipes ─────────────────────────────────────────────────────────────────
function initPipes(ctx: Ctx) {
  type Dir = 'R'|'L'|'U'|'D'
  const DIRS: Dir[] = ['R','L','U','D']
  const STEP = 28
  const COLORS = ['#e05','#0cf','#0f8','#f90','#c0f','#ff0']
  type Pipe = { x:number; y:number; dir:Dir; color:string; life:number }

  function newPipe(): Pipe {
    const { width: W, height: H } = ctx.canvas
    const dir = DIRS[Math.floor(Math.random()*4)]
    return { x: Math.round(W/2/STEP)*STEP, y: Math.round(H/2/STEP)*STEP, dir, color: COLORS[Math.floor(Math.random()*COLORS.length)], life: 60+Math.random()*80 }
  }

  const pipes: Pipe[] = Array.from({ length: 5 }, newPipe)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  return function tick() {
    const { width: W, height: H } = ctx.canvas
    for (const p of pipes) {
      // occasionally turn
      if (Math.random() < 0.18) p.dir = DIRS[Math.floor(Math.random()*4)]
      const dx = p.dir==='R'?STEP : p.dir==='L'?-STEP : 0
      const dy = p.dir==='D'?STEP : p.dir==='U'?-STEP : 0
      const nx = p.x + dx, ny = p.y + dy
      // draw segment
      ctx.strokeStyle = p.color
      ctx.lineWidth = 8
      ctx.shadowColor = p.color
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(nx, ny)
      ctx.stroke()
      ctx.shadowBlur = 0
      // joint ball
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(nx, ny, 4, 0, Math.PI*2)
      ctx.fill()
      p.x = nx; p.y = ny; p.life--
      // wrap / reset
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || p.life <= 0) {
        Object.assign(p, newPipe())
        // clear occasionally to prevent full coverage
        if (Math.random() < 0.12) {
          ctx.fillStyle = 'rgba(0,0,0,0.35)'
          ctx.fillRect(0, 0, W, H)
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// SaverCanvas — presentational, fills its parent
// ---------------------------------------------------------------------------
export function SaverCanvas({ id, className }: { id: string; className?: string }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const reduced   = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Sync canvas resolution to its display size
    function syncSize() {
      if (!canvas) return
      canvas.width  = canvas.clientWidth  || canvas.offsetWidth  || 300
      canvas.height = canvas.clientHeight || canvas.offsetHeight || 200
    }
    syncSize()

    const ro = new ResizeObserver(() => { syncSize() })
    ro.observe(canvas)

    if (id === 'none' || reduced) {
      // Static black frame
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return () => ro.disconnect()
    }

    // Initialise the chosen effect
    let tick: (() => void) | null = null
    switch (id) {
      case 'starfield': tick = initStarfield(ctx); break
      case 'mystify':   tick = initMystify(ctx);   break
      case 'matrix':    tick = initMatrix(ctx);     break
      case 'pipes':     tick = initPipes(ctx);      break
      default:
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    if (!tick) return () => ro.disconnect()

    let running = true
    function loop() {
      if (!running) return
      tick!()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [id, reduced])

  return <canvas ref={canvasRef} className={`${styles.canvas}${className ? ` ${className}` : ''}`} />
}

// ---------------------------------------------------------------------------
// ScreenSaver — idle-activated full-screen overlay
// ---------------------------------------------------------------------------
const IDLE_MS = 60_000

export function ScreenSaver(): JSX.Element | null {
  const selected = useOS((s) => s.screensaver)
  const [active, setActive] = useState(false)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef  = useRef(false)
  // Track whether we just activated so the first event doesn't instantly dismiss
  const justActivated = useRef(false)

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Keep ref in sync so event handlers have the latest value
  useEffect(() => { activeRef.current = active }, [active])

  const dismiss = useCallback(() => {
    setActive(false)
    activeRef.current = false
    justActivated.current = false
  }, [])

  const arm = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setActive(true)
      activeRef.current = true
      justActivated.current = true
      // Clear the "just activated" guard after two animation frames
      requestAnimationFrame(() => requestAnimationFrame(() => { justActivated.current = false }))
    }, IDLE_MS)
  }, [])

  const handleActivity = useCallback(() => {
    if (activeRef.current) {
      if (justActivated.current) return   // ignore the activating event itself
      dismiss()
      arm()
    } else {
      arm()
    }
  }, [arm, dismiss])

  useEffect(() => {
    // Don't arm if saver is none or reduced-motion
    if (selected === 'none' || reduced) return

    const events = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const
    for (const ev of events) window.addEventListener(ev, handleActivity, { passive: true })
    arm()

    return () => {
      for (const ev of events) window.removeEventListener(ev, handleActivity)
      if (timerRef.current) clearTimeout(timerRef.current)
      cancelAnimationFrame(0)
    }
  }, [selected, reduced, handleActivity, arm])

  if (selected === 'none' || reduced || !active) return null

  return (
    <div className={styles.overlay}>
      <SaverCanvas id={selected} />
    </div>
  )
}
