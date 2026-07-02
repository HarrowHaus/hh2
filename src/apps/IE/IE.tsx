import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppProps } from '../../os/types'
import styles from './IE.module.css'
import { FOLDERS, JOKE_FOLDER, SEARCH_ENGINES, WEBRING_URL, type Folder, type Link as Bmk } from './bookmarks'
import disco from '../../../data/discography.json'

// Internet Explorer — a REAL browser, ported/adapted from DustinBrett/daedalOS's
// Browser app (MIT — CREDITS.md): his integration code over standard web APIs,
// reimplemented on our React/Zustand/CSS-modules stack. Loads real sites in a
// sandboxed iframe (CORS), with his proxy model — the Wayback Machine and The
// Old Net (per year) — as our approved read-only / no-open-proxy path (his
// allOrigins open-proxy mode is intentionally dropped, owner ruling E). Plus
// back/forward/reload/stop history, a bookmark bar with real favicons, address-
// bar search, ipfs:// via a gateway, and chrome://dino. The default start page
// is a plain, period-plausible personal portal (docs/14 §1) — the Underground
// Noise Webring is demoted to a bookmark you reach by digging, no longer the
// homepage. Our curated in-world pages are rendered locally; the rest of the
// web is live. No prop shell.

// ── In-world pages (our content, kept) ───────────────────────────────────────
const HOME = 'http://www.geocities.com/sunsetstrip/basement/4127/'
const ROTBOX = 'http://www.angelfire.com/oh/rotbox/'
const TAPEHISS = 'http://members.tripod.com/~tapehiss/'
const VAULT = 'http://www.geocities.com/area51/vault/8806/'
const RING_LIST = WEBRING_URL // 'about:ring' — the demoted webring, now a bookmark
const DINO = 'chrome://dino'
// Default start page: a personalized portal (docs/14 §1), NOT the webring.
const PORTAL = 'about:start'
const RING: string[] = [HOME, ROTBOX, TAPEHISS, VAULT]
const IN_WORLD = new Set<string>([PORTAL, HOME, ROTBOX, TAPEHISS, VAULT, RING_LIST])

// An IPFS gateway. Address-bar search runs through the selectable weird-web
// engine (Wiby/Marginalia/FrogFind, docs/14 §2) — see SEARCH_ENGINES.
const IPFS_GATEWAY = 'https://dweb.link/ipfs/'

// His Old Net supported years + proxy endpoints.
const OLD_NET_YEARS = [1996, 1998, 2000, 2002, 2004, 2006, 2008, 2010, 2012]
const OLD_NET_PROXY = (year: number, url: string) =>
  `https://theoldnet.com/get?scripts=true&decode=true&year=${year}&url=${url}`
const WAYBACK_AVAILABLE = 'https://archive.org/wayback/available?url='

type ProxyMode = 'CORS' | 'WAYBACK' | 'OLDNET'
interface Proxy { mode: ProxyMode; year: number }

// Resolve a raw address-bar entry → a target URL (his getUrlOrSearch logic).
// A bare query routes to the selected weird-web search engine (docs/14 §2).
function resolve(raw: string, searchPrefix: string = SEARCH_ENGINES[0].search): string {
  const u = raw.trim()
  if (!u) return PORTAL
  if (u === DINO || u === RING_LIST || IN_WORLD.has(u)) return u
  if (/^ipfs:\/\//i.test(u)) return IPFS_GATEWAY + u.replace(/^ipfs:\/\//i, '')
  if (/^https?:\/\//i.test(u)) return u.replace(/\s+$/, '')
  if (/^[^\s]+\.[^\s]+$/.test(u) && !u.includes(' ')) return 'http://' + u
  return searchPrefix + encodeURIComponent(u)
}
function kindOf(url: string): 'dino' | 'inworld' | 'external' {
  if (url === DINO) return 'dino'
  if (url === RING_LIST || IN_WORLD.has(url)) return 'inworld'
  return 'external'
}

// His PROXIES, minus the open-proxy mode. Returns the iframe src for a URL.
async function proxiedSrc(url: string, proxy: Proxy): Promise<string> {
  if (proxy.mode === 'OLDNET') return OLD_NET_PROXY(proxy.year, url)
  if (proxy.mode === 'WAYBACK') {
    try {
      const r = await fetch(WAYBACK_AVAILABLE + encodeURIComponent(url))
      const j = (await r.json()) as { archived_snapshots?: { closest?: { url?: string } } }
      let snap = j?.archived_snapshots?.closest?.url
      if (snap) {
        if (snap.startsWith('http:') && window.location.protocol === 'https:') snap = snap.replace('http:', 'https:')
        return snap
      }
    } catch { /* fall through to direct */ }
    return url
  }
  return url // CORS: load directly
}

// ── Navigation icons (re-expressed from his NavigationIcons, MIT) ─────────────
const Arrow = memo(({ dir }: { dir: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" style={dir === 'right' ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </svg>
))
const Refresh = memo(() => (
  <svg viewBox="0 0 24 24" aria-hidden><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" /></svg>
))
const Stop = memo(() => (
  <svg viewBox="0 0 24 24" aria-hidden><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
))

export function IE({ args }: AppProps) {
  const initial = typeof args?.url === 'string' ? resolve(args.url) : PORTAL
  const [history, setHistory] = useState<string[]>([initial])
  const [pos, setPos] = useState(0)
  const [addr, setAddr] = useState(initial)
  const [proxy, setProxy] = useState<Proxy>({ mode: 'CORS', year: 2004 })
  const [engine, setEngine] = useState(SEARCH_ENGINES[0].id)
  const [loading, setLoading] = useState(false)
  const [iframeSrc, setIframeSrc] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const searchPrefix = (SEARCH_ENGINES.find((e) => e.id === engine) ?? SEARCH_ENGINES[0]).search

  const url = history[pos]
  const kind = kindOf(url)
  const canBack = pos > 0
  const canFwd = pos < history.length - 1

  function go(raw: string) {
    const next = resolve(raw, searchPrefix)
    setAddr(next)
    if (next === url) { reload(); return }
    const trimmed = history.slice(0, pos + 1)
    trimmed.push(next)
    setHistory(trimmed)
    setPos(trimmed.length - 1)
  }
  // Open a bookmark. Archived entries (dead / hijacked / broken-TLS) load through
  // the read-only Wayback proxy so no dead link ever renders (docs/14 §5).
  function openBookmark(b: Bmk) {
    if (b.archive) setProxy((p) => ({ ...p, mode: 'WAYBACK' }))
    else if (!IN_WORLD.has(b.url)) setProxy((p) => (p.mode === 'WAYBACK' ? { ...p, mode: 'CORS' } : p))
    go(b.url)
  }
  function move(step: number) {
    const p = pos + step
    if (p < 0 || p >= history.length) return
    setPos(p)
    setAddr(history[p])
  }
  function reload() {
    if (kind === 'external') {
      setLoading(true)
      // Re-assign src to force a reload.
      const cur = iframeSrc
      setIframeSrc('')
      requestAnimationFrame(() => setIframeSrc(cur))
    }
  }
  function stop() {
    setLoading(false)
    if (iframeRef.current) iframeRef.current.src = 'about:blank'
  }

  // Ring navigation over our in-world members.
  const ringIndex = RING.indexOf(url)
  const ringStep = (d: number) => go(RING[((ringIndex < 0 ? 0 : ringIndex) + d + RING.length) % RING.length])
  const ringRandom = () => go(RING[((ringIndex < 0 ? 0 : ringIndex) + 3) % RING.length])

  // Compute the iframe src (with proxy) whenever an external URL or proxy changes.
  useEffect(() => {
    if (kind !== 'external') { setIframeSrc(''); return }
    let alive = true
    setLoading(true)
    void proxiedSrc(url, proxy).then((src) => { if (alive) setIframeSrc(src) })
    return () => { alive = false }
  }, [url, kind, proxy])

  return (
    <div className={styles.ie}>
      <div className={styles.menubar}>
        <span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span>
      </div>
      <nav className={styles.toolbar}>
        <button type="button" className={styles.navbtn} disabled={!canBack} onClick={() => move(-1)} title="Back"><Arrow dir="left" /></button>
        <button type="button" className={styles.navbtn} disabled={!canFwd} onClick={() => move(1)} title="Forward"><Arrow dir="right" /></button>
        <button type="button" className={styles.navbtn} onClick={() => (loading ? stop() : reload())} title={loading ? 'Stop' : 'Reload'}>
          {loading ? <Stop /> : <Refresh />}
        </button>
        <button type="button" className={styles.navbtn} onClick={() => go(PORTAL)} title="Home">⌂</button>
        <form className={styles.address} onSubmit={(e) => { e.preventDefault(); go(addr) }}>
          <input
            className={styles.addressbox}
            value={addr}
            spellCheck={false}
            onChange={(e) => setAddr(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Address"
          />
          <button type="submit" className={styles.go}>Go</button>
        </form>
        {/* Weird-web search engine (docs/14 §2): Wiby / Marginalia / FrogFind */}
        <select
          className={styles.proxy}
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
          title="Search engine"
        >
          {SEARCH_ENGINES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {/* Proxy menu (his model): CORS / Wayback / Old Net by year */}
        <select
          className={styles.proxy}
          value={proxy.mode}
          onChange={(e) => setProxy((p) => ({ ...p, mode: e.target.value as ProxyMode }))}
          title="Proxy: how off-site pages load"
        >
          <option value="CORS">Live (CORS)</option>
          <option value="WAYBACK">Wayback Machine</option>
          <option value="OLDNET">The Old Net</option>
        </select>
        {proxy.mode === 'OLDNET' && (
          <select
            className={styles.proxy}
            value={proxy.year}
            onChange={(e) => setProxy((p) => ({ ...p, year: Number(e.target.value) }))}
            title="Old Net year"
          >
            {OLD_NET_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </nav>

      {/* Bookmark bar — §3 category folders; the §4 joke folder set apart at the end */}
      <div className={styles.bookmarks}>
        <span className={styles.bmLabel}>Links</span>
        {FOLDERS.map((f) => (
          <BookmarkFolder key={f.name} folder={f} onOpen={openBookmark} />
        ))}
        <span className={styles.bmSpacer} />
        <BookmarkFolder folder={JOKE_FOLDER} onOpen={openBookmark} />
      </div>

      <div className={styles.viewport}>
        {kind === 'dino' ? (
          <DinoGame />
        ) : kind === 'inworld' ? (
          <InWorldPage url={url} onRing={ringStep} onRandom={ringRandom} onList={() => go(RING_LIST)} onGo={go} />
        ) : (
          <iframe
            ref={iframeRef}
            className={styles.frame}
            src={iframeSrc || 'about:blank'}
            title="Internet Explorer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            onLoad={() => setLoading(false)}
          />
        )}
        {loading && kind === 'external' && <div className={styles.loadbar} />}
      </div>
    </div>
  )
}

// Bookmark favicon: real sites pull /favicon.ico (fallback to a globe); in-world
// entries use an original glyph.
function Favicon({ url, glyph }: { url: string; glyph?: string }) {
  const [failed, setFailed] = useState(false)
  const origin = useMemo(() => { try { return new URL(url).origin } catch { return '' } }, [url])
  if (glyph) return <span className={styles.favicon} aria-hidden>{glyph}</span>
  if (!origin || failed) return <span className={styles.favicon} aria-hidden>🌐</span>
  return <img className={styles.faviconImg} src={`${origin}/favicon.ico`} alt="" onError={() => setFailed(true)} />
}

// A Favorites folder in the bookmark bar: a click-to-open dropdown of links, with
// real favicons. Nothing auto-loads — the §4 joke folder opens on purpose only.
function BookmarkFolder({ folder, onOpen }: { folder: Folder; onOpen: (b: Bmk) => void }) {
  const [menu, setMenu] = useState<{ left: number; top: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  // Position the menu with fixed coords from the button — the bookmark bar has
  // overflow-x:auto, which would otherwise clip an absolutely-positioned child.
  function toggle() {
    if (menu) { setMenu(null); return }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setMenu({ left: r.left, top: r.bottom })
  }
  const open = menu !== null
  return (
    <span
      className={`${styles.folder} ${folder.joke ? styles.folderJoke : ''}`}
      onMouseLeave={() => setMenu(null)}
    >
      <button
        ref={btnRef}
        type="button"
        className={styles.folderBtn}
        onClick={toggle}
        title={folder.joke ? 'you were warned' : folder.stratum ? `stratum ${folder.stratum}` : folder.name}
      >
        <span className={styles.folderIcon} aria-hidden>{folder.joke ? '🙈' : '📁'}</span>
        {folder.name}
        {folder.stratum && !folder.joke && <span className={styles.folderStratum}>{folder.stratum}</span>}
      </button>
      {open && (
        <div className={styles.folderMenu} style={{ left: menu.left, top: menu.top }}>
          {folder.links.map((b) => (
            <button
              key={b.url}
              type="button"
              className={styles.folderItem}
              onClick={() => { onOpen(b); setMenu(null) }}
              title={b.archive ? `${b.url} — via Wayback (archived)` : b.url}
            >
              <Favicon url={b.url} />
              <span className={styles.folderItemName}>{b.name}</span>
              {b.archive && <span className={styles.folderArchive}>archived</span>}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}

// ── In-world pages (kept verbatim from our content) ──────────────────────────
function InWorldPage({
  url, onRing, onRandom, onList, onGo,
}: {
  url: string
  onRing: (d: number) => void
  onRandom: () => void
  onList: () => void
  onGo: (u: string) => void
}) {
  const ring = <RingBar onRing={onRing} onRandom={onRandom} onList={onList} />
  switch (url) {
    case PORTAL: return <PortalPage onGo={onGo} />
    case HOME: return <HomePage ring={ring} />
    case ROTBOX: return <RotboxPage ring={ring} />
    case TAPEHISS: return <TapeHissPage ring={ring} />
    case VAULT: return <VaultPage ring={ring} onGo={onGo} />
    case RING_LIST: return <RingListPage onGo={onGo} />
    default: return <PortalPage onGo={onGo} />
  }
}

// ── Default start page: a personalized portal (docs/14 §1) ───────────────────
// A parody of an early-2000s My Yahoo!/iGoogle personalized homepage, skinned in
// the dark bug.msstyles palette. Every box is filled with Bug's own content —
// that IS the parody. Modules render from real repo data where possible and are
// period-static otherwise. No meta-narrative; it never explains itself (Rule 2).

// Module 6 — a rotating "transmission of the day" in Bug's voice (owner edits
// these later). Chosen by day so it's stable within a day, no randomness/API.
const TRANSMISSIONS = [
  'dubbed three tapes before coffee. the deck is winning.',
  'if it hisses, it\'s honest.',
  'reminder: postage is real and it is not free. include it.',
  'the good stuff never had a barcode.',
  'slept four hours, ripped a whole discography. worth it.',
  'trust the tape, not the tracklist.',
  'everything worth hearing is out of print.',
  'found a sealed clamshell in a box lot. today is good.',
  'the recommendation engine has never once been right about me.',
  'back up your floppies. i am begging you.',
]

// Module 4 — "what I'm reading": a curated static list (no backend / no live
// fetch), drawn from the §3 weird-knowledge vein. Owner edits later.
const HEADLINES: { url: string; blurb: string }[] = [
  { url: 'https://www.damninteresting.com/', blurb: 'Damn Interesting — the one about the radium girls, again' },
  { url: 'https://lostmediawiki.com/', blurb: 'Lost Media Wiki — a kids\' show nobody can find a tape of' },
  { url: 'https://www.forteantimes.com/', blurb: 'Fortean Times — falls of frogs, this month' },
  { url: 'https://scp-wiki.wikidot.com/', blurb: 'SCP — reading the ones marked "keter" at 3am' },
  { url: 'https://publicdomainreview.org/', blurb: 'Public Domain Review — 1890s medical illustration' },
]

// Module 5 — Quick Links: a handful of §3 bookmarks surfaced as tiles.
const QUICK_LINKS: { url: string; name: string }[] = [
  { url: 'http://textfiles.com/', name: 'textfiles' },
  { url: 'https://www.metal-archives.com/', name: 'Metallum' },
  { url: 'https://www.bleedingskull.com/', name: 'Bleeding Skull' },
  { url: 'https://everything2.com/', name: 'Everything2' },
  { url: 'https://wiby.me/', name: 'Wiby' },
  { url: 'https://tcrf.net/', name: 'TCRF' },
]

function PortalModule({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`${styles.module} ${className ?? ''}`}>
      <div className={styles.moduleHead}>{title}</div>
      <div className={styles.moduleBody}>{children}</div>
    </section>
  )
}

function PortalPage({ onGo }: { onGo: (u: string) => void }) {
  const [q, setQ] = useState('')
  const [eng, setEng] = useState(SEARCH_ENGINES[0].id)
  const now = useMemo(() => new Date(), [])

  // Module 2 — read the real catalog (data/discography.json).
  const labels = (disco.labels as { name: string }[]).map((l) => l.name)
  const bands = disco.bands as { name: string }[]
  const recentPicks = ['Dead Snakes', 'Hung Eyes', 'Soft Torture', 'Project Sunshine', 'Wet Jesus']
  const recently = recentPicks.filter((n) => bands.some((b) => b.name === n))

  const dateLine = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const transmission = TRANSMISSIONS[
    Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000) % TRANSMISSIONS.length
  ]

  function runSearch() {
    const s = (SEARCH_ENGINES.find((e) => e.id === eng) ?? SEARCH_ENGINES[0]).search
    if (q.trim()) onGo(s + encodeURIComponent(q.trim()))
  }

  return (
    <div className={styles.portal}>
      <div className={styles.portalHeader}>
        <span className={styles.portalGreet}>welcome back, bug</span>
        <span className={styles.portalDate}>{dateLine}</span>
      </div>

      {/* Module 1 — search bar (Wiby / Marginalia / FrogFind) */}
      <form className={styles.portalSearch} onSubmit={(e) => { e.preventDefault(); runSearch() }}>
        <select className={styles.portalEngine} value={eng} onChange={(e) => setEng(e.target.value)} aria-label="Search engine">
          {SEARCH_ENGINES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input
          className={styles.portalInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search"
          spellCheck={false}
          aria-label="Search"
        />
        <button type="submit" className={styles.portalGo}>go</button>
      </form>

      <div className={styles.portalGrid}>
        {/* Module 2 — Now Playing / Recently Played */}
        <PortalModule title="now playing">
          <div className={styles.nowPlaying}>
            <span className={styles.npMark}>▶</span>
            <span><b>moldmouth</b> — untitled (side B)</span>
          </div>
          <div className={styles.moduleSub}>recently played</div>
          <ul className={styles.tightList}>
            {recently.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <div className={styles.moduleSub}>labels</div>
          <div className={styles.chips}>{labels.map((l) => <span key={l} className={styles.chip}>{l}</span>)}</div>
        </PortalModule>

        {/* Module 3 — Downloads (nods to the BitTorrent app) */}
        <PortalModule title="downloads">
          <DownloadRow name="basement_noise_comp_vol3_[V0].rar" pct={73} />
          <DownloadRow name="Midnight_Cassette_(1987).DVDRip-PHANTOM" pct={100} seeding />
          <DownloadRow name="Dead_Snakes-live_at_the_basement_[FLAC].zip" pct={100} seeding />
          <DownloadRow name="[StaticVoid]_Spectral_Corridor_01.mkv" pct={41} />
          <div className={styles.moduleFoot}>ratio 0.19 · seeding 2 · dl 1</div>
        </PortalModule>

        {/* Module 4 — Headlines / what I'm reading */}
        <PortalModule title="what i'm reading">
          <ul className={styles.headlines}>
            {HEADLINES.map((h) => (
              <li key={h.url}>
                <button type="button" className={styles.inlink} onClick={() => onGo(h.url)}>{h.blurb}</button>
              </li>
            ))}
          </ul>
        </PortalModule>

        {/* Module 5 — Quick Links */}
        <PortalModule title="quick links">
          <div className={styles.tiles}>
            {QUICK_LINKS.map((l) => (
              <button key={l.url} type="button" className={styles.tile} onClick={() => onGo(l.url)} title={l.url}>
                <Favicon url={l.url} />
                <span>{l.name}</span>
              </button>
            ))}
          </div>
        </PortalModule>

        {/* Module 6 — Furniture: date + weather + transmission of the day */}
        <PortalModule title="today" className={styles.moduleWide}>
          <div className={styles.weather}>
            <span className={styles.weatherTemp}>61°F</span>
            <span className={styles.weatherDesc}>overcast · basement</span>
          </div>
          <div className={styles.transmission}>“{transmission}”</div>
        </PortalModule>
      </div>
    </div>
  )
}

function DownloadRow({ name, pct, seeding }: { name: string; pct: number; seeding?: boolean }) {
  return (
    <div className={styles.dl}>
      <div className={styles.dlName} title={name}>{name}</div>
      <div className={styles.dlBar}><span style={{ width: `${pct}%` }} className={seeding ? styles.dlFillSeed : styles.dlFill} /></div>
      <div className={styles.dlPct}>{seeding ? 'seed' : `${pct}%`}</div>
    </div>
  )
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
      <ul className={styles.tradeList}>{trades.map((t, i) => <li key={i}>{t}</li>)}</ul>
      <p className={styles.plainNote}>
        wants: anything SOV, anything pre-cert UK, anything you taped off late-night TV
        and forgot about. surprise me.
      </p>
      {ring}
    </div>
  )
}

function TapeHissPage({ ring }: { ring: ReactNode }) {
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
      <ul className={styles.tradeList}>{distro.map((d, i) => <li key={i}><b>{d.label}</b> — {d.note}</li>)}</ul>
      <div className={styles.tradeHead}>:: in stock this month ::</div>
      <ul className={styles.tradeList}>{stocked.map((s, i) => <li key={i}>{s}</li>)}</ul>
      <p className={styles.plainNote}>postage is real and it is not free. include it.</p>
      {ring}
    </div>
  )
}

function VaultPage({ ring, onGo }: { ring: ReactNode; onGo: (u: string) => void }) {
  return (
    <div className={`${styles.page} ${styles.vault}`}>
      <div className={styles.banner2}>// VAULT 8806 — links + now playing //</div>
      <div className={styles.nowplaying}>♪ now playing: a tape with no label, side B, the loud part</div>
      <div className={styles.tradeHead}>:: my links ::</div>
      <ul className={styles.linkList}>
        <li><button type="button" className={styles.inlink} onClick={() => onGo(HOME)}>moldmouth's corner</button></li>
        <li><button type="button" className={styles.inlink} onClick={() => onGo(ROTBOX)}>ROTBOX vhs trader</button></li>
        <li><button type="button" className={styles.inlink} onClick={() => onGo(TAPEHISS)}>TAPE HISS distro</button></li>
        <li><button type="button" className={styles.inlink} onClick={() => onGo('https://archive.org/')}>the internet archive →</button></li>
      </ul>
      <p className={styles.plainNote}>dead links stay up. that's the point. if it 404s, switch the proxy to the Old Net.</p>
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

// ── chrome://dino — original endless runner (no Google T-Rex sprite) ──────────
function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [over, setOver] = useState(false)
  const [started, setStarted] = useState(false)
  const game = useRef({
    y: 0, vy: 0, ground: 0, obstacles: [] as { x: number; w: number; h: number }[],
    speed: 3.2, t: 0, spawn: 0, score: 0, dead: false, running: false,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const g = game.current
    g.ground = H - 22
    let raf = 0, last = 0
    function reset() { g.y = g.ground; g.vy = 0; g.obstacles = []; g.speed = 3.2; g.t = 0; g.spawn = 40; g.score = 0; g.dead = false }
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
      g.vy += 0.42 * dt; g.y += g.vy * dt
      if (g.y > g.ground) { g.y = g.ground; g.vy = 0 }
      g.spawn -= dt
      if (g.spawn <= 0) { g.obstacles.push({ x: W + 10, w: 8 + ((g.t * 3) % 8), h: 12 + ((g.t * 7) % 14) }); g.spawn = 60 + ((g.t * 13) % 50) / g.speed }
      g.speed += 0.0012 * dt
      for (const o of g.obstacles) o.x -= g.speed * dt
      g.obstacles = g.obstacles.filter((o) => o.x + o.w > -4)
      g.score += dt * 0.15
      const px = 30, pw = 18, ph = 14
      for (const o of g.obstacles) {
        if (px + pw > o.x && px < o.x + o.w && g.y > g.ground - ph - o.h + 6) {
          g.dead = true; g.running = false; setOver(true)
          setBest((b) => { const s = Math.floor(g.score); return s > b ? s : b })
        }
      }
      setScore(Math.floor(g.score))
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0a0a0e'; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, g.ground + 8); ctx.lineTo(W, g.ground + 8); ctx.stroke()
      ctx.fillStyle = '#ffd24a'
      for (const o of g.obstacles) { ctx.fillRect(o.x, g.ground + 8 - o.h, o.w, o.h); ctx.beginPath(); ctx.arc(o.x + o.w / 2, g.ground + 8 - o.h, o.w * 0.7, 0, Math.PI * 2); ctx.fill() }
      const py = g.y; ctx.fillStyle = '#d8d8e8'; const flap = Math.sin(g.t * 0.6) * 3
      ctx.beginPath()
      ctx.moveTo(px + 9, py - 7); ctx.lineTo(px - 2, py - 12 - flap); ctx.lineTo(px - 2, py - 1)
      ctx.lineTo(px + 9, py - 7); ctx.lineTo(px + 20, py - 12 - flap); ctx.lineTo(px + 20, py - 1)
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#8a7a5a'; ctx.fillRect(px + 7, py - 12, 4, 12)
    }
    function onKey(e: KeyboardEvent) { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump() } }
    reset()
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('pointerdown', jump)
    raf = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); canvas.removeEventListener('pointerdown', jump); g.running = false }
  }, [])

  return (
    <div className={styles.dinoWrap}>
      <div className={styles.dinoHud}><span>chrome://dino</span><span>HI {String(best).padStart(5, '0')}  {String(score).padStart(5, '0')}</span></div>
      <canvas ref={canvasRef} width={520} height={170} className={styles.dinoCanvas} />
      <div className={styles.dinoHint}>{over ? 'G A M E   O V E R — press space to retry' : started ? 'space / ↑ to jump' : 'press space to start'}</div>
    </div>
  )
}
