import type { PointerEvent as ReactPointerEvent } from 'react'
import { useOS } from '../../os/store'
import {
  MonitorIcon,
  ComputerIcon,
  GlobeIcon,
  FolderIcon,
  NoteIcon,
  MusicIcon,
} from '../../os/icons'
import styles from './StartMenu.module.css'

// Two-panel XP Start menu. Apps we ship (Display Properties, My Computer) open;
// the rest are present for authenticity and simply close the menu until their
// phase lands. No meta-narrative copy (Rule 2).
export function StartMenu() {
  const account = useOS((s) => s.account)
  const openApp = useOS((s) => s.openApp)
  const closeStartMenu = useOS((s) => s.closeStartMenu)
  const logOff = useOS((s) => s.logOff)
  const setBooted = useOS((s) => s.setBooted)

  const stop = (e: ReactPointerEvent) => e.stopPropagation()
  const turnOff = () => {
    logOff()
    setBooted(false)
  }

  return (
    <div className={styles.menu} onPointerDown={stop} role="menu" aria-label="Start menu">
      <div className={styles.header}>
        <span className={styles.avatar} aria-hidden="true" />
        <span className={styles.username}>{account || 'owner'}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.left}>
          <button type="button" className={styles.item} onClick={closeStartMenu}>
            <GlobeIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>Internet</span>
              <span className={styles.subtext}>Internet Explorer</span>
            </span>
          </button>
          <div className={styles.sep} />
          <button type="button" className={styles.item} onClick={() => openApp('computer')}>
            <ComputerIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>My Computer</span>
            </span>
          </button>
          <button type="button" className={styles.item} onClick={() => openApp('display')}>
            <MonitorIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>Display Properties</span>
            </span>
          </button>
          <button type="button" className={styles.item} onClick={closeStartMenu}>
            <NoteIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>Notepad</span>
            </span>
          </button>
          <button type="button" className={styles.item} onClick={closeStartMenu}>
            <MusicIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>foobar2000</span>
            </span>
          </button>
          <div className={styles.spacer} />
          <div className={styles.sep} />
          <button type="button" className={`${styles.item} ${styles.allprograms}`} onClick={closeStartMenu}>
            <span className={styles.texts}>
              <span className={styles.text}>All Programs</span>
            </span>
            <span className={styles.arrow} />
          </button>
        </div>

        <div className={styles.right}>
          <button type="button" className={styles.item} onClick={closeStartMenu}>
            <FolderIcon size={22} className={styles.itemIcon} />
            <span className={styles.texts}><span className={styles.text}>My Documents</span></span>
          </button>
          <button type="button" className={styles.item} onClick={closeStartMenu}>
            <FolderIcon size={22} className={styles.itemIcon} />
            <span className={styles.texts}><span className={styles.text}>My Pictures</span></span>
          </button>
          <button type="button" className={styles.item} onClick={closeStartMenu}>
            <MusicIcon size={22} className={styles.itemIcon} />
            <span className={styles.texts}><span className={styles.text}>My Music</span></span>
          </button>
          <div className={styles.sep} />
          <button type="button" className={styles.item} onClick={() => openApp('display')}>
            <MonitorIcon size={22} className={styles.itemIcon} />
            <span className={styles.texts}><span className={styles.text}>Control Panel</span></span>
          </button>
          <div className={styles.sep} />
          <button type="button" className={styles.item} onClick={closeStartMenu}>
            <GlobeIcon size={22} className={styles.itemIcon} />
            <span className={styles.texts}><span className={styles.text}>Help and Support</span></span>
          </button>
          <button type="button" className={styles.item} onClick={closeStartMenu}>
            <NoteIcon size={22} className={styles.itemIcon} />
            <span className={styles.texts}><span className={styles.text}>Run...</span></span>
          </button>
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.power} onClick={logOff}>
          <span className={styles.powerGlyph} aria-hidden="true">⇤</span>
          Log Off
        </button>
        <button type="button" className={styles.power} onClick={turnOff}>
          <span className={styles.powerGlyph} aria-hidden="true">⏻</span>
          Turn Off Computer
        </button>
      </div>
    </div>
  )
}
