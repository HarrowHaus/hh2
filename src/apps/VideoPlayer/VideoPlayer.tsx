import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import 'videojs-youtube'
import type { AppProps } from '../../os/types'
import styles from './VideoPlayer.module.css'

// Video Player (docs/08 Tier B) — video.js (Apache-2.0) with the YouTube tech
// (videojs-youtube, MIT). Plays a local file you open or a direct video / YouTube
// URL, with keyboard shortcuts. Native browser codecs cover mp4/webm/ogg + HLS;
// the heavier codecbox.js (GPL) extra-codec path is deferred to the wasm batch.
// "Video.js" (Brightcove) / "YouTube" names used nominatively; the YT tech binds
// YouTube's ToS at play time. No video content is bundled.

type Player = ReturnType<typeof videojs>

interface Source { src: string; type: string }

function detectSource(url: string): Source {
  const u = url.trim()
  if (/(?:youtube\.com|youtu\.be)\//i.test(u)) return { src: u, type: 'video/youtube' }
  const ext = u.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''
  const byExt: Record<string, string> = {
    mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm',
    ogv: 'video/ogg', ogg: 'video/ogg', mov: 'video/mp4',
    m3u8: 'application/x-mpegURL', mpd: 'application/dash+xml',
  }
  return { src: u, type: byExt[ext] ?? 'video/mp4' }
}

export function VideoPlayer(_props: AppProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<Player | null>(null)
  const objUrlRef = useRef<string | null>(null)
  const [addr, setAddr] = useState('')
  const [label, setLabel] = useState('')

  // Create the player once.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const player = videojs(el, {
      controls: true,
      fluid: true,
      preload: 'auto',
      techOrder: ['html5', 'youtube'],
      youtube: { ytControls: 0, rel: 0, modestbranding: 1 },
    })
    playerRef.current = player
    return () => {
      try { player.dispose() } catch { /* ignore */ }
      playerRef.current = null
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
    }
  }, [])

  function load(source: Source, name: string) {
    const player = playerRef.current
    if (!player) return
    player.src(source)
    player.play()?.catch(() => { /* autoplay blocked — user presses play */ })
    setLabel(name)
  }
  function openUrl() {
    if (!addr.trim()) return
    const s = detectSource(addr)
    load(s, s.type === 'video/youtube' ? 'YouTube' : addr.replace(/^https?:\/\//, '').slice(0, 48))
  }
  function openFile(file: File) {
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
    const url = URL.createObjectURL(file)
    objUrlRef.current = url
    load({ src: url, type: file.type || 'video/mp4' }, file.name)
  }

  // Keyboard shortcuts (space, seek, volume, fullscreen, mute).
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const p = playerRef.current
    if (!p) return
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    switch (e.key) {
      case ' ': case 'k': e.preventDefault(); (p.paused() ? p.play() : p.pause()); break
      case 'ArrowRight': e.preventDefault(); p.currentTime(Math.min((p.duration() || 0), (p.currentTime() || 0) + 5)); break
      case 'ArrowLeft': e.preventDefault(); p.currentTime(Math.max(0, (p.currentTime() || 0) - 5)); break
      case 'ArrowUp': e.preventDefault(); p.volume(Math.min(1, (p.volume() || 0) + 0.1)); break
      case 'ArrowDown': e.preventDefault(); p.volume(Math.max(0, (p.volume() || 0) - 0.1)); break
      case 'f': e.preventDefault(); p.isFullscreen() ? p.exitFullscreen() : p.requestFullscreen(); break
      case 'm': e.preventDefault(); p.muted(!p.muted()); break
      default: break
    }
  }

  return (
    <div className={styles.vp} onKeyDown={onKeyDown} tabIndex={0}>
      <div className={styles.toolbar}>
        <label className={styles.openBtn}>
          Open…
          <input
            type="file" accept="video/*" className={styles.fileInput}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) openFile(f) }}
          />
        </label>
        <form className={styles.urlForm} onSubmit={(e) => { e.preventDefault(); openUrl() }}>
          <input
            className={styles.urlInput}
            placeholder="paste a video URL or YouTube link…"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            spellCheck={false}
            aria-label="Video URL"
          />
          <button type="submit" className={styles.goBtn}>Play</button>
        </form>
        {label && <span className={styles.label} title={label}>{label}</span>}
      </div>
      <div className={styles.stage} data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline />
      </div>
      <div className={styles.help}>space play · ←/→ seek · ↑/↓ volume · F fullscreen · M mute</div>
    </div>
  )
}
