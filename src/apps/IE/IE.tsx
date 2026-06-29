import styles from './IE.module.css'

// Internet Explorer — STATIC prop. The owner's old personal homepage with an
// Underground Noise webring + a guestbook (docs/03: bots keep it alive). No live
// web; realtime/working guestbook is Phase 6. All entries fictional, in-voice.

interface Entry {
  name: string
  date: string
  msg: string
}
const GUESTBOOK: Entry[] = [
  { name: 'grimwax', date: '08.14.2005', msg: 'tape arrived. dubbed it twice already. owe you a split.' },
  { name: 'DialUpDoom', date: '07.30.2005', msg: 'webring brought me here. adding you to mine. stay ugly.' },
  { name: '~*KELLY*~', date: '07.22.2005', msg: 'your away message made me cry at 2am thanks a lot' },
  { name: 'no_master', date: '06.03.2005', msg: 'first.' },
]

export function IE() {
  return (
    <div className={styles.ie}>
      <div className={styles.menubar}>
        <span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span>
      </div>
      <div className={styles.toolbar}>
        <span className={styles.tbtn}>◄ Back</span>
        <span className={styles.tbtn}>Forward ►</span>
        <span className={styles.tbtn}>✕ Stop</span>
        <span className={styles.tbtn}>↻ Refresh</span>
        <span className={styles.tbtn}>⌂ Home</span>
      </div>
      <div className={styles.address}>
        <span>Address</span>
        <div className={styles.addressbox}>http://www.geocities.com/sunsetstrip/basement/4127/</div>
        <span className={styles.go}>Go</span>
      </div>

      <div className={styles.page}>
        <div className={styles.banner}>
          <span className={styles.bannerText}>★ moldmouth's corner of the web ★</span>
        </div>
        <div className={styles.underConstruction}>
          🚧 always under construction 🚧
        </div>

        <p className={styles.intro}>
          noise tapes, horror VHS, and whatever i'm ripping this week. mail me on AIM
          (it's in the buddy info). don't email my mom's account again.
        </p>

        <div className={styles.webring}>
          <div className={styles.webringHead}>:: The Underground Noise Webring ::</div>
          <div className={styles.webringNav}>
            <span className={styles.ringlink}>&lt;&lt; prev</span>
            <span className={styles.ringlink}>[ random ]</span>
            <span className={styles.ringlink}>[ list ]</span>
            <span className={styles.ringlink}>next &gt;&gt;</span>
          </div>
          <div className={styles.webringFoot}>site 14 of 39 · est. 2003</div>
        </div>

        <div className={styles.gbHead}>~ sign my guestbook ~</div>
        <div className={styles.gbForm}>
          <label>handle: <span className={styles.field} /></label>
          <label className={styles.msgLabel}>
            message:
            <span className={`${styles.field} ${styles.fieldBig}`} />
          </label>
          <span className={styles.signBtn}>Sign It</span>
        </div>

        <div className={styles.gbList}>
          {GUESTBOOK.map((e, i) => (
            <div key={i} className={styles.gbEntry}>
              <div className={styles.gbMeta}>
                <b>{e.name}</b> <span className={styles.gbDate}>— {e.date}</span>
              </div>
              <div className={styles.gbMsg}>{e.msg}</div>
            </div>
          ))}
        </div>

        <div className={styles.counter}>
          You are visitor <span className={styles.odometer}>0&nbsp;4&nbsp;1&nbsp;2&nbsp;7</span>
        </div>
      </div>
    </div>
  )
}
