import { useEffect } from 'react'
import { useOS } from '../../os/store'
import { baseName } from '../../os/fs/path'
import type { AppProps } from '../../os/types'
import styles from './MsgBox.module.css'

// In-voice-but-functional message boxes (docs/03 leak-and-hide). Used for the
// locked \weird\ denial and the normal_person.exe gag. Diegetic system copy —
// never narrates the concept (Rule 2). The persona is derived from the file the
// caller opened, so it stays a real OS dialog, not a fourth-wall aside.

type Icon = 'error' | 'warn' | 'info'
interface Persona {
  title: string
  icon: Icon
  lines: string[]
}

function personaFor(path: string, kind?: string): Persona {
  const file = baseName(path)
  if (kind === 'locked') {
    return {
      title: file,
      icon: 'warn',
      lines: ['Access is denied.', '', 'You do not have permission to access this folder. The owner has restricted it.'],
    }
  }
  if (/normal_person/i.test(file)) {
    return {
      title: `${file} - Application Error`,
      icon: 'error',
      lines: ['The application failed to initialize properly (0xC0000DEAD).', '', 'Click OK to terminate the application.'],
    }
  }
  return { title: file || 'Message', icon: 'info', lines: ['This item is not available.'] }
}

function Glyph({ icon }: { icon: Icon }) {
  if (icon === 'error')
    return (
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#d23030" />
        <path d="M10 10 L22 22 M22 10 L10 22" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    )
  if (icon === 'warn')
    return (
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <path d="M16 3 L30 28 H2 Z" fill="#f2c12e" stroke="#9a7a12" />
        <rect x="14.5" y="12" width="3" height="9" fill="#1a1a1a" />
        <rect x="14.5" y="23" width="3" height="3" fill="#1a1a1a" />
      </svg>
    )
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#2a6fd6" />
      <rect x="14.5" y="13" width="3" height="11" fill="#fff" />
      <rect x="14.5" y="8" width="3" height="3" fill="#fff" />
    </svg>
  )
}

export function MsgBox({ winId, args }: AppProps) {
  const path = (args?.path as string) || ''
  const kind = args?.kind as string | undefined
  const closeWindow = useOS((s) => s.closeWindow)
  const setWindowTitle = useOS((s) => s.setWindowTitle)
  const persona = personaFor(path, kind)

  useEffect(() => { setWindowTitle(winId, persona.title) }, [winId, persona.title, setWindowTitle])

  return (
    <div className={styles.box}>
      <div className={styles.body}>
        <div className={styles.glyph}><Glyph icon={persona.icon} /></div>
        <div className={styles.text}>
          {persona.lines.map((l, i) => (
            <p key={i} className={l ? '' : styles.gap}>{l || ' '}</p>
          ))}
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.ok} autoFocus onClick={() => closeWindow(winId)}>
          OK
        </button>
      </div>
    </div>
  )
}
