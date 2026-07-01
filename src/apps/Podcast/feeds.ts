import opmlRaw from '../../../data/podcasts.opml?raw'

// Podcast feed layer (docs/11 §3). Parses the seeded OPML subscription list,
// fetches each feed's XML (direct where CORS allows, else a read-only proxy —
// incl. the Browser's Old-Net seam), and turns it into shows → episodes for the
// shared transport.
//
// Parsing uses the browser-native DOMParser (zero deps). We originally wired
// @podverse/podcast-feed-parser (ISC) per docs/11 §3.1, but it pulls
// xml2js → sax, which reference Node's stream/events/timers; Vite externalizes
// those to stubs that throw at module-eval, crashing the app chunk. DOMParser is
// the daedalOS-style native path and is fully browser-safe. (docs/11 §3.1
// explicitly allows the parser choice; the credit is dropped since none ships.)

export interface Show {
  title: string
  feedUrl: string
}
export interface Episode {
  id: string
  title: string
  date?: number
  durationSec?: number | null
  notes?: string
  art?: string | null
  enclosure: string
}
export interface FeedResult {
  title: string
  art?: string | null
  episodes: Episode[]
}

// ── Subscriptions (from the seeded OPML) ────────────────────────────────────
export function loadSubscriptions(): Show[] {
  try {
    const doc = new DOMParser().parseFromString(opmlRaw, 'text/xml')
    const outlines = [...doc.querySelectorAll('outline[xmlUrl]')]
    const shows = outlines.map((o) => ({
      title: o.getAttribute('title') || o.getAttribute('text') || o.getAttribute('xmlUrl') || 'Untitled',
      feedUrl: o.getAttribute('xmlUrl') as string,
    }))
    return shows.sort((a, b) => a.title.localeCompare(b.title))
  } catch {
    return []
  }
}

// ── Feed fetch (CORS strategy, docs/11 §3.2) ────────────────────────────────
// Read-only GET proxies for feeds whose host blocks cross-origin: a couple of
// public CORS relays plus the Browser's sanctioned Old-Net seam. Episode audio
// (the enclosure) streams fine cross-origin from the <audio> element regardless.
const PROXIES: ((u: string) => string)[] = [
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
  (u) => `https://theoldnet.com/get?url=${encodeURIComponent(u)}`,
]

const looksLikeFeed = (t: string) => /<rss|<feed|<\?xml/i.test(t.slice(0, 500))

async function fetchFeedXml(url: string): Promise<string> {
  // 1. Direct (works for hosts that send permissive CORS).
  try {
    const r = await fetch(url, { headers: { accept: 'application/rss+xml, application/xml, text/xml' } })
    if (r.ok) {
      const t = await r.text()
      if (looksLikeFeed(t)) return t
    }
  } catch { /* fall through to proxies */ }
  // 2. Read-only proxies, first that returns feed-looking XML.
  for (const proxy of PROXIES) {
    try {
      const r = await fetch(proxy(url))
      if (!r.ok) continue
      const t = await r.text()
      if (looksLikeFeed(t)) return t
    } catch { /* try next */ }
  }
  throw new Error('feed unreachable')
}

// ── Parsing ─────────────────────────────────────────────────────────────────
const stripHtml = (html: string): string => {
  try {
    return (new DOMParser().parseFromString(html, 'text/html').body.textContent || '').trim()
  } catch {
    return html.replace(/<[^>]+>/g, '').trim()
  }
}

// "HH:MM:SS" / "MM:SS" / seconds → seconds.
function parseDuration(v: string | number | undefined | null): number | null {
  if (v == null) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (/^\d+$/.test(v.trim())) return Number(v)
  const parts = v.split(':').map(Number)
  if (parts.some((n) => Number.isNaN(n))) return null
  return parts.reduce((acc, n) => acc * 60 + n, 0)
}

// Native RSS/Atom parse (browser DOMParser, zero deps).
function mapNative(xml: string): FeedResult {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const first = (parent: Element | Document, tag: string) => parent.getElementsByTagName(tag)[0]?.textContent?.trim() || ''
  const channel = doc.querySelector('channel') || doc.documentElement
  const chImage =
    channel.getElementsByTagName('itunes:image')[0]?.getAttribute('href') ||
    doc.querySelector('channel > image > url')?.textContent ||
    null
  const items = [...doc.querySelectorAll('item, entry')]
  const episodes: Episode[] = items
    .map((it) => {
      const enc =
        it.querySelector('enclosure')?.getAttribute('url') ||
        it.querySelector('link[href]')?.getAttribute('href') ||
        ''
      const art = it.getElementsByTagName('itunes:image')[0]?.getAttribute('href') || chImage
      const dur = it.getElementsByTagName('itunes:duration')[0]?.textContent
      const notesRaw =
        it.getElementsByTagName('content:encoded')[0]?.textContent ||
        first(it, 'description') ||
        it.getElementsByTagName('itunes:summary')[0]?.textContent ||
        ''
      return {
        id: first(it, 'guid') || enc || first(it, 'title'),
        title: first(it, 'title') || 'Untitled',
        date: Date.parse(first(it, 'pubDate') || first(it, 'published') || '') || undefined,
        durationSec: parseDuration(dur),
        notes: stripHtml(notesRaw),
        art,
        enclosure: enc,
      }
    })
    .filter((e) => e.enclosure)
  return { title: first(channel, 'title') || 'Podcast', art: chImage, episodes }
}

export async function loadShow(feedUrl: string): Promise<FeedResult> {
  const xml = await fetchFeedXml(feedUrl)
  return mapNative(xml)
}
