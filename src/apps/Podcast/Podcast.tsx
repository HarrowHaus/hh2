import { useEffect, useMemo, useRef, useState } from 'react'
import { loadSubscriptions, loadShow, type Show, type Episode, type FeedResult } from './feeds'
import { usePodcast } from './store'
import { MusicIcon, GlobeIcon } from '../../os/icons'
import styles from './Podcast.module.css'

// Podcast app (docs/11 §3) — a lean RSS podcatcher dressed as an early-2000s
// iPodder/Juice client on bug.msstyles. Subscriptions are Bug's seeded OPML
// (all shows subscribed on open); selecting a show fetches + lists episodes;
// playback runs on a foobar-style transport with resume + mark-played. Feeds
// that block CORS route through the read-only proxy seam (feeds.ts). No backend.

const fmt = (sec?: number | null) => {
  if (sec == null || !Number.isFinite(sec)) return '--:--'
  const s = Math.floor(sec % 60)
  const m = Math.floor((sec / 60) % 60)
  const h = Math.floor(sec / 3600)
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`
}
const fmtDate = (ms?: number) => {
  if (!ms) return ''
  try { return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return '' }
}

export function Podcast() {
  const shows = useMemo(() => loadSubscriptions(), [])
  const [selected, setSelected] = useState<Show | null>(null)
  const [feed, setFeed] = useState<FeedResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cache = useRef<Map<string, FeedResult>>(new Map())

  const played = usePodcast((s) => s.played)
  const resume = usePodcast((s) => s.resume)
  const markPlayed = usePodcast((s) => s.markPlayed)
  const setResume = usePodcast((s) => s.setResume)
  const clearResume = usePodcast((s) => s.clearResume)

  const [current, setCurrent] = useState<{ show: Show; ep: Episode } | null>(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [dur, setDur] = useState(0)
  const [vol, setVol] = useState(0.9)
  const [status, setStatus] = useState('')
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set())

  const audioRef = useRef<HTMLAudioElement>(null)
  const seekRef = useRef<HTMLDivElement>(null)
  const lastSave = useRef(0)

  // Responsive: one pane at a time on a phone (Shows / Episodes).
  const rootRef = useRef<HTMLDivElement>(null)
  const [narrow, setNarrow] = useState(false)
  const [mview, setMview] = useState<'shows' | 'episodes'>('shows')
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((es) => { for (const e of es) setNarrow(e.contentRect.width < 560) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const total = dur || current?.ep.durationSec || 0
  const progress = total > 0 ? Math.min(1, elapsed / total) : 0

  async function openShow(show: Show, refresh = false) {
    setSelected(show)
    if (narrow) setMview('episodes')
    setError('')
    const cached = cache.current.get(show.feedUrl)
    if (cached && !refresh) { setFeed(cached); return }
    setFeed(null)
    setLoading(true)
    try {
      const r = await loadShow(show.feedUrl)
      cache.current.set(show.feedUrl, r)
      setFeed(r)
      if (!r.episodes.length) setError('No episodes found in this feed.')
    } catch {
      setError('This feed is unavailable (host blocked the request).')
    } finally {
      setLoading(false)
    }
  }

  function playEpisode(show: Show, ep: Episode) {
    setCurrent({ show, ep })
    setElapsed(0)
    setDur(0)
    setStatus('')
    const el = audioRef.current!
    el.src = ep.enclosure
    el.load()
    el.play().then(() => setStatus('')).catch(() => setStatus('Could not start playback.'))
  }

  function togglePlay() {
    const el = audioRef.current
    if (!el || !current) { setStatus('Select an episode.'); return }
    playing ? el.pause() : void el.play()
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current
    const bar = seekRef.current
    if (!el || !bar || !total) return
    const r = bar.getBoundingClientRect()
    el.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * total
    setElapsed(el.currentTime)
  }

  // Step within the current show's (loaded) episode list.
  function step(dir: 1 | -1) {
    if (!current || !feed) return
    const list = feed.episodes
    const i = list.findIndex((e) => e.id === current.ep.id)
    const next = list[i + dir]
    if (next) playEpisode(current.show, next)
  }

  function onTime(e: React.SyntheticEvent<HTMLAudioElement>) {
    const t = e.currentTarget.currentTime
    setElapsed(t)
    // Persist the resume point at most every ~5s.
    if (current && t - lastSave.current > 5) { lastSave.current = t; setResume(current.ep.id, t) }
  }
  function onLoaded(e: React.SyntheticEvent<HTMLAudioElement>) {
    const el = e.currentTarget
    setDur(el.duration || 0)
    el.volume = vol
    // Resume where we left off (unless finished).
    if (current) {
      const at = resume[current.ep.id]
      if (at && at < (el.duration || Infinity) - 10) { el.currentTime = at; setStatus(`Resumed at ${fmt(at)}`) }
    }
  }
  function onEnded() {
    if (current) { markPlayed(current.ep.id); clearResume(current.ep.id) }
    step(1)
  }

  async function download(ep: Episode) {
    setStatus('Downloading…')
    try {
      const r = await fetch(ep.enclosure)
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ep.title.replace(/[^\w.-]+/g, '_')}.mp3`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      setStatus('Saved to your downloads.')
    } catch {
      // Cross-origin blocked the blob — fall back to opening the file.
      window.open(ep.enclosure, '_blank', 'noopener')
      setStatus('Opened the episode (direct download blocked).')
    }
  }

  const episodes = feed?.episodes ?? []
  const unplayed = episodes.filter((e) => !played[e.id]).length

  return (
    <div className={styles.pod} ref={rootRef}>
      <div className={styles.menubar}>
        <span>File</span><span>Edit</span><span>Tools</span><span>Feeds</span><span>Help</span>
      </div>

      {/* Transport (foobar-style) */}
      <div className={styles.transport}>
        <button type="button" className={styles.tbtn} aria-label="Previous" onClick={() => step(-1)}>⏮</button>
        <button type="button" className={styles.tbtn} aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>{playing ? '⏸' : '▶'}</button>
        <button type="button" className={styles.tbtn} aria-label="Stop" onClick={() => { const el = audioRef.current; if (el) { el.pause(); el.currentTime = 0 } setElapsed(0) }}>⏹</button>
        <button type="button" className={styles.tbtn} aria-label="Next" onClick={() => step(1)}>⏭</button>
        <div ref={seekRef} className={styles.seek} onClick={seekTo} role="slider" aria-label="Seek" aria-valuenow={Math.round(progress * 100)}>
          <div className={styles.seekfill} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={styles.time}>{fmt(elapsed)} / {fmt(total || null)}</div>
        <input
          type="range" className={styles.vol} min={0} max={1} step={0.01} value={vol} aria-label="Volume"
          onChange={(e) => { const v = Number(e.target.value); setVol(v); if (audioRef.current) audioRef.current.volume = v }}
        />
      </div>

      <div className={styles.now}>
        {current ? (
          <>
            {current.ep.art ? <img className={styles.nowArt} src={current.ep.art} alt="" /> : <MusicIcon size={26} />}
            <div className={styles.nowText}>
              <div className={styles.nowTitle}>{current.ep.title}</div>
              <div className={styles.nowShow}>{current.show.title}{status ? ` · ${status}` : ''}</div>
            </div>
          </>
        ) : (
          <div className={styles.nowShow}>{status || 'Select a show, then an episode.'}</div>
        )}
      </div>

      {narrow && (
        <div className={styles.mviews} role="tablist">
          <button type="button" role="tab" aria-selected={mview === 'shows'} className={`${styles.mview} ${mview === 'shows' ? styles.mviewOn : ''}`} onClick={() => setMview('shows')}>Shows</button>
          <button type="button" role="tab" aria-selected={mview === 'episodes'} className={`${styles.mview} ${mview === 'episodes' ? styles.mviewOn : ''}`} onClick={() => setMview('episodes')}>Episodes</button>
        </div>
      )}

      <div className={styles.body} data-narrow={narrow} data-view={mview}>
        {/* Subscriptions */}
        <div className={styles.shows}>
          <div className={styles.paneHead}>Podcasts <span className={styles.count}>{shows.length}</span></div>
          <div className={styles.showScroll}>
            {shows.map((s) => (
              <button
                key={s.feedUrl}
                type="button"
                className={`${styles.show} ${selected?.feedUrl === s.feedUrl ? styles.showOn : ''}`}
                onClick={() => void openShow(s)}
                title={s.title}
              >
                <GlobeIcon size={14} className={styles.showIcon} />
                <span className={styles.showName}>{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Episodes */}
        <div className={styles.episodes}>
          <div className={styles.paneHead}>
            <span className={styles.epHeadTitle}>{selected ? selected.title : 'Episodes'}</span>
            {selected && !loading && (
              <>
                {!!episodes.length && <span className={styles.count}>{unplayed} new / {episodes.length}</span>}
                <button type="button" className={styles.refresh} onClick={() => void openShow(selected, true)} title="Check for new episodes">↻</button>
              </>
            )}
          </div>
          <div className={styles.epScroll}>
            {!selected && <div className={styles.msg}>Choose a podcast on the left.</div>}
            {loading && <div className={styles.msg}>Loading episodes…</div>}
            {selected && !loading && error && <div className={styles.msg}>{error}</div>}
            {selected && !loading && !error && episodes.map((ep) => {
              const isCur = current?.ep.id === ep.id
              const isPlayed = !!played[ep.id]
              const at = resume[ep.id]
              const notesOpen = openNotes.has(ep.id)
              return (
                <div key={ep.id} className={`${styles.ep} ${isCur ? styles.epCur : ''} ${isPlayed ? styles.epPlayed : ''}`}>
                  <button type="button" className={styles.epPlay} aria-label="Play episode" onClick={() => playEpisode(selected, ep)}>
                    {isCur && playing ? '⏸' : '▶'}
                  </button>
                  <div className={styles.epMain}>
                    <div className={styles.epTitle} onDoubleClick={() => playEpisode(selected, ep)}>{ep.title}</div>
                    <div className={styles.epMeta}>
                      {fmtDate(ep.date)}
                      {ep.durationSec ? ` · ${fmt(ep.durationSec)}` : ''}
                      {at ? ` · resume ${fmt(at)}` : ''}
                      {isPlayed ? ' · played' : ''}
                    </div>
                    {ep.notes && (
                      <>
                        <button type="button" className={styles.notesToggle} onClick={() => setOpenNotes((s) => { const n = new Set(s); n.has(ep.id) ? n.delete(ep.id) : n.add(ep.id); return n })}>
                          {notesOpen ? 'Hide notes' : 'Show notes'}
                        </button>
                        {notesOpen && <div className={styles.notes}>{ep.notes}</div>}
                      </>
                    )}
                  </div>
                  <div className={styles.epActions}>
                    <button type="button" className={styles.epBtn} title={isPlayed ? 'Mark unplayed' : 'Mark played'} onClick={() => markPlayed(ep.id, !isPlayed)}>{isPlayed ? '↺' : '✓'}</button>
                    <button type="button" className={styles.epBtn} title="Download episode" onClick={() => void download(ep)}>⤓</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onTimeUpdate={onTime}
        onLoadedMetadata={onLoaded}
        hidden
      />
    </div>
  )
}
