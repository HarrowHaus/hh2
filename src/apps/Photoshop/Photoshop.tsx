import { useMemo } from 'react'
import { baseName } from '../../os/fs/path'
import type { AppProps } from '../../os/types'
import styles from './Photoshop.module.css'

// Adobe Photoshop CS2 diorama (manifest item 5). A frozen workspace — someone
// mid-edit on DIY xerox cover art for the owner's own catalog. NON-FUNCTIONAL:
// tools and menus don't do anything; it's a museum room, not an editor. The
// canvas art is an original SVG recreation (never a lifted bitmap, docs/04).

const MENUS = ['File', 'Edit', 'Image', 'Layer', 'Select', 'Filter', 'View', 'Window', 'Help']
// Toolbox glyphs (single chars stand in for the classic tool bitmaps).
const TOOLS = ['▲', '⬚', '✣', '✎', '✿', '✜', '⬛', '⬤', 'T', '⬓', '✋', '🔍']

interface Art {
  doc: string
  title: string // big stencil text on the flyer
  sub: string
  layers: string[]
}

// Pick the open document's persona from the .psd filename.
function artFor(file: string): Art {
  const f = file.toLowerCase()
  if (/cover|demo|moldmouth/.test(f)) {
    return {
      doc: 'moldmouth_demo_cover.psd',
      title: 'MOLDMOUTH',
      sub: 'demo · 2005 · noise',
      layers: ['MOLDMOUTH (stencil)', 'xerox texture', 'skull halftone', 'tape hiss', 'Background'],
    }
  }
  return {
    doc: 'dickcrush_show_flyer.psd',
    title: 'DICKCRUSH',
    sub: 'fri · the basement · $5 · all ages',
    layers: ['headliner type', 'copier grime', 'photocopy 3x', 'border tape', 'Background'],
  }
}

// Original DIY/xerox flyer art — high-contrast, photocopied, hand-cut.
function FlyerArt({ art }: { art: Art }) {
  return (
    <svg viewBox="0 0 300 380" className={styles.art} role="img" aria-label={`${art.title} flyer artwork`}>
      <rect width="300" height="380" fill="#f4f1e9" />
      {/* photocopy grime speckle */}
      <g fill="#1a1a1a" opacity="0.5">
        {Array.from({ length: 90 }).map((_, i) => (
          <rect
            key={i}
            x={(i * 53) % 300}
            y={(i * 97) % 380}
            width={(i % 3) + 0.5}
            height={(i % 2) + 0.5}
          />
        ))}
      </g>
      {/* torn high-contrast skull blob */}
      <g fill="#111">
        <path d="M150 70 C100 70 78 110 84 150 C88 176 104 188 104 206 L196 206 C196 188 212 176 216 150 C222 110 200 70 150 70 Z" />
        <ellipse cx="124" cy="146" rx="16" ry="20" fill="#f4f1e9" />
        <ellipse cx="176" cy="146" rx="16" ry="20" fill="#f4f1e9" />
        <path d="M150 168 l-10 22 h20 Z" fill="#f4f1e9" />
        <rect x="126" y="206" width="6" height="14" fill="#f4f1e9" />
        <rect x="138" y="206" width="6" height="14" fill="#f4f1e9" />
        <rect x="150" y="206" width="6" height="14" fill="#f4f1e9" />
        <rect x="162" y="206" width="6" height="14" fill="#f4f1e9" />
      </g>
      {/* stencil band name, knocked-out on a slab */}
      <rect x="20" y="244" width="260" height="52" fill="#111" transform="rotate(-1.5 150 270)" />
      <text
        x="150"
        y="282"
        textAnchor="middle"
        fontFamily="Arial Black, Impact, sans-serif"
        fontSize={art.title.length > 8 ? 30 : 38}
        fontWeight="900"
        fill="#f4f1e9"
        transform="rotate(-1.5 150 270)"
      >
        {art.title}
      </text>
      <text
        x="150"
        y="324"
        textAnchor="middle"
        fontFamily="Courier New, monospace"
        fontSize="13"
        letterSpacing="2"
        fill="#111"
      >
        {art.sub}
      </text>
      {/* hand-cut tape corners */}
      <rect x="6" y="6" width="40" height="14" fill="#cabf9b" opacity="0.7" transform="rotate(-18 26 13)" />
      <rect x="256" y="358" width="40" height="14" fill="#cabf9b" opacity="0.7" transform="rotate(-12 276 365)" />
    </svg>
  )
}

export function Photoshop({ args }: AppProps) {
  const path = (args?.path as string) || ''
  const art = useMemo(() => artFor(path ? baseName(path) : ''), [path])

  return (
    <div className={styles.ps}>
      <div className={styles.menubar}>
        {MENUS.map((m) => (
          <span key={m} className={styles.menu}>{m}</span>
        ))}
      </div>
      <div className={styles.optionsbar}>
        <span className={styles.optLabel}>Brush:</span>
        <span className={styles.swatchBox}>●</span>
        <span className={styles.optLabel}>Mode:</span>
        <span className={styles.optVal}>Multiply</span>
        <span className={styles.optLabel}>Opacity:</span>
        <span className={styles.optVal}>100%</span>
        <span className={styles.optLabel}>Flow:</span>
        <span className={styles.optVal}>78%</span>
      </div>

      <div className={styles.body}>
        <div className={styles.toolbox}>
          {TOOLS.map((t, i) => (
            <span key={i} className={`${styles.tool} ${i === 3 ? styles.toolActive : ''}`}>{t}</span>
          ))}
          <div className={styles.swatches}>
            <span className={styles.fg} />
            <span className={styles.bg} />
          </div>
        </div>

        <div className={styles.canvasArea}>
          <div className={styles.docTab}>{art.doc} @ 100% (RGB/8)</div>
          <div className={styles.canvasScroll}>
            <div className={styles.canvas}>
              <FlyerArt art={art} />
            </div>
          </div>
        </div>

        <div className={styles.panels}>
          <div className={styles.panel}>
            <div className={styles.panelTab}>Navigator</div>
            <div className={styles.navThumb}><FlyerArt art={art} /></div>
          </div>
          <div className={styles.panel}>
            <div className={styles.panelTab}>Layers</div>
            <div className={styles.layerOpts}>
              <span>Normal</span>
              <span>Opacity: 100%</span>
            </div>
            <div className={styles.layers}>
              {art.layers.map((l, i) => (
                <div key={l} className={`${styles.layer} ${i === 0 ? styles.layerActive : ''}`}>
                  <span className={styles.eye}>👁</span>
                  <span className={styles.layerThumb} />
                  <span className={styles.layerName}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.statusbar}>
        <span>Doc: 3.20M/8.14M</span>
        <span>100%</span>
        <span className={styles.statHint}>Brush Tool</span>
      </div>
    </div>
  )
}
