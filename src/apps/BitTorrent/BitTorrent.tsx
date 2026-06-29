import styles from './BitTorrent.module.css'

// BitTorrent diorama (docs/03, docs/07 Stratum A). Period prop only — fictional
// release names + invented [FakeSubGroup] tags, frozen mid-download. No real
// trackers, downloads, or titles. The era's codec-hell + "ratio: 0.04" guilt as
// a museum piece. (Azureus / BitTornado are also "installed" under Program Files.)
interface Row {
  name: string
  size: string
  done: number
  status: 'Downloading' | 'Seeding' | 'Stalled'
  seeds: string
  peers: string
  ratio: string
}

const TORRENTS: Row[] = [
  { name: '[StaticVoid]_Spectral_Corridor_01_[h264].mkv', size: '348 MB', done: 41, status: 'Downloading', seeds: '2 (5)', peers: '1 (12)', ratio: '0.04' },
  { name: 'Midnight_Cassette_(1987).DVDRip.XViD-PHANTOM.CD1.avi', size: '700 MB', done: 100, status: 'Seeding', seeds: '0 (1)', peers: '3', ratio: '0.31' },
  { name: 'Midnight_Cassette_(1987).DVDRip.XViD-PHANTOM.CD2.avi', size: '700 MB', done: 96, status: 'Downloading', seeds: '1 (2)', peers: '0 (4)', ratio: '0.00' },
  { name: 'Dead_Snakes-live_at_the_basement_(2004)_[FLAC].zip', size: '412 MB', done: 100, status: 'Seeding', seeds: '1 (3)', peers: '0', ratio: '1.20' },
  { name: 'basement_noise_comp_vol3_[V0].rar', size: '188 MB', done: 73, status: 'Downloading', seeds: '3 (7)', peers: '2 (9)', ratio: '0.18' },
  { name: '[KARAOKE-FANSUB]_background_show_ep04_[480p].mkv', size: '233 MB', done: 12, status: 'Stalled', seeds: '0 (0)', peers: '0 (2)', ratio: '0.00' },
]

export function BitTorrent() {
  return (
    <div className={styles.bt}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.tbtn}>Add Torrent</button>
        <button type="button" className={styles.tbtn}>Remove</button>
        <button type="button" className={styles.tbtn}>Start</button>
        <button type="button" className={styles.tbtn}>Pause</button>
      </div>
      <div className={styles.body}>
        <div className={styles.side}>
          <div className={`${styles.cat} ${styles.catActive}`}>All ({TORRENTS.length})</div>
          <div className={styles.cat}>Downloading</div>
          <div className={styles.cat}>Seeding</div>
          <div className={styles.cat}>Completed</div>
        </div>
        <div className={styles.list}>
          <div className={`${styles.row} ${styles.head}`}>
            <div className={styles.col}>Name</div>
            <div className={styles.col}>Size</div>
            <div className={styles.col}>Done</div>
            <div className={styles.col}>Status</div>
            <div className={styles.num}>Seeds</div>
            <div className={styles.num}>Peers</div>
            <div className={styles.num}>Ratio</div>
          </div>
          {TORRENTS.map((t) => (
            <div key={t.name} className={styles.row}>
              <div className={styles.col} title={t.name}>{t.name}</div>
              <div className={styles.col}>{t.size}</div>
              <div className={styles.bar}>
                <div
                  className={`${styles.barfill} ${t.status === 'Seeding' ? styles.seed : ''}`}
                  style={{ width: `${t.done}%` }}
                />
                <div className={styles.bartext}>{t.done}%</div>
              </div>
              <div className={styles.col}>{t.status}</div>
              <div className={styles.num}>{t.seeds}</div>
              <div className={styles.num}>{t.peers}</div>
              <div className={`${styles.num} ${parseFloat(t.ratio) < 0.5 ? styles.ratioBad : ''}`}>{t.ratio}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.statusbar}>
        <span>DL 65.6 kB/s · UL 6.9 kB/s</span>
        <span>µTorrent</span>
      </div>
    </div>
  )
}
