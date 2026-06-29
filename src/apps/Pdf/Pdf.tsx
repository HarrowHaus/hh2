import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useFS } from '../../os/fs/store'
import type { AppProps } from '../../os/types'
import styles from './Pdf.module.css'

// PDF viewer (Tier 1, docs/08) built on Mozilla pdf.js (Apache-2.0 — CREDITS.md).
// Loads the opened node's `url` (a real PDF asset) and renders pages to a canvas
// with page nav + zoom. The worker is bundled via Vite's ?url import.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export function Pdf({ args }: AppProps) {
  const path = args?.path as string | undefined
  const url = useFS((s) => (path ? (s.nodes[path]?.url ?? '') : ''))
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [error, setError] = useState<string | null>(null)
  // Hold the loaded document across renders.
  const docRef = useRef<pdfjs.PDFDocumentProxy | null>(null)

  // Load the document when the url changes.
  useEffect(() => {
    if (!url) {
      setError('No document.')
      return
    }
    let cancelled = false
    setError(null)
    const task = pdfjs.getDocument({ url })
    task.promise.then(
      (doc) => {
        if (cancelled) return
        docRef.current = doc
        setPages(doc.numPages)
        setPage(1)
      },
      () => {
        if (!cancelled) setError('Could not open this PDF.')
      },
    )
    return () => {
      cancelled = true
      // Destroying the loading task tears down the document + worker port.
      task.destroy()
      docRef.current = null
    }
  }, [url])

  // Render the current page whenever it / the zoom changes.
  useEffect(() => {
    const doc = docRef.current
    const canvas = canvasRef.current
    if (!doc || !canvas || !pages) return
    let cancelled = false
    let task: pdfjs.RenderTask | null = null
    doc.getPage(page).then((pg) => {
      if (cancelled) return
      const viewport = pg.getViewport({ scale })
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      task = pg.render({ canvasContext: ctx, viewport })
      task.promise.catch(() => {})
    })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [page, pages, scale])

  return (
    <div className={styles.pdf}>
      <div className={styles.toolbar}>
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          ◀
        </button>
        <span className={styles.pagenum}>
          {pages ? `${page} / ${pages}` : '—'}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          disabled={page >= pages}
        >
          ▶
        </button>
        <span className={styles.sep} />
        <button type="button" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>−</button>
        <span className={styles.zoom}>{Math.round(scale * 100)}%</span>
        <button type="button" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>+</button>
      </div>
      <div className={styles.stage}>
        {error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <canvas ref={canvasRef} className={styles.canvas} />
        )}
      </div>
    </div>
  )
}
