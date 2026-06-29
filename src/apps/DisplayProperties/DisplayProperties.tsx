import { useRef, type ChangeEvent } from 'react'
import { useOS } from '../../os/store'
import { VISUAL_STYLES, type VisualStyle } from '../../os/themes'
import type { AppProps } from '../../os/types'
import styles from './DisplayProperties.module.css'

const TABS = ['Themes', 'Desktop', 'Screen Saver', 'Appearance', 'Settings']

// The real visual-style switcher (docs/02). Selecting "Windows and buttons"
// applies live (whole OS reskins) and persists via the store.
export function DisplayProperties({ winId }: AppProps) {
  const visualStyle = useOS((s) => s.visualStyle)
  const setVisualStyle = useOS((s) => s.setVisualStyle)
  const closeWindow = useOS((s) => s.closeWindow)

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

  return (
    <div className={styles.sheet}>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <div key={t} className={`${styles.tab} ${t === 'Appearance' ? styles.active : ''}`}>
            {t}
          </div>
        ))}
      </div>

      <div className={styles.panel}>
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
            {Object.values(VISUAL_STYLES).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
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
