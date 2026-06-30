import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppProps } from '../../os/types'
import styles from './IE.module.css'

// Internet Explorer — a real little browser over a STATIC in-world web, now with
// the full daedalOS browser surface adapted to our read-only/no-open-proxy
// posture (docs/08 Tier A · owner ruling E):
//   • Back / Forward / Reload / Stop / Home history.
//   • A Favorites (bookmark) bar with favicons; entries actually navigate.
//   • The Underground Noise Webring (prev/next/random/list) merged in.
//   • Address-bar search: non-URL input → an in-world search-results page.
//   • Read-only proxy modes — the ONLY network seams, each a single allowlisted
//     host in a sandboxed iframe: the Wayback Machine (web.archive.org) and The
//     Old Net (theoldnet.com), plus an IPFS gateway for ipfs: URIs. No open
//     proxy; every other URL resolves to an in-world page or an XP error.
//   • chrome://dino — an original endless-runner (no Google sprite).
// All site content is fictional/in-voice (docs/03); the realtime guestbook stays
// Phase 6.

const HOME = 'http://www.geocities.com/sunsetstrip/basement/4127/'
const ROTBOX = 'http://www.angelfire.com/oh/rotbox/'
const TAPEHISS = 'http://members.tripod.com/~tapehiss/'
const VAULT = 'http://www.geocities.com/area51/vault/8806/'
const RING_LIST = 'about:ring'
const DINO = 'chrome://dino'

// The ring proper — ordered; prev/next wrap around it.
const RING: string[] = [HOME, ROTBOX, TAPEHISS, VAULT]

// Favorites bar — diegetic bookmarks. Each favicon is an original 1-char glyph.
interface Bookmark {
  url: string
  label: string
  icon: string
}
const BOOKMARKS: Bookmark[] = [
  { url: HOME, label: "moldmouth's corner", icon: '★' },
  { url: ROTBOX, label: 'ROTBOX vhs', icon: '☠' },
  { url: TAPEHISS, label: 'TAPE HISS', icon: '♪' },
  { url: VAULT, label: 'VAULT 8806', icon: '⌂' },
  { url: RING_LIST, label: 'the ring', icon: '◉' },
  { url: 'http://web.archive.org/web/2004/http://www.geocities.com/', label: 'old net', icon: '🕸' },
  { url: DINO, label: 'dino', icon: '🦖' },
]

// ── Read-only proxy seams (the only network access) ──────────────────────────
// Each returns a single allowlisted https host to load in a sandboxed iframe, or
// null. Nothing else can reach the network.
interface Proxy {
  kind: 'wayback' | 'oldnet' | 'ipfs'
  src: string
  label: string
}
function proxyTarget(raw: string): Proxy | null {
  const url = raw.trim()
  // Wayback Machine — web.archive.org / archive.org.
  const wb = url.match(/^(?:https?:\/\/)?(web\.archive\.org|archive\.org)(\/.*)?$/i)
  if (wb) return { kind: 'wayback', src: `https://${wb[1]}${wb[2] ?? ''}`, label: 'Wayback Machine' }
  // The Old Net — theoldnet.com (a period-rendering read-only proxy).
  const on = url.match(/^(?:https?:\/\/)?(?:www\.)?(theoldnet\.com)(\/.*)?$/i)
  if (on) return { kind: 'oldnet', src: `https://${on[1]}${on[2] ?? ''}`, label: 'The Old Net' }
  // IPFS — ipfs://CID or ipfs:/ipfs/CID → a single allowlisted gateway.
  const ip = url.match(/^ipfs:(?:\/\/|\/ipfs\/|\/)?([a-z0-9]+.*)$/i)
  if (ip) {
    const path = ip[1].replace(/^ipfs\//i, '')
    return { kind: 'ipfs', src: `https://dweb.link/ipfs/${path}`, label: 'IPFS · dweb.link' }
  }
  return null
}

// Build an in-world search URL from a free-text query.
function searchUrl(q: string): string {
  return 'about:search?q=' + encodeURIComponent(q.trim())
}
function searchQuery(url: string): string | null {
  const m = url.match(/^about:search\?q=(.*)$/)
  return m ? decodeURIComponent(m[1]) : null
}

// Decide what an address-bar entry means: a known scheme, a hostname, or a
// search. Period-accurate: bare hosts assume http:// and we don't force https.
function normalize(raw: string): string {
  let u = raw.trim()
  if (!u) return HOME
  if (u === RING_LIST || u === DINO || u.startsWith('about:')) return u
  if (/^(chrome|ipfs|nostr):/i.test(u)) return u
  if (/^https?:\/\//i.test(u)) return u.replace(/\s+$/, '')
  // No scheme. If it looks like a host (a dot, no spaces) treat as a URL;
  // otherwise it's a search.
  const looksLikeHost = /^[^\s]+\.[^\s]+$/.test(u) && !u.includes(' ')
  if (looksLikeHost) return 'http://' + u
  return searchUrl(u)
}

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

export function IE({ args }: AppProps) {
  // Optional launch arg: another app (e.g. Flash Player) can open IE at a URL.
  const initial = typeof args?.url === 'string' ? normalize(args.url) : HOME
  const [history, setHistory] = useState<string[]>([initial])
  const [idx, setIdx] = useState(0)
  const [addr, setAddr] = useState(initial)
  // Refresh key remounts the page/iframe so Refresh + Stop feel real.
  const [nonce, setNonce] = useState(0)
  const [stopped, setStopped] = useState(false)

  const url = history[idx]
  const canBack = idx > 0
  const canFwd = idx < history.length - 1

  function go(raw: string) {
    const next = normalize(raw)
    setStopped(false)
    if (next === url) {
      setNonce((n) => n + 1)
      setAddr(next)
      return
    }
    const trimmed = history.slice(0, idx + 1)
    trimmed.push(next)
    setHistory(trimmed)
    setIdx(trimmed.length - 1)
    setAddr(next)
  }
  function back() {
    if (!canBack) return
    setStopped(false)
    setIdx(idx - 1)
    setAddr(history[idx - 1])
  }
  function forward() {
    if (!canFwd) return
    setStopped(false)
    setIdx(idx + 1)
    setAddr(history[idx + 1])
  }

  // Ring navigation: walk RING relative to the current site (default to start).
  const ringIndex = RING.indexOf(url)
  function ringStep(delta: number) {
    const base = ringIndex < 0 ? 0 : ringIndex
    const n = (base + delta + RING.length) % RING.length
    go(RING[n])
  }
  function ringRandom() {
    // Deterministic-ish spread without Math.random: hop a prime stride from the
    // current spot so it never lands on itself.
    const base = ringIndex < 0 ? 0 : ringIndex
    go(RING[(base + 3) % RING.length])
  }

  const proxy = useMemo(() => proxyTarget(url), [url])
  const query = useMemo(() => searchQuery(url), [url])

  return (
    <div className={styles.ie}>
      <div className={styles.menubar}>
        <span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span>
      </div>
      <div className={styles.toolbar}>
        <button type="button" className={styles.tbtn} disabled={!canBack} onClick={back}>◄ Back</button>
        <button type="button" className={styles.tbtn} disabled={!canFwd} onClick={forward}>Forward ►</button>
        <button type="button" className={styles.tbtn} onClick={() => setStopped(true)}>✕ Stop</button>
        <button type="button" className={styles.tbtn} onClick={() => { setStopped(false); setNonce((n) => n + 1) }}>↻ Refresh</button>
        <button type="button" className={styles.tbtn} onClick={() => go(HOME)}>⌂ Home</button>
      </div>
      <form
        className={styles.address}
        onSubmit={(e) => { e.preventDefault(); go(addr) }}
      >
        <span>Address</span>
        <input
          className={styles.addressbox}
          value={addr}
          spellCheck={false}
          onChange={(e) => setAddr(e.target.value)}
          aria-label="Address"
        />
        <button type="submit" className={styles.go}>Go</button>
      </form>

      {/* Favorites / bookmark bar */}
      <div className={styles.bookmarks}>
        <span className={styles.bmLabel}>Links</span>
        {BOOKMARKS.map((b) => (
          <button
            key={b.url}
            type="button"
            className={`${styles.bookmark} ${url === b.url ? styles.bookmarkActive : ''}`}
            onClick={() => go(b.url)}
            title={b.url}
          >
            <span className={styles.favicon} aria-hidden>{b.icon}</span>
            {b.label}
          </button>
        ))}
      </div>

      <div className={styles.viewport} key={`${url}#${nonce}`}>
        {stopped ? (
          <StoppedPage url={url} />
        ) : proxy ? (
          <OldNet proxy={proxy} />
        ) : url === DINO ? (
          <DinoGame />
        ) : query !== null ? (
          <SearchPage query={query} onGo={go} />
        ) : (
          <Page url={url} onRing={ringStep} onRandom={ringRandom} onList={() => go(RING_LIST)} onGo={go} />
        )}
      </div>
    </div>
  )
}

// ── Read-only proxy view (Wayback / Old Net / IPFS — single allowlisted host) ─
function OldNet({ proxy }: { proxy: Proxy }) {
  return (
    <div className={styles.oldnet}>
      <div className={styles.oldnetBar}>
        🕸 {proxy.label} · read-only · {proxy.src.replace(/^https:\/\//, '')}
      </div>
      <iframe
        className={styles.oldnetFrame}
        src={proxy.src}
        title={`${proxy.label} (read-only)`}
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}

// ── Stop button result ───────────────────────────────────────────────────────
function StoppedPage({ url }: { url: string }) {
  return (
    <div className={styles.errorPage}>
      <div className={styles.errorInner}>
        <div className={styles.errorTitle}>Action canceled</div>
        <p>Internet Explorer was unable to link to the Web page you requested. The page might be temporarily unavailable.</p>
        <hr className={styles.errorRule} />
        <p className={styles.errorSmall}>Stopped — <code>{url}</code></p>
      </div>
    </div>
  )
}

// ── chrome://dino — original endless runner (no Google T-Rex sprite) ──────────
// A little moth hops the bulbs. Space / ↑ / click to jump. Original canvas art.
function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [over, setOver] = useState(false)
  const [started, setStarted] = useState(false)
  // Mutable game state lives in a ref so the rAF loop never restarts on render.
  const game = useRef({
    y: 0, vy: 0, ground: 0, obstacles: [] as { x: number; w: number; h: number }[],
    speed: 3.2, t: 0, spawn: 0, score: 0, dead: false, running: false,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    const g = game.current
    g.ground = H - 22

    let raf = 0
    let last = 0
    function reset() {
      g.y = g.ground; g.vy = 0; g.obstacles = []; g.speed = 3.2
      g.t = 0; g.spawn = 40; g.score = 0; g.dead = false
    }
    function jump() {
      if (g.dead) { reset(); setOver(false); setScore(0); g.running = true; setStarted(true); return }
      if (g.y >= g.ground - 0.5) g.vy = -7.6
      g.running = true; setStarted(true)
    }
    function step(ts: number) {
      raf = requestAnimationFrame(step)
      if (!last) last = ts
      const dt = Math.min(2, (ts - last) / 16.67); last = ts
      if (!g.running) return
      g.t += dt
      // physics
      g.vy += 0.42 * dt
      g.y += g.vy * dt
      if (g.y > g.ground) { g.y = g.ground; g.vy = 0 }
      // obstacles
      g.spawn -= dt
      if (g.spawn <= 0) {
        const h = 12 + ((g.t * 7) % 14)
        g.obstacles.push({ x: W + 10, w: 8 + ((g.t * 3) % 8), h })
        g.spawn = 60 + ((g.t * 13) % 50) / g.speed
      }
      g.speed += 0.0012 * dt
      for (const o of g.obstacles) o.x -= g.speed * dt
      g.obstacles = g.obstacles.filter((o) => o.x + o.w > -4)
      // score + collision
      g.score += dt * 0.15
      const px = 30, pw = 18, ph = 14
      for (const o of g.obstacles) {
        if (px + pw > o.x && px < o.x + o.w && g.y > g.ground - ph - o.h + 6) {
          g.dead = true; g.running = false
          setOver(true)
          setBest((b) => { const s = Math.floor(g.score); return s > b ? s : b })
        }
      }
      setScore(Math.floor(g.score))
      // draw
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0a0a0e'; ctx.fillRect(0, 0, W, H)
      // ground line
      ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, g.ground + 8); ctx.lineTo(W, g.ground + 8); ctx.stroke()
      // obstacles = lightbulbs on poles
      ctx.fillStyle = '#ffd24a'
      for (const o of g.obstacles) {
        ctx.fillRect(o.x, g.ground + 8 - o.h, o.w, o.h)
        ctx.beginPath(); ctx.arc(o.x + o.w / 2, g.ground + 8 - o.h, o.w * 0.7, 0, Math.PI * 2); ctx.fill()
      }
      // player = a moth (two triangle wings + body)
      const py = g.y
      ctx.fillStyle = '#d8d8e8'
      const flap = Math.sin(g.t * 0.6) * 3
      ctx.beginPath()
      ctx.moveTo(px + 9, py - 7)
      ctx.lineTo(px - 2, py - 12 - flap); ctx.lineTo(px - 2, py - 1)
      ctx.lineTo(px + 9, py - 7)
      ctx.lineTo(px + 20, py - 12 - flap); ctx.lineTo(px + 20, py - 1)
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#8a7a5a'
      ctx.fillRect(px + 7, py - 12, 4, 12)
    }
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump() }
    }
    reset()
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('pointerdown', jump)
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', jump)
      g.running = false
    }
  }, [])

  return (
    <div className={styles.dinoWrap}>
      <div className={styles.dinoHud}>
        <span>chrome://dino</span>
        <span>HI {String(best).padStart(5, '0')}  {String(score).padStart(5, '0')}</span>
      </div>
      <canvas ref={canvasRef} width={520} height={170} className={styles.dinoCanvas} />
      <div className={styles.dinoHint}>
        {over ? 'G A M E   O V E R — press space to retry' : started ? 'space / ↑ to jump' : 'press space to start'}
      </div>
    </div>
  )
}

// ── In-world search results ───────────────────────────────────────────────────
function SearchPage({ query, onGo }: { query: string; onGo: (u: string) => void }) {
  const q = query.toLowerCase()
  const corpus: { url: string; title: string; blurb: string }[] = [
    { url: HOME, title: "moldmouth's corner of the web", blurb: 'noise tapes, horror VHS, and whatever i&#39;m ripping this week.' },
    { url: ROTBOX, title: 'ROTBOX — horror vhs trader', blurb: 'i trade tapes. i do not sell tapes. SOV, pre-cert, late-night TV dubs.' },
    { url: TAPEHISS, title: 'TAPE HISS distro', blurb: 'one-person mailorder. Dickcrush Records, Shaking Dog Tapes, hand-numbered C30s.' },
    { url: VAULT, title: 'VAULT 8806 — links + now playing', blurb: 'dead links stay up. that&#39;s the point. if it 404s, try the archive.' },
    { url: RING_LIST, title: 'The Underground Noise Webring', blurb: '39 members, in ring order. the dead ones aren&#39;t shown.' },
  ]
  const hits = corpus.filter((c) =>
    !q || c.title.toLowerCase().includes(q) || c.blurb.toLowerCase().includes(q),
  )
  return (
    <div className={styles.search}>
      <div className={styles.searchHead}>
        <span className={styles.searchLogo}>ask<b>jervis</b></span>
        <span className={styles.searchFor}>results for <b>{query}</b></span>
      </div>
      <div className={styles.searchCount}>{hits.length} site(s) in the index · the web is bigger than the index</div>
      <div className={styles.searchList}>
        {hits.map((h) => (
          <div key={h.url} className={styles.searchHit}>
            <button type="button" className={styles.searchTitle} onClick={() => onGo(h.url)}>{h.title}</button>
            <div className={styles.searchUrl}>{h.url}</div>
            <div className={styles.searchBlurb} dangerouslySetInnerHTML={{ __html: h.blurb }} />
          </div>
        ))}
        {hits.length === 0 && (
          <div className={styles.searchEmpty}>
            nothing in the index matched. try the{' '}
            <button type="button" className={styles.inlink} onClick={() => onGo('http://web.archive.org/web/*/' + query)}>
              Wayback Machine
            </button>{' '}— the old net remembers more than this little crawler does.
          </div>
        )}
      </div>
    </div>
  )
}

// ── In-world pages ────────────────────────────────────────────────────────────
function Page({
  url,
  onRing,
  onRandom,
  onList,
  onGo,
}: {
  url: string
  onRing: (d: number) => void
  onRandom: () => void
  onList: () => void
  onGo: (u: string) => void
}) {
  const ring = <RingBar onRing={onRing} onRandom={onRandom} onList={onList} />
  switch (url) {
    case HOME:
      return <HomePage ring={ring} />
    case ROTBOX:
      return <RotboxPage ring={ring} />
    case TAPEHISS:
      return <TapeHissPage ring={ring} />
    case VAULT:
      return <VaultPage ring={ring} onGo={onGo} />
    case RING_LIST:
      return <RingListPage onGo={onGo} />
    default:
      return <ErrorPage url={url} onGo={onGo} />
  }
}

function RingBar({ onRing, onRandom, onList }: { onRing: (d: number) => void; onRandom: () => void; onList: () => void }) {
  return (
    <div className={styles.webring}>
      <div className={styles.webringHead}>:: The Underground Noise Webring ::</div>
      <div className={styles.webringNav}>
        <button type="button" className={styles.ringlink} onClick={() => onRing(-1)}>&lt;&lt; prev</button>
        <button type="button" className={styles.ringlink} onClick={onRandom}>[ random ]</button>
        <button type="button" className={styles.ringlink} onClick={onList}>[ list ]</button>
        <button type="button" className={styles.ringlink} onClick={() => onRing(1)}>next &gt;&gt;</button>
      </div>
      <div className={styles.webringFoot}>site 14 of 39 · est. 2003</div>
    </div>
  )
}

function HomePage({ ring }: { ring: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.banner}><span className={styles.bannerText}>★ moldmouth's corner of the web ★</span></div>
      <div className={styles.underConstruction}>🚧 always under construction 🚧</div>
      <p className={styles.intro}>
        noise tapes, horror VHS, and whatever i'm ripping this week. mail me on AIM
        (it's in the buddy info). don't email my mom's account again.
      </p>
      {ring}
      <div className={styles.gbHead}>~ sign my guestbook ~</div>
      <div className={styles.gbForm}>
        <label>handle: <span className={styles.field} /></label>
        <label className={styles.msgLabel}>message:<span className={`${styles.field} ${styles.fieldBig}`} /></label>
        <span className={styles.signBtn}>Sign It</span>
      </div>
      <div className={styles.gbList}>
        {GUESTBOOK.map((e, i) => (
          <div key={i} className={styles.gbEntry}>
            <div className={styles.gbMeta}><b>{e.name}</b> <span className={styles.gbDate}>— {e.date}</span></div>
            <div className={styles.gbMsg}>{e.msg}</div>
          </div>
        ))}
      </div>
      <div className={styles.counter}>
        You are visitor <span className={styles.odometer}>0&nbsp;4&nbsp;1&nbsp;2&nbsp;7</span>
      </div>
    </div>
  )
}

function RotboxPage({ ring }: { ring: ReactNode }) {
  const trades = [
    'EVIL DEAD — Palace ex-rental, big box, sleeve trashed. trade only.',
    'NEKROMANTIK — nth-gen dub, tracking lines but watchable.',
    'GUINEA PIG (full set) — SP, hi-fi. do NOT ask to buy.',
    'BASKET CASE — clamshell, tape mint. dupe; will let go.',
    'THE BURNING — TVT, faded label, plays fine.',
  ]
  return (
    <div className={`${styles.page} ${styles.rotbox}`}>
      <pre className={styles.asciiHead}>{`
   ____   ____ _______ ____   ____ _  __
  |  _ \\ / __ \\__   __|  _ \\ / __ \\ \\/ /
  | |_) | |  | | | |  | |_) | |  | \\  /
  |  _ <| |  | | | |  |  _ <| |  | /  \\
  |_| \\_\\\\____/  |_|  |_| \\_\\\\____/_/\\_\\
        h o r r o r   v h s   t r a d e r`}</pre>
      <p className={styles.plainIntro}>
        last updated 11/02/2004. i trade tapes. i do not sell tapes. lists go to lists,
        not to your PayPal. email subject must say <b>ROTBOX</b> or it's spam to me.
      </p>
      <div className={styles.tradeHead}>:: current trade list ::</div>
      <ul className={styles.tradeList}>
        {trades.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
      <p className={styles.plainNote}>
        wants: anything SOV, anything pre-cert UK, anything you taped off late-night TV
        and forgot about. surprise me.
      </p>
      {ring}
    </div>
  )
}

function TapeHissPage({ ring }: { ring: ReactNode }) {
  // Real catalog entities, factual, exact spelling (docs/03 — no new content).
  const distro = [
    { label: 'Dickcrush Records', note: 'noise / power electronics — handnumbered C30s' },
    { label: 'Shaking Dog Tapes', note: 'harsh / collage — split runs of 25' },
  ]
  const stocked = ['Dead Snakes', 'Hung Eyes', 'Soft Torture', 'Wet Jesus', 'Project Sunshine']
  return (
    <div className={`${styles.page} ${styles.tapehiss}`}>
      <div className={styles.banner2}>·· TAPE HISS distro ··</div>
      <p className={styles.plainIntro}>
        a one-person mailorder. cash, hidden, in an envelope. no stamps as payment.
        trade list and distro list are different lists, do not combine them.
      </p>
      <div className={styles.tradeHead}>:: labels i carry ::</div>
      <ul className={styles.tradeList}>
        {distro.map((d, i) => <li key={i}><b>{d.label}</b> — {d.note}</li>)}
      </ul>
      <div className={styles.tradeHead}>:: in stock this month ::</div>
      <ul className={styles.tradeList}>
        {stocked.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
      <p className={styles.plainNote}>postage is real and it is not free. include it.</p>
      {ring}
    </div>
  )
}

function VaultPage({ ring, onGo }: { ring: ReactNode; onGo: (u: string) => void }) {
  return (
    <div className={`${styles.page} ${styles.vault}`}>
      <div className={styles.banner2}>// VAULT 8806 — links + now playing //</div>
      <div className={styles.nowplaying}>
        ♪ now playing: a tape with no label, side B, the loud part
      </div>
      <div className={styles.tradeHead}>:: my links ::</div>
      <ul className={styles.linkList}>
        <li><button type="button" className={styles.inlink} onClick={() => onGo(HOME)}>moldmouth's corner</button></li>
        <li><button type="button" className={styles.inlink} onClick={() => onGo(ROTBOX)}>ROTBOX vhs trader</button></li>
        <li><button type="button" className={styles.inlink} onClick={() => onGo(TAPEHISS)}>TAPE HISS distro</button></li>
        <li>
          <button
            type="button"
            className={styles.inlink}
            onClick={() => onGo('http://web.archive.org/web/2004/http://www.geocities.com/')}
          >
            the old net (archive) →
          </button>
        </li>
      </ul>
      <p className={styles.plainNote}>
        dead links stay up. that's the point. if it 404s, try the archive.
      </p>
      {ring}
    </div>
  )
}

function RingListPage({ onGo }: { onGo: (u: string) => void }) {
  const members = [
    { url: HOME, name: "moldmouth's corner of the web", by: 'moldmouth' },
    { url: ROTBOX, name: 'ROTBOX — horror vhs trader', by: 'grimwax' },
    { url: TAPEHISS, name: 'TAPE HISS distro', by: '(no name given)' },
    { url: VAULT, name: 'VAULT 8806 — links + now playing', by: 'DialUpDoom' },
  ]
  return (
    <div className={styles.page}>
      <div className={styles.banner}><span className={styles.bannerText}>The Underground Noise Webring</span></div>
      <p className={styles.intro}>members, in ring order. 39 listed; the dead ones aren't shown.</p>
      <div className={styles.ringMembers}>
        {members.map((m, i) => (
          <div key={m.url} className={styles.ringMember}>
            <span className={styles.ringNum}>{String(i + 1).padStart(2, '0')}.</span>
            <button type="button" className={styles.inlink} onClick={() => onGo(m.url)}>{m.name}</button>
            <span className={styles.ringBy}>— {m.by}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorPage({ url, onGo }: { url: string; onGo: (u: string) => void }) {
  return (
    <div className={styles.errorPage}>
      <div className={styles.errorInner}>
        <div className={styles.errorTitle}>The page cannot be displayed</div>
        <p>The page you are looking for is currently unavailable. The Web site might be
          experiencing technical difficulties, or you may need to adjust your browser settings.</p>
        <hr className={styles.errorRule} />
        <p className={styles.errorSmall}>Cannot find server or DNS Error — <code>{url}</code></p>
        <ul className={styles.errorSmall}>
          <li>Click <button type="button" className={styles.inlink} onClick={() => onGo(HOME)}>Home</button> to return to a page that works.</li>
          <li>Try the <button type="button" className={styles.inlink} onClick={() => onGo('http://web.archive.org/web/*/' + url.replace(/^https?:\/\//, ''))}>archived copy</button> on the Old Net.</li>
        </ul>
        <p className={styles.errorSmall}>Internet Explorer</p>
      </div>
    </div>
  )
}
