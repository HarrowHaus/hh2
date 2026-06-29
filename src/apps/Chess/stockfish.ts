// Stockfish engine bridge (docs/08 Tier 2). Stockfish is GPL-3.0; we keep it
// ISOLATED as a separate Web Worker loaded from /public/stockfish/ (a single-
// threaded lite NNUE build — no SharedArrayBuffer/COOP needed), never bundled
// into our MIT app code. License text ships at /stockfish/COPYING.txt and the
// whole project source is public, satisfying GPL source-availability. If the
// worker/wasm fails to load, the caller falls back to the built-in minimax.

const ENGINE_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-18-lite-single.js`

let workerPromise: Promise<Worker> | null = null
let dead = false

function spawn(): Promise<Worker> {
  return new Promise((resolve, reject) => {
    let w: Worker
    try {
      w = new Worker(ENGINE_URL)
    } catch (e) {
      reject(e)
      return
    }
    let ready = false
    const onMsg = (e: MessageEvent) => {
      const line = String(e.data)
      if (line.includes('uciok')) {
        w.postMessage('isready')
      } else if (line.includes('readyok')) {
        ready = true
        w.removeEventListener('message', onMsg)
        resolve(w)
      }
    }
    w.addEventListener('message', onMsg)
    w.addEventListener('error', () => {
      if (!ready) reject(new Error('stockfish worker error'))
    })
    w.postMessage('uci')
    // If the engine never initializes, give up so we fall back.
    setTimeout(() => {
      if (!ready) reject(new Error('stockfish init timeout'))
    }, 8000)
  })
}

function getWorker(): Promise<Worker> {
  if (dead) return Promise.reject(new Error('stockfish disabled'))
  if (!workerPromise) {
    workerPromise = spawn().catch((e) => {
      dead = true // don't keep retrying a broken engine
      workerPromise = null
      throw e
    })
  }
  return workerPromise
}

export interface UciMove {
  from: string
  to: string
  promotion?: string
}

/** Ask Stockfish for the best move at the given position. Rejects on failure.
 *  `skill` (0-20) caps engine strength so lower difficulties are beatable. */
export function stockfishBestMove(
  fen: string,
  movetimeMs: number,
  skill = 20,
): Promise<UciMove | null> {
  return getWorker().then(
    (w) =>
      new Promise<UciMove | null>((resolve, reject) => {
        const onMsg = (e: MessageEvent) => {
          const line = String(e.data)
          if (line.startsWith('bestmove')) {
            w.removeEventListener('message', onMsg)
            clearTimeout(timer)
            const best = line.split(' ')[1]
            if (!best || best === '(none)') {
              resolve(null)
              return
            }
            resolve({
              from: best.slice(0, 2),
              to: best.slice(2, 4),
              promotion: best.length > 4 ? best.slice(4, 5) : undefined,
            })
          }
        }
        const timer = setTimeout(() => {
          w.removeEventListener('message', onMsg)
          reject(new Error('stockfish move timeout'))
        }, movetimeMs + 5000)
        w.addEventListener('message', onMsg)
        w.postMessage(`setoption name Skill Level value ${skill}`)
        w.postMessage(`position fen ${fen}`)
        w.postMessage(`go movetime ${movetimeMs}`)
      }),
  )
}
