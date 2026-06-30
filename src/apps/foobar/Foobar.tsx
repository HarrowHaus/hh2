import { useEffect, useMemo, useRef, useState } from 'react'
import { buildLibrary, fmtTime, HAS_AUDIO, LABELS, TRACKS, type Track } from './catalog'
import { MusicIcon } from '../../os/icons'
import styles from './Foobar.module.css'

// foobar2000 — media-library over the self-hosted R2 catalog (docs/03). Real
// HTML5 <audio> + a real Web Audio AnalyserNode spectrum. Until the ingest
// populates audio-manifest.json there are no srcs: the tree still browses the
// spine (labels/bands) and a banner invites running ingest. NO fake audio.
export function Foobar() {
  const library = useMemo(() => buildLibrary(), [])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(LABELS.map((l) => l.id)))
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [selNode, setSelNode] = useState<string>('')
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

  // Total playable length comes from the audio element once loaded, else the
  // catalog's stored duration so the transport reads right before playback.
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
    // Columns-UI spectrum: accent→transparent gradient bars with falling peak caps.
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
        // Peak cap: hold at the highest recent value, drift down slowly.
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

  function playTrack(t: Track) {
    setCurrent(t)
    setElapsed(0)
    setDur(0)
    if (!t.src) {
      setPlaying(false)
      setStatus('No audio yet — run the ingest to self-host this catalog.')
      return
    }
    const el = audioRef.current!
    el.src = t.src
    ensureGraph()
    ctxRef.current?.resume()
    el.play().then(() => setStatus('')).catch(() => setStatus('Could not start playback.'))
  }

  function onAudioPlay() {
    setPlaying(true)
    cancelAnimationFrame(rafRef.current)
    drawSpectrum()
  }
  function onAudioPause() {
    setPlaying(false)
    cancelAnimationFrame(rafRef.current)
  }
  function step(dir: 1 | -1) {
    if (!current || !playlist.length) return
    const i = playlist.findIndex((t) => t.id === current.id)
    const next = playlist[(i + dir + playlist.length) % playlist.length]
    if (next) playTrack(next)
  }
  function togglePlay() {
    const el = audioRef.current
    if (!el || !current?.src) {
      setStatus(current ? 'No audio yet for this track.' : 'Select a track.')
      return
    }
    playing ? el.pause() : el.play()
  }

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
          type="range"
          className={styles.vol}
          min={0}
          max={1}
          step={0.01}
          value={vol}
          aria-label="Volume"
          onChange={(e) => {
            const v = Number(e.target.value)
            setVol(v)
            if (audioRef.current) audioRef.current.volume = v
          }}
        />
      </div>

      {!HAS_AUDIO && (
        <div className={styles.banner}>
          Library is empty — run <code>npm run ingest</code> to self-host the catalog to R2. Browsing the spine below.
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.tree}>
          <div className={styles.treeHead}>Album List</div>
          {library.map((label) => (
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
                  return (
                    <div key={bandKey}>
                      <div
                        className={`${styles.node} ${styles.band} ${selNode === bandKey ? styles.nodeSel : ''}`}
                        onClick={() => {
                          toggle(bandKey)
                          setSelNode(bandKey)
                          setPlaylist(band.albums.flatMap((a) => a.tracks))
                        }}
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
                            onClick={() => { setSelNode(al.key); setPlaylist(al.tracks) }}
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

        <div className={styles.center}>
          <div className={styles.playlist}>
            <div className={`${styles.row} ${styles.head}`}>
              <div className={styles.num}>#</div><div className={styles.col}>Artist</div>
              <div className={styles.col}>Title</div><div className={styles.col}>Album</div><div className={styles.dur}>Length</div>
            </div>
            {playlist.length === 0 && <div className={styles.empty}>Select a band or album on the left.</div>}
            {playlist.map((t, i) => (
              <div
                key={t.id}
                className={`${styles.row} ${current?.id === t.id ? styles.rowActive : ''}`}
                onClick={() => setCurrent(t)}
                onDoubleClick={() => playTrack(t)}
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
        <span>{TRACKS.length} tracks · {LABELS.length} labels</span>
        <span>{status || (HAS_AUDIO ? '' : 'Bandcamp: view-on-release links per album')}</span>
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
