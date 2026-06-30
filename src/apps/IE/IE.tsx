import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppProps } from '../../os/types'
import styles from './IE.module.css'

// Internet Explorer — a real little browser over a STATIC in-world web. Back/
// Forward/Home walk a history stack; the Underground Noise Webring's prev/next/
// random/list actually cycle its member sites. The address bar is live: an
// allowlisted archive.org URL opens "Old Net" mode (a sandboxed read-only
// iframe — the only thing that touches the network, and only that one host);
// anything else resolves to an in-world page or an XP "cannot be displayed"
// error. No open proxy. All site content is fictional/in-voice (docs/03); the
// realtime guestbook stays Phase 6. (Owner ruling E, docs/08.)

const HOME = 'http://www.geocities.com/sunsetstrip/basement/4127/'
const ROTBOX = 'http://www.angelfire.com/oh/rotbox/'
const TAPEHISS = 'http://members.tripod.com/~tapehiss/'
const VAULT = 'http://www.geocities.com/area51/vault/8806/'
const RING_LIST = 'about:ring'

// The ring proper — ordered; prev/next wrap around it.
const RING: string[] = [HOME, ROTBOX, TAPEHISS, VAULT]

// archive.org is the single allowlisted live host ("Old Net" read-only mode).
function archiveTarget(raw: string): string | null {
  const url = raw.trim()
  const m = url.match(/^(?:https?:\/\/)?(web\.archive\.org|archive\.org)(\/.*)?$/i)
  if (!m) return null
  return `https://${m[1]}${m[2] ?? ''}`
}

function normalize(raw: string): string {
  let u = raw.trim()
  if (!u) return HOME
  if (u === RING_LIST) return u
  // Bare host/path → assume http:// (period-accurate; we don't force https).
  if (!/^[a-z]+:\/\//i.test(u) && !/^about:/i.test(u)) u = 'http://' + u
  return u.replace(/\s+$/, '')
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
  const stopRef = useRef(false)

  const url = history[idx]
  const canBack = idx > 0
  const canFwd = idx < history.length - 1

  function go(raw: string) {
    const next = normalize(raw)
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
    setIdx(idx - 1)
    setAddr(history[idx - 1])
  }
  function forward() {
    if (!canFwd) return
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
    // Deterministic-ish spread without Math.random (banned in some contexts):
    // hop a prime stride from the current spot so it never lands on itself.
    const base = ringIndex < 0 ? 0 : ringIndex
    go(RING[(base + 3) % RING.length])
  }

  const archive = useMemo(() => archiveTarget(url), [url])

  return (
    <div className={styles.ie}>
      <div className={styles.menubar}>
        <span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span>
      </div>
      <div className={styles.toolbar}>
        <button type="button" className={styles.tbtn} disabled={!canBack} onClick={back}>◄ Back</button>
        <button type="button" className={styles.tbtn} disabled={!canFwd} onClick={forward}>Forward ►</button>
        <button type="button" className={styles.tbtn} onClick={() => { stopRef.current = true }}>✕ Stop</button>
        <button type="button" className={styles.tbtn} onClick={() => setNonce((n) => n + 1)}>↻ Refresh</button>
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

      <div className={styles.viewport} key={`${url}#${nonce}`}>
        {archive ? (
          <OldNet src={archive} />
        ) : (
          <Page url={url} onRing={ringStep} onRandom={ringRandom} onList={() => go(RING_LIST)} onGo={go} />
        )}
      </div>
    </div>
  )
}

// ── Old Net (archive.org, read-only, sandboxed) ───────────────────────────────
function OldNet({ src }: { src: string }) {
  return (
    <div className={styles.oldnet}>
      <div className={styles.oldnetBar}>
        🕸 Old Net · viewing an archived page (read-only) · {src.replace(/^https:\/\//, '')}
      </div>
      <iframe
        className={styles.oldnetFrame}
        src={src}
        title="Old Net archived page"
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer"
      />
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
