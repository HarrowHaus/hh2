import { useEffect, useMemo, useState } from 'react'
import { useFS } from '../../os/fs/store'
import { useOS } from '../../os/store'
import { listDir, parentOf, baseName } from '../../os/fs/path'
import { ART } from './art'
import type { AppProps } from '../../os/types'
import styles from './ImageViewer.module.css'

// Windows Picture and Fax Viewer (docs/03). Renders original SVG art recreations
// stored as an art id in the file's content. Prev/Next walk sibling images in
// the same folder; zoom/rotate are real; the rest of the classic toolbar is
// cosmetic. Non-functional props otherwise.

export function ImageViewer({ winId, args }: AppProps) {
  const nodes = useFS((s) => s.nodes)
  const setWindowTitle = useOS((s) => s.setWindowTitle)

  const initial = (args?.path as string) || ''
  const [path, setPath] = useState(initial)
  const [scale, setScale] = useState(1)
  const [rot, setRot] = useState(0)

  // Sibling images in the same folder, for the filmstrip prev/next.
  const siblings = useMemo(() => {
    const dir = parentOf(path)
    return listDir(nodes, dir).filter((n) => n.kind === 'image')
  }, [nodes, path])
  const idx = siblings.findIndex((n) => n.path === path)

  const node = nodes[path]
  const Art = node?.content ? ART[node.content] : undefined

  useEffect(() => {
    setWindowTitle(winId, node ? `${baseName(path)} - Windows Picture and Fax Viewer` : 'Windows Picture and Fax Viewer')
  }, [winId, path, node, setWindowTitle])

  const go = (delta: number) => {
    if (siblings.length < 2) return
    const next = siblings[(idx + delta + siblings.length) % siblings.length]
    if (next) { setPath(next.path); setScale(1); setRot(0) }
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.stage}>
        {Art ? (
          <div className={styles.imgwrap} style={{ transform: `scale(${scale}) rotate(${rot}deg)` }}>
            <Art className={styles.img} />
          </div>
        ) : (
          <div className={styles.missing}>Preview not available.</div>
        )}
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={styles.rbtn} title="Previous Image" onClick={() => go(-1)} disabled={siblings.length < 2}>◄</button>
        <button type="button" className={styles.rbtn} title="Next Image" onClick={() => go(1)} disabled={siblings.length < 2}>►</button>
        <span className={styles.sep} />
        <button type="button" className={styles.rbtn} title="Best Fit" onClick={() => { setScale(1); setRot(0) }}>▭</button>
        <button type="button" className={styles.rbtn} title="Actual Size" onClick={() => setScale(1)}>1:1</button>
        <button type="button" className={styles.rbtn} title="Zoom In" onClick={() => setScale((s) => Math.min(3, s + 0.25))}>+</button>
        <button type="button" className={styles.rbtn} title="Zoom Out" onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}>−</button>
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
