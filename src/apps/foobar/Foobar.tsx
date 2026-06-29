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

  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)

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
    const loop = () => {
      analyser.getByteFrequencyData(bins)
      g.clearRect(0, 0, canvas.width, canvas.height)
      const accent = getComputedStyle(canvas).getPropertyValue('--accent') || '#9a1414'
      const bw = canvas.width / bins.length
      for (let i = 0; i < bins.length; i++) {
        const h = (bins[i] / 255) * canvas.height
        g.fillStyle = accent
        g.fillRect(i * bw, canvas.height - h, bw - 1, h)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  function playTrack(t: Track) {
    setCurrent(t)
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
        <button type="button" className={styles.tbtn} aria-label="Stop" onClick={() => { audioRef.current?.pause(); setCurrent(null) }}>⏹</button>
        <button type="button" className={styles.tbtn} aria-label="Next" onClick={() => step(1)}>⏭</button>
        <div className={styles.seek}><div className={styles.seekfill} /></div>
        <div className={styles.time}>{fmtTime(current?.durationSec)} / {fmtTime(current?.durationSec)}</div>
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
          <canvas ref={canvasRef} width={148} height={48} className={styles.spectrum} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.statusbar}>
        <span>{TRACKS.length} tracks · {LABELS.length} labels</span>
        <span>{status || (HAS_AUDIO ? '' : 'Bandcamp: view-on-release links per album')}</span>
      </div>

      <audio ref={audioRef} onPlay={onAudioPlay} onPause={onAudioPause} onEnded={() => step(1)} hidden />
    </div>
  )
}
