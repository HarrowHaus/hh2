import { useRef, useState, type ChangeEvent } from 'react'
import { useOS } from '../../os/store'
import { PACK_LIST, type VisualStyle } from '../../os/themes'
import { SAVERS, WALLPAPERS, SaverCanvas } from '../../components/ScreenSaver/ScreenSaver'
import { WallpaperView, type WallFit } from '../../components/Desktop/Slideshow'
import { hasWebGPU, generateImage, type SDProgress } from '../../os/websd'

const FIT_MODES: { id: WallFit; label: string }[] = [
  { id: 'fill', label: 'Fill' }, { id: 'fit', label: 'Fit' }, { id: 'stretch', label: 'Stretch' },
  { id: 'tile', label: 'Tile' }, { id: 'center', label: 'Center' },
]
import type { AppProps } from '../../os/types'
import styles from './DisplayProperties.module.css'

const TABS = ['Themes', 'Desktop', 'Screen Saver', 'Appearance', 'Settings'] as const

// The real visual-style switcher (docs/02) plus a working Screen Saver tab and
// the CRT/oneko effect toggles (docs/08 Tier 1). Selections apply live + persist.
export function DisplayProperties({ winId }: AppProps) {
  const visualStyle = useOS((s) => s.visualStyle)
  const setVisualStyle = useOS((s) => s.setVisualStyle)
  const screensaver = useOS((s) => s.screensaver)
  const setScreensaver = useOS((s) => s.setScreensaver)
  const wallpaper = useOS((s) => s.wallpaper)
  const setWallpaper = useOS((s) => s.setWallpaper)
  const wallpaperImage = useOS((s) => s.wallpaperImage)
  const setWallpaperImage = useOS((s) => s.setWallpaperImage)
  const wallpaperFit = useOS((s) => s.wallpaperFit)
  const setWallpaperFit = useOS((s) => s.setWallpaperFit)
  const crt = useOS((s) => s.crt)
  const setCrt = useOS((s) => s.setCrt)
  const neko = useOS((s) => s.neko)
  const setNeko = useOS((s) => s.setNeko)
  const closeWindow = useOS((s) => s.closeWindow)

  const [tab, setTab] = useState<(typeof TABS)[number]>('Appearance')
  // AI Generated Wallpaper (WebSD, docs/10 §4 / docs/12 §1.1) — WebGPU-gated, opt-in.
  const [aiPrompt, setAiPrompt] = useState('a dark scene-kid desktop wallpaper, abstract, moody')
  const [aiProg, setAiProg] = useState<SDProgress | null>(null)
  const [aiErr, setAiErr] = useState('')
  async function genWallpaper() {
    setAiErr('')
    setAiProg({ text: 'Preparing image model…', progress: 0 })
    try {
      const url = await generateImage(aiPrompt, { onProgress: setAiProg })
      setWallpaperImage(url)
      setWallpaper('image')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setAiErr(`Could not generate: ${msg}`)
    } finally {
      setAiProg(null)
    }
  }

  // Remember the style when the sheet opened (or last Apply) so Cancel reverts.
  const baseline = useRef<VisualStyle>(visualStyle)

  const onSelect = (e: ChangeEvent<HTMLSelectElement>) =>
    setVisualStyle(e.target.value as VisualStyle)
  const ok = () => closeWindow(winId)
  const cancel = () => {
    setVisualStyle(baseline.current)
    closeWindow(winId)
  }
  const apply = () => {
    baseline.current = visualStyle
  }

  const showSaver = tab === 'Screen Saver'
  const showDesktop = tab === 'Desktop'

  return (
    <div className={styles.sheet}>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <div
            key={t}
            className={`${styles.tab} ${t === tab ? styles.active : ''}`}
            onClick={() => setTab(t)}
            role="button"
          >
            {t}
          </div>
        ))}
      </div>

      <div className={styles.panel}>
        {showSaver ? (
          <>
            <div className={styles.saverPreview} aria-label="Screen saver preview">
              <SaverCanvas id={screensaver} className={styles.saverCanvas} />
            </div>
            <div className={styles.field}>
              <label htmlFor="saver">Screen saver:</label>
              <select
                id="saver"
                className={styles.select}
                value={screensaver}
                onChange={(e) => setScreensaver(e.target.value)}
              >
                {SAVERS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.effects}>
              <div className={styles.effectsHead}>Effects</div>
              <label className={styles.check}>
                <input type="checkbox" checked={crt} onChange={(e) => setCrt(e.target.checked)} />
                CRT / VHS overlay (scanlines)
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={neko} onChange={(e) => setNeko(e.target.checked)} />
                Desktop pet
              </label>
            </div>
          </>
        ) : showDesktop ? (
          <>
            <div className={styles.saverPreview} aria-label="Wallpaper preview">
              <WallpaperView id={wallpaper} image={wallpaperImage} fit={wallpaperFit as WallFit} />
            </div>
            <div className={styles.field}>
              <label htmlFor="wallpaper">Background:</label>
              <select
                id="wallpaper"
                className={styles.select}
                value={wallpaper}
                onChange={(e) => setWallpaper(e.target.value)}
              >
                {WALLPAPERS.map((w) => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>
            {wallpaper === 'image' && (
              <div className={styles.field}>
                <label htmlFor="wpurl">Image URL:</label>
                <input
                  id="wpurl"
                  className={styles.select}
                  value={wallpaperImage}
                  placeholder="https://…/photo.jpg"
                  spellCheck={false}
                  onChange={(e) => setWallpaperImage(e.target.value.trim())}
                />
              </div>
            )}
            {(wallpaper === 'image' || wallpaper.startsWith('slideshow')) && (
              <div className={styles.field}>
                <label htmlFor="wpfit">Position:</label>
                <select id="wpfit" className={styles.select} value={wallpaperFit} onChange={(e) => setWallpaperFit(e.target.value)}>
                  {FIT_MODES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
            )}
            {hasWebGPU() && (
              <div className={styles.effects}>
                <div className={styles.effectsHead}>AI Generated Wallpaper (WebGPU · on-device · $0)</div>
                <input
                  className={styles.select}
                  value={aiPrompt}
                  spellCheck={false}
                  placeholder="Describe a wallpaper…"
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <button type="button" className={styles.button} disabled={!!aiProg} onClick={() => void genWallpaper()} style={{ marginTop: 6 }}>
                  {aiProg ? 'Generating…' : 'Generate'}
                </button>
                {aiProg && <p className={styles.hint}>{aiProg.text} {Math.round(aiProg.progress * 100)}%</p>}
                {aiErr && <p className={styles.hint}>{aiErr}</p>}
                {!aiProg && !aiErr && <p className={styles.hint}>First use downloads the model (~1–2&nbsp;GB), then generates locally. Result is applied as your wallpaper.</p>}
              </div>
            )}
            <p className={styles.hint}>Animated backgrounds respect reduced-motion. Slideshows fetch from public sources (Picsum / NASA APOD / Art Institute). Choose “(Theme default)” for the skin’s wallpaper.</p>
          </>
        ) : (
          <>
            <div className={styles.preview} aria-label="Preview">
              <div className={styles.miniwin}>
                <div className={styles.minibar}>Active Window</div>
                <div className={styles.minibody}>
                  Window Text<span className={styles.minibtn}>OK</span>
                </div>
              </div>
              <div className={`${styles.miniwin} ${styles.second}`}>
                <div className={styles.minibar}>Inactive Window</div>
                <div className={styles.minibody}>Window Text</div>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="winandbuttons">Windows and buttons:</label>
              <select id="winandbuttons" className={styles.select} value={visualStyle} onChange={onSelect}>
                {PACK_LIST.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={ok}>
          OK
        </button>
        <button type="button" className={styles.button} onClick={cancel}>
          Cancel
        </button>
        <button type="button" className={styles.button} onClick={apply}>
          Apply
        </button>
      </div>
    </div>
  )
}
