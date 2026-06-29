import type { AppProps } from '../../os/types'
import styles from './Sigil.module.css'
import { useState, useRef, useEffect, useCallback } from 'react'

// ── PRNG (seeded) ──────────────────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashLetters(letters: string, variation: number): number {
  let h = 0x811c9dc5 ^ (variation * 2654435761)
  for (let i = 0; i < letters.length; i++) {
    h ^= letters.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// ── Letter → abstract path segments ───────────────────────────────────────
type Vec2 = [number, number]

interface Stroke {
  kind: 'line' | 'arc' | 'bezier'
  pts: Vec2[]
  dot?: boolean   // terminal dot at end
  cross?: boolean // small crossbar midpoint
}

const LETTER_ANGLES: Record<string, number> = {
  B: 0, C: 22.5, D: 45, F: 67.5, G: 90, H: 112.5, J: 135, K: 157.5,
  L: 180, M: 202.5, N: 225, P: 247.5, Q: 270, R: 292.5, S: 315, T: 337.5,
  V: 30, W: 60, X: 120, Y: 150, Z: 210,
}

function letterToStroke(letter: string, rng: () => number, radius: number): Stroke {
  const angleDeg = (LETTER_ANGLES[letter] ?? (letter.charCodeAt(0) * 15.3)) % 360
  const angleRad = (angleDeg * Math.PI) / 180
  const inner = radius * (0.28 + rng() * 0.22)
  const outer = radius * (0.55 + rng() * 0.30)
  const ox = Math.cos(angleRad)
  const oy = Math.sin(angleRad)
  // perpendicular
  const px = -oy
  const py = ox
  const bend = (rng() - 0.5) * radius * 0.55

  const startPt: Vec2 = [ox * inner, oy * inner]
  const endPt: Vec2 = [ox * outer, oy * outer]

  const kind = rng() < 0.45 ? 'bezier' : rng() < 0.6 ? 'arc' : 'line'

  if (kind === 'bezier') {
    const cp1: Vec2 = [
      ox * inner * 0.5 + px * bend,
      oy * inner * 0.5 + py * bend,
    ]
    const cp2: Vec2 = [
      ox * outer * 0.7 + px * bend * 0.4,
      oy * outer * 0.7 + py * bend * 0.4,
    ]
    return {
      kind: 'bezier',
      pts: [startPt, cp1, cp2, endPt],
      dot: rng() < 0.55,
      cross: rng() < 0.35,
    }
  }
  if (kind === 'arc') {
    const mid: Vec2 = [
      (startPt[0] + endPt[0]) * 0.5 + px * bend,
      (startPt[1] + endPt[1]) * 0.5 + py * bend,
    ]
    return { kind: 'arc', pts: [startPt, mid, endPt], dot: rng() < 0.5, cross: false }
  }
  return { kind: 'line', pts: [startPt, endPt], dot: rng() < 0.45, cross: rng() < 0.4 }
}

// ── Canvas draw ────────────────────────────────────────────────────────────
function drawSigil(
  ctx: CanvasRenderingContext2D,
  letters: string,
  variation: number,
  progress: number,   // 0..1 for draw-in animation
): void {
  const { width, height } = ctx.canvas
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(cx, cy) * 0.82

  ctx.clearRect(0, 0, width, height)

  // Background
  ctx.fillStyle = '#0b0b0f'
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.translate(cx, cy)

  const seed = hashLetters(letters || 'NULL', variation)
  const rng = mulberry32(seed)

  // Outer circle glow
  const circleAlpha = Math.min(1, progress * 1.5)
  const grad = ctx.createRadialGradient(0, 0, radius * 0.85, 0, 0, radius + 4)
  grad.addColorStop(0, `rgba(160,100,220,${0.18 * circleAlpha})`)
  grad.addColorStop(1, `rgba(60,20,100,0)`)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(0, 0, radius + 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = `rgba(170,110,230,${0.55 * circleAlpha})`
  ctx.lineWidth = 0.8
  ctx.setLineDash([3, 5])
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Inner ring
  ctx.strokeStyle = `rgba(120,70,180,${0.3 * circleAlpha})`
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2)
  ctx.stroke()

  if (letters.length === 0) {
    ctx.restore()
    return
  }

  // Build strokes
  const strokes: Stroke[] = []
  for (const letter of letters) {
    strokes.push(letterToStroke(letter, rng, radius))
  }

  // Draw each stroke scaled by progress
  const totalStrokes = strokes.length
  strokes.forEach((stroke, i) => {
    const strokeProgress = Math.min(1, Math.max(0, progress * (totalStrokes + 1) - i))
    if (strokeProgress <= 0) return

    const alpha = 0.75 + 0.25 * (i / totalStrokes)
    const glowColor = `rgba(200,150,255,${alpha * strokeProgress})`
    const coreColor = `rgba(240,210,255,${alpha * strokeProgress})`

    // Glow pass
    ctx.save()
    ctx.shadowColor = 'rgba(180,100,255,0.9)'
    ctx.shadowBlur = 8
    ctx.strokeStyle = glowColor
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'

    ctx.beginPath()
    if (stroke.kind === 'line') {
      ctx.moveTo(...stroke.pts[0])
      ctx.lineTo(...stroke.pts[1])
    } else if (stroke.kind === 'bezier') {
      ctx.moveTo(...stroke.pts[0])
      ctx.bezierCurveTo(...stroke.pts[1], ...stroke.pts[2], ...stroke.pts[3])
    } else {
      // arc: pass through mid
      const [s, m, e] = stroke.pts
      ctx.moveTo(...s)
      ctx.quadraticCurveTo(...m, ...e)
    }
    ctx.stroke()
    ctx.restore()

    // Core pass
    ctx.save()
    ctx.strokeStyle = coreColor
    ctx.lineWidth = 0.7
    ctx.lineCap = 'round'
    ctx.beginPath()
    if (stroke.kind === 'line') {
      ctx.moveTo(...stroke.pts[0])
      ctx.lineTo(...stroke.pts[1])
    } else if (stroke.kind === 'bezier') {
      ctx.moveTo(...stroke.pts[0])
      ctx.bezierCurveTo(...stroke.pts[1], ...stroke.pts[2], ...stroke.pts[3])
    } else {
      const [s, m, e] = stroke.pts
      ctx.moveTo(...s)
      ctx.quadraticCurveTo(...m, ...e)
    }
    ctx.stroke()

    // Terminal dot
    if (stroke.dot && strokeProgress >= 1) {
      const endPt = stroke.pts[stroke.pts.length - 1]
      ctx.fillStyle = 'rgba(255,230,255,0.9)'
      ctx.shadowColor = 'rgba(200,120,255,1)'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(...endPt, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Crossbar
    if (stroke.cross && stroke.kind !== 'arc' && strokeProgress >= 1) {
      const [s, e] = [stroke.pts[0], stroke.pts[stroke.pts.length - 1]]
      const mx = (s[0] + e[0]) * 0.5
      const my = (s[1] + e[1]) * 0.5
      const dx = e[0] - s[0]
      const dy = e[1] - s[1]
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      const nx = (-dy / len) * 5
      const ny = (dx / len) * 5
      ctx.strokeStyle = 'rgba(220,180,255,0.7)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(mx - nx, my - ny)
      ctx.lineTo(mx + nx, my + ny)
      ctx.stroke()
    }
    ctx.restore()
  })

  ctx.restore()
}

// ── Text processing ────────────────────────────────────────────────────────
function processIntent(text: string): string {
  const vowels = new Set(['A', 'E', 'I', 'O', 'U'])
  const seen = new Set<string>()
  const result: string[] = []
  for (const ch of text.toUpperCase()) {
    if (/[A-Z]/.test(ch) && !vowels.has(ch) && !seen.has(ch)) {
      seen.add(ch)
      result.push(ch)
    }
  }
  return result.join('')
}

// ── Component ──────────────────────────────────────────────────────────────
export function Sigil({ winId: _winId, args: _args }: AppProps) {
  const [intent, setIntent] = useState<string>('')
  const [letters, setLetters] = useState<string>('')
  const [variation, setVariation] = useState<number>(0)
  const [hasGenerated, setHasGenerated] = useState<boolean>(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const progressRef = useRef<number>(1)

  const animate = useCallback((targetLetters: string, targetVariation: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    progressRef.current = 0
    const start = performance.now()
    const duration = 900

    function frame(now: number) {
      const t = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const p = 1 - Math.pow(1 - t, 3)
      progressRef.current = p
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) drawSigil(ctx, targetLetters, targetVariation, p)
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      }
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [])

  const handleGenerate = useCallback(() => {
    const processed = processIntent(intent)
    setLetters(processed)
    setVariation(0)
    setHasGenerated(true)
    animate(processed, 0)
  }, [intent, animate])

  const handleRandomize = useCallback(() => {
    if (!hasGenerated) return
    const newVar = variation + 1
    setVariation(newVar)
    animate(letters, newVar)
  }, [hasGenerated, letters, variation, animate])

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `sigil_${letters || 'blank'}_v${variation}.png`
    a.click()
  }, [letters, variation])

  // Initial empty draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawSigil(ctx, '', 0, 1)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleGenerate()
    },
    [handleGenerate],
  )

  return (
    <div className={styles.sigil}>
      <div className={styles.header}>
        <span className={styles.title}>✦ SIGIL FORGE ✦</span>
        <span className={styles.sub}>Austin Osman Spare / Carroll method</span>
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          type="text"
          placeholder="IT IS MY WILL TO …"
          value={intent}
          onChange={e => setIntent(e.target.value)}
          onKeyDown={handleKey}
          spellCheck={false}
        />
      </div>

      <div className={styles.btnRow}>
        <button className={styles.btn} onClick={handleGenerate}>
          Generate
        </button>
        <button
          className={`${styles.btn} ${!hasGenerated ? styles.btnDisabled : ''}`}
          onClick={handleRandomize}
          disabled={!hasGenerated}
        >
          Randomize
        </button>
        <button
          className={`${styles.btn} ${!hasGenerated ? styles.btnDisabled : ''}`}
          onClick={handleSave}
          disabled={!hasGenerated}
        >
          Save PNG
        </button>
      </div>

      {hasGenerated && (
        <div className={styles.letterSet}>
          <span className={styles.letterLabel}>reduced letters:</span>
          <span className={styles.letterChars}>{letters || '∅'}</span>
        </div>
      )}

      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className={styles.canvas}
        />
      </div>

      {hasGenerated && (
        <div className={styles.footer}>
          variation {variation} · {letters.length} stroke{letters.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
