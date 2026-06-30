import { useEffect, useRef, useState } from 'react'
import * as opentype from 'opentype.js'
import type { AppProps } from '../../os/types'
import styles from './OpenType.module.css'

// OpenType viewer (docs/08 Tier B) — a real font inspector on opentype.js (MIT):
// open an .otf / .ttf / .woff, see its metadata, a live sample line, and the full
// glyph grid. No font is bundled — you open your own (drag-drop or the picker).
// opentype.js name used nominatively.

const PANGRAM = 'The quick brown fox jumps over the lazy dog'

interface Meta {
  file: string
  family: string
  style: string
  version: string
  unitsPerEm: number
  glyphs: number
  ascender: number
  descender: number
  tables: string[]
}

function extract(font: opentype.Font, file: string): Meta {
  const n = font.names
  const pick = (r?: Record<string, string>) => (r ? r.en ?? Object.values(r)[0] ?? '' : '')
  return {
    file,
    family: pick(n.fontFamily) || '(unnamed)',
    style: pick(n.fontSubfamily) || 'Regular',
    version: pick(n.version) || '—',
    unitsPerEm: font.unitsPerEm,
    glyphs: font.glyphs.length,
    ascender: font.ascender,
    descender: font.descender,
    tables: Object.keys(font.tables ?? {}),
  }
}

export function OpenType(_props: AppProps) {
  const [font, setFont] = useState<opentype.Font | null>(null)
  const [meta, setMeta] = useState<Meta | null>(null)
  const [err, setErr] = useState('')
  const [sample, setSample] = useState(PANGRAM)
  const [size, setSize] = useState(48)
  const [drag, setDrag] = useState(false)

  const sampleRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef<HTMLCanvasElement>(null)

  async function loadFile(file: File) {
    try {
      const buf = await file.arrayBuffer()
      const f = opentype.parse(buf)
      setFont(f)
      setMeta(extract(f, file.name))
      setErr('')
    } catch {
      setFont(null); setMeta(null)
      setErr(`Could not parse "${file.name}". opentype.js reads .otf, .ttf and .woff (not .woff2).`)
    }
  }

  // Live sample line.
  useEffect(() => {
    const f = font, c = sampleRef.current
    if (!f || !c) return
    const w = c.clientWidth || 600
    c.width = w
    c.height = Math.ceil(size * 1.6)
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#e8e8ee'
    try { f.draw(ctx, sample || ' ', 8, size + 4, size, { kerning: true }) } catch { /* glyph gaps */ }
  }, [font, sample, size])

  // Full glyph grid (first 256 glyphs).
  useEffect(() => {
    const f = font, c = gridRef.current
    if (!f || !c) return
    const cols = 16, cell = 38
    const count = Math.min(256, f.glyphs.length)
    const rows = Math.ceil(count / cols)
    c.width = cols * cell
    c.height = rows * cell
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, c.height); ctx.stroke() }
    for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * cell); ctx.lineTo(c.width, y * cell); ctx.stroke() }
    ctx.fillStyle = '#cfcfe0'
    const gsize = cell * 0.62
    for (let i = 0; i < count; i++) {
      const col = i % cols, row = Math.floor(i / cols)
      const glyph = f.glyphs.get(i)
      try {
        const path = glyph.getPath(col * cell + cell * 0.2, row * cell + cell * 0.72, gsize)
        path.fill = '#cfcfe0'
        path.draw(ctx)
      } catch { /* skip unrenderable */ }
    }
  }, [font])

  return (
    <div
      className={`${styles.ot} ${drag ? styles.dragging : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false)
        const file = e.dataTransfer.files?.[0]
        if (file) void loadFile(file)
      }}
    >
      <div className={styles.toolbar}>
        <label className={styles.openBtn}>
          Open Font…
          <input
            type="file"
            accept=".otf,.ttf,.woff,font/otf,font/ttf,font/woff"
            className={styles.fileInput}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadFile(f) }}
          />
        </label>
        {meta && <span className={styles.fileName}>{meta.file}</span>}
      </div>

      {!font && (
        <div className={styles.empty}>
          <div className={styles.emptyGlyph}>Aa</div>
          <p>Drop an <b>.otf</b>, <b>.ttf</b>, or <b>.woff</b> here, or use <b>Open Font…</b></p>
          {err && <p className={styles.err}>{err}</p>}
        </div>
      )}

      {font && meta && (
        <div className={styles.body}>
          <div className={styles.sampleArea}>
            <div className={styles.controls}>
              <input
                className={styles.sampleInput}
                value={sample}
                onChange={(e) => setSample(e.target.value)}
                aria-label="Sample text"
              />
              <input
                type="range" min={12} max={120} value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                aria-label="Sample size"
              />
              <span className={styles.sizeVal}>{size}px</span>
            </div>
            <canvas ref={sampleRef} className={styles.sampleCanvas} />
          </div>

          <div className={styles.cols}>
            <div className={styles.metaPanel}>
              <Row k="Family" v={meta.family} />
              <Row k="Style" v={meta.style} />
              <Row k="Version" v={meta.version} />
              <Row k="Units/em" v={String(meta.unitsPerEm)} />
              <Row k="Glyphs" v={String(meta.glyphs)} />
              <Row k="Ascender" v={String(meta.ascender)} />
              <Row k="Descender" v={String(meta.descender)} />
              <Row k="Tables" v={meta.tables.join(', ') || '—'} />
            </div>
            <div className={styles.gridPanel}>
              <div className={styles.gridHead}>Glyphs (first {Math.min(256, meta.glyphs)})</div>
              <div className={styles.gridScroll}>
                <canvas ref={gridRef} className={styles.gridCanvas} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className={styles.metaRow}>
      <span className={styles.metaKey}>{k}</span>
      <span className={styles.metaVal}>{v}</span>
    </div>
  )
}
