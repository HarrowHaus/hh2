import { useRef, useState, type ChangeEvent } from 'react'
import { useOS } from '../../os/store'
import { PACK_LIST, type VisualStyle } from '../../os/themes'
import { SAVERS, SaverCanvas } from '../../components/ScreenSaver/ScreenSaver'
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
  const crt = useOS((s) => s.crt)
  const setCrt = useOS((s) => s.setCrt)
  const neko = useOS((s) => s.neko)
  const setNeko = useOS((s) => s.setNeko)
  const closeWindow = useOS((s) => s.closeWindow)

  const [tab, setTab] = useState<(typeof TABS)[number]>('Appearance')

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
