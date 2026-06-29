import { useEffect, useRef, useCallback } from 'react'
import type { AppProps } from '../../os/types'
import styles from './Breakout.module.css'

const W = 480
const H = 360
const PADDLE_H = 10
const PADDLE_W = 70
const BALL_R = 7
const BRICK_COLS = 10
const BRICK_ROWS = 5
const BRICK_W = 42
const BRICK_H = 14
const BRICK_PAD = 3
const BRICK_TOP = 40

const BRICK_COLORS = ['#e05c5c', '#e09a3c', '#d4c840', '#5cb85c', '#5b9bd5', '#a06bce']

interface Ball { x: number; y: number; vx: number; vy: number }
interface Brick { x: number; y: number; alive: boolean; color: string }

function makeBricks(level: number): Brick[] {
  const bricks: Brick[] = []
  const rows = Math.min(BRICK_ROWS + level - 1, 8)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: c * (BRICK_W + BRICK_PAD) + BRICK_PAD,
        y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        alive: true,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
      })
    }
  }
  return bricks
}

export function Breakout({ winId: _winId, args: _args }: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {}, []) // placeholder to satisfy lint — real logic below

  useEffect(() => {
    void draw
    // Effects run after mount, so the ref is populated. Assert non-null at the
    // source so the hoisted draw/handler closures below (which don't inherit
    // control-flow narrowing) see non-null types.
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return
    const cv: HTMLCanvasElement = canvas
    const ctx: CanvasRenderingContext2D = ctx2d
    void cv

    let rafId = 0
    let level = 1
    let score = 0
    let lives = 3
    // states: 'idle' | 'playing' | 'gameover' | 'win'
    type State = 'idle' | 'playing' | 'gameover' | 'win'
    let state: State = 'idle'
    let paddleX = W / 2 - PADDLE_W / 2
    let ball: Ball = { x: W / 2, y: H - 60, vx: 0, vy: 0 }
    let bricks: Brick[] = makeBricks(level)
    let keys: Record<string, boolean> = {}

    function baseSpeed() { return 3.5 + (level - 1) * 0.4 }

    function resetBall() {
      ball = { x: W / 2, y: H - 60, vx: 0, vy: 0 }
    }

    function launch() {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3)
      const spd = baseSpeed()
      ball.vx = Math.cos(angle) * spd
      ball.vy = Math.sin(angle) * spd
    }

    function startLevel(lvl: number) {
      level = lvl
      bricks = makeBricks(level)
      resetBall()
      state = 'idle'
    }

    function drawScene() {
      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, W, H)

      // Bricks
      for (const b of bricks) {
        if (!b.alive) continue
        ctx.fillStyle = b.color
        ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H)
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'
        ctx.lineWidth = 1
        ctx.strokeRect(b.x + 0.5, b.y + 0.5, BRICK_W - 1, BRICK_H - 1)
        // highlight
        ctx.fillStyle = 'rgba(255,255,255,0.18)'
        ctx.fillRect(b.x + 1, b.y + 1, BRICK_W - 2, 4)
      }

      // Paddle
      const px = paddleX
      const py = H - PADDLE_H - 8
      const grad = ctx.createLinearGradient(px, py, px, py + PADDLE_H)
      grad.addColorStop(0, '#aaccff')
      grad.addColorStop(1, '#4488cc')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(px, py, PADDLE_W, PADDLE_H, 4)
      ctx.fill()

      // Ball
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = 'rgba(100,180,255,0.7)'
      ctx.lineWidth = 2
      ctx.stroke()

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, W, 30)
      ctx.fillStyle = '#e0e0ff'
      ctx.font = 'bold 13px "Tahoma", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`Score: ${score}`, 10, 20)
      ctx.textAlign = 'center'
      ctx.fillText(`Level ${level}`, W / 2, 20)
      ctx.textAlign = 'right'
      // Hearts for lives
      const hearts = '♥'.repeat(lives) + '♡'.repeat(Math.max(0, 3 - lives))
      ctx.fillText(hearts, W - 10, 20)
      ctx.textAlign = 'left'
    }

    function drawOverlay(line1: string, line2: string) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px "Tahoma", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(line1, W / 2, H / 2 - 20)
      ctx.font = '15px "Tahoma", sans-serif'
      ctx.fillStyle = '#ccccff'
      ctx.fillText(line2, W / 2, H / 2 + 16)
      ctx.textAlign = 'left'
    }

    function step() {
      if (keys['ArrowLeft']) paddleX = Math.max(0, paddleX - 5)
      if (keys['ArrowRight']) paddleX = Math.min(W - PADDLE_W, paddleX + 5)

      if (state === 'playing') {
        ball.x += ball.vx
        ball.y += ball.vy

        // Wall bounces
        if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx) }
        if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx) }
        if (ball.y - BALL_R < 30) { ball.y = 30 + BALL_R; ball.vy = Math.abs(ball.vy) }

        // Paddle collision
        const py = H - PADDLE_H - 8
        if (
          ball.vy > 0 &&
          ball.y + BALL_R >= py &&
          ball.y + BALL_R <= py + PADDLE_H + 4 &&
          ball.x >= paddleX - BALL_R &&
          ball.x <= paddleX + PADDLE_W + BALL_R
        ) {
          const rel = (ball.x - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2) // -1..1
          const angle = rel * (Math.PI / 3) - Math.PI / 2
          const spd = baseSpeed() + 0.5
          ball.vx = Math.cos(angle) * spd
          ball.vy = Math.sin(angle) * spd
          ball.y = py - BALL_R
        }

        // Brick collisions
        for (const b of bricks) {
          if (!b.alive) continue
          const bx2 = b.x + BRICK_W
          const by2 = b.y + BRICK_H
          if (ball.x + BALL_R < b.x || ball.x - BALL_R > bx2) continue
          if (ball.y + BALL_R < b.y || ball.y - BALL_R > by2) continue
          b.alive = false
          score += 10

          const overlapLeft = ball.x + BALL_R - b.x
          const overlapRight = bx2 - (ball.x - BALL_R)
          const overlapTop = ball.y + BALL_R - b.y
          const overlapBottom = by2 - (ball.y - BALL_R)
          const minH = Math.min(overlapLeft, overlapRight)
          const minV = Math.min(overlapTop, overlapBottom)
          if (minH < minV) ball.vx = -ball.vx
          else ball.vy = -ball.vy
          break
        }

        // Ball lost
        if (ball.y - BALL_R > H) {
          lives -= 1
          if (lives <= 0) {
            state = 'gameover'
          } else {
            resetBall()
            state = 'idle'
          }
        }

        // All bricks cleared
        if (bricks.every(b => !b.alive)) {
          state = 'win'
        }
      }

      drawScene()

      if (state === 'idle') {
        drawOverlay(
          level === 1 && score === 0 ? 'BREAKOUT' : `Level ${level}`,
          'Click or press Space to launch'
        )
      } else if (state === 'gameover') {
        drawScene()
        drawOverlay('GAME OVER', `Score: ${score}  —  Click or Space to restart`)
      } else if (state === 'win') {
        drawScene()
        drawOverlay('YOU WIN!', `Score: ${score}  —  Click or Space for next level`)
      }

      rafId = requestAnimationFrame(step)
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = cv.getBoundingClientRect()
      const scaleX = W / rect.width
      const mx = (e.clientX - rect.left) * scaleX
      paddleX = Math.max(0, Math.min(W - PADDLE_W, mx - PADDLE_W / 2))
    }

    function handleAction() {
      if (state === 'idle') {
        state = 'playing'
        launch()
      } else if (state === 'gameover') {
        score = 0
        lives = 3
        startLevel(1)
      } else if (state === 'win') {
        startLevel(level + 1)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      keys[e.key] = true
      if (e.key === ' ') { e.preventDefault(); handleAction() }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault()
    }

    function handleKeyUp(e: KeyboardEvent) { keys[e.key] = false }
    function handleClick() { handleAction() }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    rafId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [draw])

  return (
    <div className={styles.breakout}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className={styles.canvas}
      />
    </div>
  )
}
