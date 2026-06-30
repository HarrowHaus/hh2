import { useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useOS } from '../../os/store'
import {
  MonitorIcon,
  ComputerIcon,
  GlobeIcon,
  FolderIcon,
  NoteIcon,
  MusicIcon,
  TerminalIcon,
  AimIcon,
  MircIcon,
  IeIcon,
} from '../../os/icons'
import { APPS } from '../../os/apps'
import { PROGRAMS } from '../../os/programs'
import type { AppArgs, AppId } from '../../os/types'
import styles from './StartMenu.module.css'

const OWNER = '/Local Disk (C:)/Documents and Settings/owner'
const MYDOCS = `${OWNER}/My Documents`

// Two-panel XP Start menu. Apps we ship (Display Properties, My Computer) open;
// the rest are present for authenticity and simply close the menu until their
// phase lands. No meta-narrative copy (Rule 2).
export function StartMenu() {
  const account = useOS((s) => s.account)
  const openApp = useOS((s) => s.openApp)
  const closeStartMenu = useOS((s) => s.closeStartMenu)
  const logOff = useOS((s) => s.logOff)
  const setBooted = useOS((s) => s.setBooted)
  const [showAll, setShowAll] = useState(false)

  const stop = (e: ReactPointerEvent) => e.stopPropagation()
  const turnOff = () => {
    logOff()
    setBooted(false)
  }
  // Launch from the All Programs flyout, then dismiss the whole menu.
  const launch = (appId: AppId, args?: AppArgs) => {
    openApp(appId, args)
    closeStartMenu()
  }

  return (
    <div className={styles.menu} onPointerDown={stop} role="menu" aria-label="Start menu">
      <div className={styles.header}>
        <span className={styles.avatar} aria-hidden="true" />
        <span className={styles.username}>{account || 'owner'}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.left} onMouseLeave={() => setShowAll(false)}>
          <button type="button" className={styles.item} onClick={() => openApp('ie')}>
            <IeIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>Internet</span>
              <span className={styles.subtext}>Internet Explorer</span>
            </span>
          </button>
          <div className={styles.sep} />
          <button
            type="button"
            className={styles.item}
            onClick={() => openApp('explorer', { path: '/', title: 'My Computer' })}
          >
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
          <button type="button" className={styles.item} onClick={() => openApp('notepad')}>
            <NoteIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>Notepad</span>
            </span>
          </button>
          <button type="button" className={styles.item} onClick={() => openApp('foobar')}>
            <MusicIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>foobar2000</span>
            </span>
          </button>
          <button type="button" className={styles.item} onClick={() => openApp('terminal')}>
            <TerminalIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>Command Prompt</span>
            </span>
          </button>
          <button type="button" className={styles.item} onClick={() => openApp('aim')}>
            <AimIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>AOL Instant Messenger</span>
            </span>
          </button>
          <button type="button" className={styles.item} onClick={() => openApp('mirc')}>
            <MircIcon size={30} className={styles.itemIcon} />
            <span className={styles.texts}>
              <span className={styles.text}>mIRC</span>
            </span>
          </button>
          <div className={styles.spacer} />
          <div className={styles.sep} />
          <button
            type="button"
            className={`${styles.item} ${styles.allprograms} ${showAll ? styles.allopen : ''}`}
            onClick={() => setShowAll((v) => !v)}
            onMouseEnter={() => setShowAll(true)}
          >
            <span className={styles.texts}>
              <span className={styles.text}>All Programs</span>
            </span>
            <span className={styles.arrow} />
          </button>

          {showAll && (
            <div className={styles.flyout} role="menu" aria-label="All Programs">
              {PROGRAMS.map((group) => (
                <div key={group.name} className={styles.flyGroup}>
                  <div className={styles.flyHeader}>{group.name}</div>
                  {group.items.map((it) => {
                    const Icon = APPS[it.appId].Icon
                    return (
                      <button
                        key={it.appId + it.label}
                        type="button"
                        className={styles.flyItem}
                        onClick={() => launch(it.appId, it.args)}
                      >
                        <Icon size={18} className={styles.itemIcon} />
                        <span className={styles.flyLabel}>{it.label}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.right}>
          <button
            type="button"
            className={styles.item}
            onClick={() => openApp('explorer', { path: MYDOCS, title: 'My Documents' })}
          >
            <FolderIcon size={22} className={styles.itemIcon} />
            <span className={styles.texts}><span className={styles.text}>My Documents</span></span>
          </button>
          <button
            type="button"
            className={styles.item}
            onClick={() => openApp('explorer', { path: `${MYDOCS}/My Pictures`, title: 'My Pictures' })}
          >
            <FolderIcon size={22} className={styles.itemIcon} />
            <span className={styles.texts}><span className={styles.text}>My Pictures</span></span>
          </button>
          <button
            type="button"
            className={styles.item}
            onClick={() => openApp('explorer', { path: `${MYDOCS}/My Music`, title: 'My Music' })}
          >
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
