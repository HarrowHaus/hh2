import { useEffect, useMemo, useRef, useState } from 'react'
import panzoom, { type PanZoom } from 'panzoom'
import { useFS } from '../../os/fs/store'
import { useOS } from '../../os/store'
import { listDir, parentOf, baseName } from '../../os/fs/path'
import { ART } from './art'
import { decodeImage } from './decode'
import type { AppProps } from '../../os/types'
import styles from './ImageViewer.module.css'

// Windows Picture and Fax Viewer (docs/03 + docs/08 Tier 1). Renders original
// SVG art recreations stored as an art id in the file's content. Real pan + zoom
// via panzoom (MIT — CREDITS.md): drag to pan, wheel/pinch to zoom, plus the
// classic toolbar (prev/next, fit, 1:1, zoom, rotate). Rotation is applied on an
// inner wrapper so it composes with panzoom's transform.
export function ImageViewer({ winId, args }: AppProps) {
  const nodes = useFS((s) => s.nodes)
  const setWindowTitle = useOS((s) => s.setWindowTitle)

  const initial = (args?.path as string) || ''
  const [path, setPath] = useState(initial)
  const [rot, setRot] = useState(0)
  // A real raster image the user opened (TIFF/QOI/JXL/HEIF + native), decoded to
  // a URL. Takes priority over the stored SVG art when present.
  const [realSrc, setRealSrc] = useState<string | null>(null)
  const [realName, setRealName] = useState('')
  const [decoding, setDecoding] = useState(false)
  const [decodeErr, setDecodeErr] = useState('')
  const [drag, setDrag] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const pzRef = useRef<PanZoom | null>(null)
  const objUrlRef = useRef<string | null>(null)

  async function openFile(file: File) {
    setDecoding(true); setDecodeErr('')
    try {
      const url = await decodeImage(file)
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
      objUrlRef.current = url.startsWith('blob:') ? url : null
      setRealSrc(url); setRealName(file.name); setRot(0)
    } catch {
      setDecodeErr(`Could not decode "${file.name}".`)
    } finally {
      setDecoding(false)
    }
  }
  // Revoke any object URL on unmount.
  useEffect(() => () => { if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current) }, [])

  const siblings = useMemo(() => {
    const dir = parentOf(path)
    return listDir(nodes, dir).filter((n) => n.kind === 'image')
  }, [nodes, path])
  const idx = siblings.findIndex((n) => n.path === path)

  const node = nodes[path]
  const Art = node?.content ? ART[node.content] : undefined

  useEffect(() => {
    const label = realSrc ? realName : node ? baseName(path) : ''
    setWindowTitle(winId, label ? `${label} - Windows Picture and Fax Viewer` : 'Windows Picture and Fax Viewer')
  }, [winId, path, node, realSrc, realName, setWindowTitle])

  // Attach panzoom once to the pan target.
  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const pz = panzoom(el, {
      maxZoom: 8,
      minZoom: 0.4,
      smoothScroll: false,
      zoomDoubleClickSpeed: 1, // disable dbl-click zoom; we use buttons
      bounds: false,
    })
    pzRef.current = pz
    return () => {
      pz.dispose()
      pzRef.current = null
    }
    // Re-attach when the pan target (real image or stored art) appears/changes.
  }, [realSrc, Art])

  const reset = () => {
    const pz = pzRef.current
    if (pz) {
      pz.zoomAbs(0, 0, 1)
      pz.moveTo(0, 0)
    }
    setRot(0)
  }

  // Reset transform when the image changes.
  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, realSrc])

  const zoomBy = (factor: number) => {
    const pz = pzRef.current
    const stage = stageRef.current
    if (!pz || !stage) return
    const r = stage.getBoundingClientRect()
    pz.smoothZoom(r.left + r.width / 2, r.top + r.height / 2, factor)
  }

  const go = (delta: number) => {
    if (siblings.length < 2) return
    // Returning to the stored-art gallery clears any opened real image.
    setRealSrc(null)
    const next = siblings[(idx + delta + siblings.length) % siblings.length]
    if (next) setPath(next.path)
  }

  return (
    <div
      className={`${styles.viewer} ${drag ? styles.dragging : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) void openFile(f) }}
    >
      <div className={styles.stage} ref={stageRef}>
        {realSrc ? (
          <div className={styles.panTarget} ref={targetRef}>
            <div className={styles.rotWrap} style={{ transform: `rotate(${rot}deg)` }}>
              <img src={realSrc} className={styles.img} alt={realName} draggable={false} />
            </div>
          </div>
        ) : Art ? (
          <div className={styles.panTarget} ref={targetRef}>
            <div className={styles.rotWrap} style={{ transform: `rotate(${rot}deg)` }}>
              <Art className={styles.img} />
            </div>
          </div>
        ) : (
          <div className={styles.missing}>
            {decoding ? 'Decoding…' : decodeErr || 'Preview not available.'}
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.openBtn} title="Open an image (TIFF, QOI, JPEG XL, HEIF + standard)">
          Open…
          <input
            type="file" className={styles.fileInput}
            accept="image/*,.tif,.tiff,.qoi,.jxl,.heic,.heif"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void openFile(f) }}
          />
        </label>
        <span className={styles.sep} />
        <button type="button" className={styles.rbtn} title="Previous Image" onClick={() => go(-1)} disabled={siblings.length < 2}>◄</button>
        <button type="button" className={styles.rbtn} title="Next Image" onClick={() => go(1)} disabled={siblings.length < 2}>►</button>
        <span className={styles.sep} />
        <button type="button" className={styles.rbtn} title="Best Fit" onClick={reset}>▭</button>
        <button type="button" className={styles.rbtn} title="Actual Size" onClick={reset}>1:1</button>
        <button type="button" className={styles.rbtn} title="Zoom In" onClick={() => zoomBy(1.3)}>+</button>
        <button type="button" className={styles.rbtn} title="Zoom Out" onClick={() => zoomBy(1 / 1.3)}>−</button>
        <span className={styles.sep} />
        <button type="button" className={styles.rbtn} title="Rotate Clockwise" onClick={() => setRot((r) => r + 90)}>↻</button>
        <button type="button" className={styles.rbtn} title="Rotate Counterclockwise" onClick={() => setRot((r) => r - 90)}>↺</button>
        <span className={styles.sep} />
        <button type="button" className={styles.rbtn} title="Delete" disabled>✕</button>
        <button type="button" className={styles.rbtn} title="Print" disabled>⎙</button>
        <span className={styles.count}>
          {siblings.length ? `${idx + 1} / ${siblings.length}` : ''}
        </span>
      </div>
    </div>
  )
}
