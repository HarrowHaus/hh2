import { useState } from 'react'
import styles from './AIM.module.css'

// AOL Instant Messenger — STATIC prop (docs/07: AIM is the mainstay). Buddy
// list, away message, and profile, frozen. No real messaging; realtime is
// Phase 6. Screen names + quotes are fictional, in-voice.

interface Buddy {
  sn: string
  online: boolean
  idle?: string
  away?: boolean
}
interface Group {
  name: string
  buddies: Buddy[]
}

const GROUPS: Group[] = [
  {
    name: 'Buddies',
    buddies: [
      { sn: 'xClawHammerx', online: true },
      { sn: 'basementshow06', online: true, away: true },
      { sn: 'tapehiss_kelly', online: true, idle: '(idle 42m)' },
      { sn: 'DialUpDoom', online: false },
      { sn: 'sergeantfeedback', online: false },
    ],
  },
  {
    name: 'Bands',
    buddies: [
      { sn: 'DeadSnakesOfficial', online: true },
      { sn: 'hung_eyes_split', online: false },
      { sn: 'couchnapdistro', online: false },
    ],
  },
  {
    name: 'Family',
    buddies: [{ sn: 'aunt_carol_pc', online: false }],
  },
]

const AWAY = 'the sun is gone but i have a light  -[bzzt]-  brb burning a CD'

export function AIM() {
  const [open, setOpen] = useState<Record<string, boolean>>({ Buddies: true, Bands: true, Family: false })
  const onCount = GROUPS.reduce((n, g) => n + g.buddies.filter((b) => b.online).length, 0)
  const total = GROUPS.reduce((n, g) => n + g.buddies.length, 0)

  return (
    <div className={styles.aim}>
      <div className={styles.header}>
        <span className={styles.runner} aria-hidden="true" />
        <div className={styles.me}>
          <div className={styles.sn}>moldmouth</div>
          <div className={styles.away}>Away — {AWAY}</div>
        </div>
      </div>

      <div className={styles.tabs}>
        <span className={`${styles.tab} ${styles.tabOn}`}>Online</span>
        <span className={styles.tab}>List Setup</span>
      </div>

      <div className={styles.list}>
        {GROUPS.map((g) => {
          const on = g.buddies.filter((b) => b.online).length
          const isOpen = open[g.name]
          return (
            <div key={g.name}>
              <button
                type="button"
                className={styles.group}
                onClick={() => setOpen((o) => ({ ...o, [g.name]: !o[g.name] }))}
              >
                <span className={styles.tri}>{isOpen ? '▼' : '►'}</span>
                {g.name} ({on}/{g.buddies.length})
              </button>
              {isOpen &&
                g.buddies.map((b) => (
                  <div key={b.sn} className={`${styles.buddy} ${b.online ? '' : styles.offline}`}>
                    <span className={`${styles.dot} ${b.online ? styles.dotOn : ''}`} />
                    <span className={styles.bsn}>{b.sn}</span>
                    {b.away && <span className={styles.tag}>(away)</span>}
                    {b.idle && <span className={styles.tag}>{b.idle}</span>}
                  </div>
                ))}
            </div>
          )
        })}
      </div>

      <div className={styles.footer}>
        <span className={styles.count}>{onCount} of {total} online</span>
        <div className={styles.btns}>
          <span className={styles.fbtn} title="IM">IM</span>
          <span className={styles.fbtn} title="Chat">Chat</span>
          <span className={`${styles.fbtn} ${styles.awayBtn}`} title="Away">Away</span>
          <span className={styles.fbtn} title="Setup">Setup</span>
        </div>
      </div>
    </div>
  )
}
