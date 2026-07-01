import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import {
  SOURCES, discographySource, fmtTime, codecReadout, totalLength,
  HAS_AUDIO, LABELS, TRACKS, type Track, type LabelNode,
} from './catalog'
import { usePlaylists } from './playlists'
import { MusicIcon } from '../../os/icons'
import styles from './Foobar.module.css'

// foobar2000 — Columns-UI parity rebuild (docs/11 §2). Media Library (a browsable
// SOURCE tree, switchable) is separate from Playlists (multiple, named, tabbed,
// persisted). Double-clicking a library item sends it to the active playlist.
// Real HTML5 <audio> + a Web Audio AnalyserNode spectrum. Sources are async so a
// networked library (Wavlake, §2.2) can slot in with no UI change. NO fake audio.
export function Foobar() {
  // ── Library source + its (async-loaded) tree ─────────────────────────────
  const [sourceId, setSourceId] = useState(SOURCES[0].id)
  const source = useMemo(() => SOURCES.find((s) => s.id === sourceId) ?? discographySource, [sourceId])
  const [tree, setTree] = useState<LabelNode[]>([])
  const [treeLoading, setTreeLoading] = useState(true)
  const [treeError, setTreeError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selNode, setSelNode] = useState('')

  useEffect(() => {
    let alive = true
    setTreeLoading(true)
    setTreeError('')
    source
      .getTree()
      .then((t) => {
        if (!alive) return
        setTree(t)
        // Default-expand the top level (labels/artists) like the old view did.
        setExpanded(new Set(t.map((l) => l.id)))
      })
      .catch(() => alive && setTreeError('This library is unavailable right now.'))
      .finally(() => alive && setTreeLoading(false))
    return () => { alive = false }
  }, [source])

  // ── Playlists (persisted, tabbed) ────────────────────────────────────────
  const playlists = usePlaylists((s) => s.playlists)
  const activeId = usePlaylists((s) => s.activeId)
  const addPlaylist = usePlaylists((s) => s.addPlaylist)
  const removePlaylist = usePlaylists((s) => s.removePlaylist)
  const renamePlaylist = usePlaylists((s) => s.renamePlaylist)
  const setActive = usePlaylists((s) => s.setActive)
  const addTracks = usePlaylists((s) => s.addTracks)
  const removeTracks = usePlaylists((s) => s.removeTracks)
  const active = playlists.find((p) => p.id === activeId) ?? playlists[0]
  const queue = active?.tracks ?? []
  const [renaming, setRenaming] = useState<string | null>(null)
  const [selRows, setSelRows] = useState<Set<string>>(new Set())

  // ── Playback ─────────────────────────────────────────────────────────────
  const [current, setCurrent] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [status, setStatus] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [dur, setDur] = useState(0)
  const [vol, setVol] = useState(0.85)

  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const seekRef = useRef<HTMLDivElement>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const peaksRef = useRef<number[]>([])
  const rafRef = useRef<number>(0)

  const total = dur || current?.durationSec || 0
  const progress = total > 0 ? Math.min(1, elapsed / total) : 0

  const toggle = (key: string) =>
    setExpanded((s) => {
      const n = new Set(s)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })

  function ensureGraph() {
    const el = audioRef.current
    if (!el || analyserRef.current) return
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const srcNode = ctx.createMediaElementSource(el)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    srcNode.connect(analyser)
    analyser.connect(ctx.destination)
    ctxRef.current = ctx
    analyserRef.current = analyser
  }

  function drawSpectrum() {
    const analyser = analyserRef.current
    const canvas = canvasRef.current
    if (!analyser || !canvas) return
    const g = canvas.getContext('2d')!
    const bins = new Uint8Array(analyser.frequencyBinCount)
    const W = canvas.width
    const H = canvas.height
    const peaks = (peaksRef.current = new Array(bins.length).fill(0))
    const accent = (getComputedStyle(canvas).getPropertyValue('--accent') || '#9a1414').trim()
    const grad = g.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, accent)
    grad.addColorStop(1, '#15151a')
    const loop = () => {
      analyser.getByteFrequencyData(bins)
      g.clearRect(0, 0, W, H)
      const bw = W / bins.length
      for (let i = 0; i < bins.length; i++) {
        const v = bins[i] / 255
        const h = v * H
        g.fillStyle = grad
        g.fillRect(i * bw, H - h, Math.max(1, bw - 1), h)
        peaks[i] = Math.max(h, peaks[i] - 1.1)
        g.fillStyle = accent
        g.fillRect(i * bw, H - peaks[i] - 1, Math.max(1, bw - 1), 1.5)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current
    const bar = seekRef.current
    if (!el || !bar || !total) return
    const r = bar.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    el.currentTime = frac * total
    setElapsed(el.currentTime)
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  async function playTrack(t: Track) {
    setCurrent(t)
    setElapsed(0)
    setDur(0)
    // A track carries its own src (Discography/R2); otherwise ask the source to
    // resolve one (Wavlake, §2.2). Either may be null → ready/empty, no fake audio.
    const url = t.src ?? (await source.resolveStreamUrl(t))
    if (!url) {
      setPlaying(false)
      setStatus(HAS_AUDIO ? 'No audio for this track.' : 'No audio yet — run the ingest to self-host this catalog.')
      return
    }
    const el = audioRef.current!
    el.src = url
    ensureGraph()
    ctxRef.current?.resume()
    el.play().then(() => setStatus('')).catch(() => setStatus('Could not start playback.'))
  }

  function onAudioPlay() { setPlaying(true); cancelAnimationFrame(rafRef.current); drawSpectrum() }
  function onAudioPause() { setPlaying(false); cancelAnimationFrame(rafRef.current) }

  function step(dir: 1 | -1) {
    if (!current || !queue.length) return
    const i = queue.findIndex((t) => t.id === current.id)
    const next = queue[(i + dir + queue.length) % queue.length]
    if (next) void playTrack(next)
  }
  function togglePlay() {
    const el = audioRef.current
    if (!el || !current) { setStatus('Select a track.'); return }
    if (!el.src) { void playTrack(current); return }
    playing ? el.pause() : el.play()
  }

  // Send a library node's tracks to the active playlist and play the first
  // (foobar's double-click "send to current playlist" behavior).
  function sendToActive(tracks: Track[]) {
    if (!active || !tracks.length) return
    const added = addTracks(active.id, tracks)
    setStatus(added ? `Added ${added} track${added === 1 ? '' : 's'} to ${active.name}` : 'Already in this playlist')
    void playTrack(tracks[0])
  }

  function onRowClick(e: React.MouseEvent, t: Track) {
    setCurrent(t)
    setSelRows((s) => {
      if (e.ctrlKey || e.metaKey) {
        const n = new Set(s)
        n.has(t.id) ? n.delete(t.id) : n.add(t.id)
        return n
      }
      return new Set([t.id])
    })
  }

  function onQueueKey(e: KeyboardEvent) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selRows.size && active) {
      e.preventDefault()
      removeTracks(active.id, [...selRows])
      setSelRows(new Set())
    }
  }

  // Status bar: selection-aware track/time counts + a codec readout.
  const selTracks = queue.filter((t) => selRows.has(t.id))
  const shownLen = totalLength(selTracks.length ? selTracks : queue)
  const countLabel = selRows.size
    ? `${selRows.size} of ${queue.length} selected`
    : `${queue.length} track${queue.length === 1 ? '' : 's'}`

  return (
    <div className={styles.fb}>
      <div className={styles.menubar}>
        <span>File</span><span>Edit</span><span>View</span><span>Playback</span><span>Library</span><span>Help</span>
      </div>

      <div className={styles.transport}>
        <button type="button" className={styles.tbtn} aria-label="Previous" onClick={() => step(-1)}>⏮</button>
        <button type="button" className={styles.tbtn} aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>{playing ? '⏸' : '▶'}</button>
        <button type="button" className={styles.tbtn} aria-label="Stop" onClick={() => { const el = audioRef.current; if (el) { el.pause(); el.currentTime = 0 } setCurrent(null); setElapsed(0); setDur(0) }}>⏹</button>
        <button type="button" className={styles.tbtn} aria-label="Next" onClick={() => step(1)}>⏭</button>
        <div ref={seekRef} className={styles.seek} onClick={seekTo} role="slider" aria-label="Seek" aria-valuenow={Math.round(progress * 100)}>
          <div className={styles.seekfill} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={styles.time}>{fmtTime(elapsed)} / {fmtTime(total || null)}</div>
        <span className={styles.volIcon} aria-hidden="true">🔊</span>
        <input
          type="range" className={styles.vol} min={0} max={1} step={0.01} value={vol} aria-label="Volume"
          onChange={(e) => { const v = Number(e.target.value); setVol(v); if (audioRef.current) audioRef.current.volume = v }}
        />
      </div>

      {/* Playlist tabs row (docs/11 §2.0 #3) */}
      <div className={styles.tabs} role="tablist" aria-label="Playlists">
        {playlists.map((p) => (
          <div
            key={p.id}
            role="tab"
            aria-selected={p.id === activeId}
            className={`${styles.tab} ${p.id === activeId ? styles.tabActive : ''}`}
            onClick={() => setActive(p.id)}
            onDoubleClick={() => setRenaming(p.id)}
            title="Double-click to rename"
          >
            {renaming === p.id ? (
              <input
                className={styles.tabInput}
                defaultValue={p.name}
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { renamePlaylist(p.id, (e.target as HTMLInputElement).value); setRenaming(null) }
                  else if (e.key === 'Escape') setRenaming(null)
                }}
                onBlur={(e) => { renamePlaylist(p.id, e.currentTarget.value); setRenaming(null) }}
              />
            ) : (
              <>
                <span className={styles.tabName}>{p.name}</span>
                <span className={styles.tabCount}>{p.tracks.length}</span>
                {playlists.length > 1 && (
                  <button
                    type="button" className={styles.tabClose} aria-label={`Close ${p.name}`}
                    onClick={(e) => { e.stopPropagation(); removePlaylist(p.id) }}
                  >×</button>
                )}
              </>
            )}
          </div>
        ))}
        <button type="button" className={styles.tabAdd} aria-label="New playlist" onClick={addPlaylist}>＋</button>
      </div>

      <div className={styles.body}>
        {/* Media Library panel: source switcher + album-list tree */}
        <div className={styles.tree}>
          <div className={styles.sourceSwitch} role="tablist" aria-label="Library source">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={s.id === sourceId}
                className={`${styles.sourceBtn} ${s.id === sourceId ? styles.sourceActive : ''}`}
                onClick={() => setSourceId(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className={styles.treeHead}>Album List</div>
          <div className={styles.treeScroll}>
            {treeLoading && <div className={styles.treeMsg}>Loading…</div>}
            {!treeLoading && treeError && <div className={styles.treeMsg}>{treeError}</div>}
            {!treeLoading && !treeError && tree.length === 0 && <div className={styles.treeMsg}>This library is empty.</div>}
            {!treeLoading && tree.map((label) => (
              <div key={label.id}>
                <div className={styles.node} onClick={() => toggle(label.id)}>
                  <span className={styles.tw}>{expanded.has(label.id) ? '▾' : '▸'}</span>
                  <MusicIcon size={14} />
                  <span className={styles.lbl}>{label.name}</span>
                  {label.founded ? <span className={styles.muted}>&nbsp;{label.founded}</span> : null}
                </div>
                {expanded.has(label.id) &&
                  label.bands.map((band) => {
                    const bandKey = `${label.id}|${band.name}`
                    const bandTracks = band.albums.flatMap((a) => a.tracks)
                    return (
                      <div key={bandKey}>
                        <div
                          className={`${styles.node} ${styles.band} ${selNode === bandKey ? styles.nodeSel : ''}`}
                          onClick={() => { toggle(bandKey); setSelNode(bandKey) }}
                          onDoubleClick={() => sendToActive(bandTracks)}
                          title="Double-click to add to the active playlist"
                        >
                          <span className={styles.tw}>{band.albums.length ? (expanded.has(bandKey) ? '▾' : '▸') : ''}</span>
                          <span>{band.name}</span>
                          {band.year ? <span className={styles.muted}>&nbsp;{band.year}</span> : null}
                        </div>
                        {expanded.has(bandKey) &&
                          band.albums.map((al) => (
                            <div
                              key={al.key}
                              className={`${styles.node} ${styles.album} ${selNode === al.key ? styles.nodeSel : ''}`}
                              onClick={() => setSelNode(al.key)}
                              onDoubleClick={() => sendToActive(al.tracks)}
                              title="Double-click to add to the active playlist"
                            >
                              <span>{al.album}</span>
                              {al.year ? <span className={styles.muted}>&nbsp;{al.year}</span> : null}
                            </div>
                          ))}
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.center}>
          <div className={styles.playlist} tabIndex={0} onKeyDown={onQueueKey}>
            <div className={`${styles.row} ${styles.head}`}>
              <div className={styles.num}>#</div><div className={styles.col}>Artist</div>
              <div className={styles.col}>Title</div><div className={styles.col}>Album</div><div className={styles.dur}>Length</div>
            </div>
            {queue.length === 0 && (
              <div className={styles.empty}>
                Playlist “{active?.name}” is empty. Double-click a band or album on the left to add tracks.
              </div>
            )}
            {queue.map((t, i) => (
              <div
                key={t.id}
                className={`${styles.row} ${current?.id === t.id ? styles.rowActive : ''} ${selRows.has(t.id) ? styles.rowSel : ''}`}
                onClick={(e) => onRowClick(e, t)}
                onDoubleClick={() => void playTrack(t)}
              >
                <div className={styles.num}>{t.trackNo || i + 1}</div>
                <div className={styles.col}>{t.artist}</div>
                <div className={styles.col}>{t.title}</div>
                <div className={styles.col}>{t.album}</div>
                <div className={styles.dur}>{fmtTime(t.durationSec)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.artPanel}>
          <div className={styles.art}>
            {current?.art ? <img src={current.art} alt="" /> : <MusicIcon size={56} />}
          </div>
          <div className={styles.npArtist}>{current?.artist ?? 'Nothing playing'}</div>
          <div className={styles.npTitle}>{current?.title ?? 'select a track'}</div>
          {current?.album && <div className={styles.npAlbum}>{current.album}</div>}
          <div className={styles.spectrumWrap}>
            <div className={styles.spectrumLabel}>{playing ? 'Spectrum' : 'Spectrum · idle'}</div>
            <canvas ref={canvasRef} width={148} height={48} className={styles.spectrum} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className={styles.statusbar}>
        <span>{countLabel} · {fmtTime(shownLen)}</span>
        <span>{status || codecReadout(playing ? current : null, ctxRef.current?.sampleRate) || `${TRACKS.length} tracks · ${LABELS.length} labels`}</span>
      </div>

      <audio
        ref={audioRef}
        onPlay={onAudioPlay}
        onPause={onAudioPause}
        onEnded={() => step(1)}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => { setDur(e.currentTarget.duration || 0); e.currentTarget.volume = vol }}
        hidden
      />
    </div>
  )
}
