import { useState } from 'react'
import { SOURCES, TRACKS, fmtTime, type Track } from './catalog'
import { MusicIcon } from '../../os/icons'
import styles from './Foobar.module.css'

// foobar2000 — the music pillar (docs/03). Columns UI-style dark layout over the
// REAL catalog in data/discography.json.
//
// PLAYBACK IS STUBBED ON PURPOSE. Bandcamp blocks automated fetches, so embed/
// track IDs aren't resolved yet. `load()` is the single seam where real audio
// drops in once the owner supplies Bandcamp embed IDs (see catalog.ts).
// TODO(playback): when track.bandcampTrackId / bandcampAlbumId is set, mount the
// Bandcamp embed iframe here and drive transport from it. No fake audio today.
const SPECTRUM_BARS = [3, 6, 4, 9, 5, 7, 4, 8, 6, 10, 5, 7, 4, 6, 3, 8, 5, 9, 4, 6, 3, 7, 5, 4]

export function Foobar() {
  const [current, setCurrent] = useState<Track | null>(null)
  const [status, setStatus] = useState('')

  // SEAM: real playback would start here when ids are present.
  function load(track: Track) {
    setCurrent(track)
    setStatus('') // a freshly selected track is loaded but not playing
  }
  function play() {
    if (!current) {
      setStatus('No track selected.')
      return
    }
    if (!current.bandcampTrackId && !current.bandcampAlbumId) {
      setStatus('Playback pending: Bandcamp embed ID not set for this release.')
      return
    }
    // TODO(playback): start the Bandcamp embed for current.
  }

  return (
    <div className={styles.fb}>
      <div className={styles.menubar}>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Playback</span>
        <span>Library</span>
        <span>Help</span>
      </div>

      <div className={styles.transport}>
        <button type="button" className={styles.tbtn} aria-label="Previous">⏮</button>
        <button type="button" className={styles.tbtn} aria-label="Play" onClick={play}>▶</button>
        <button type="button" className={styles.tbtn} aria-label="Pause" onClick={() => setStatus('')}>⏸</button>
        <button type="button" className={styles.tbtn} aria-label="Stop" onClick={() => { setCurrent(null); setStatus('') }}>⏹</button>
        <button type="button" className={styles.tbtn} aria-label="Next">⏭</button>
        <div className={styles.seek}><div className={styles.seekfill} /></div>
        <div className={styles.time}>{fmtTime(current?.durationSec ?? undefined)} / {fmtTime(current?.durationSec)}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.side}>
          <div className={styles.sideHead}>Library</div>
          {SOURCES.map((s) => (
            <div key={s.id} className={styles.source} title={s.url}>
              <MusicIcon size={16} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>

        <div className={styles.center}>
          <div className={styles.playlist} role="list">
            <div className={`${styles.row} ${styles.rowHead}`}>
              <div className={styles.colNum}>#</div>
              <div className={styles.col}>Artist</div>
              <div className={styles.col}>Title</div>
              <div className={styles.colDur}>Length</div>
            </div>
            {TRACKS.map((t, i) => (
              <div
                key={t.id}
                role="listitem"
                className={`${styles.row} ${current?.id === t.id ? styles.rowActive : ''}`}
                onClick={() => load(t)}
                onDoubleClick={() => { load(t); play() }}
              >
                <div className={styles.colNum}>{i + 1}</div>
                <div className={styles.col}>{t.artist}</div>
                <div className={styles.col}>{t.title}</div>
                <div className={styles.colDur}>{fmtTime(t.durationSec)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.artPanel}>
          <div className={styles.art}>
            {current?.art ? <img src={current.art} alt="" width="100%" /> : <MusicIcon size={64} />}
          </div>
          <div className={styles.np}>
            <div className={styles.npArtist}>{current?.artist ?? 'Nothing playing'}</div>
            <div className={styles.npTitle}>{current ? current.title : 'select a track'}</div>
          </div>
          <div className={styles.spectrum} aria-hidden="true">
            {SPECTRUM_BARS.map((h, i) => (
              <i key={i} style={{ height: `${h * 3}px` }} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.statusbar}>
        <span>{TRACKS.length} items · {SOURCES.length} sources</span>
        <span>{status || 'Bandcamp playback pending (embed IDs)'}</span>
      </div>
    </div>
  )
}
