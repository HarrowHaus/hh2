import type { LibrarySource, Track, LabelNode, BandNode, AlbumNode, BrowseMode } from './catalog'

// Wavlake library source (docs/11 §2.2) — a second LibrarySource that streams
// value-4-value music from Wavlake, rendered IDENTICALLY in foobar's tree /
// columns / transport. Uses Wavlake's public HTTP catalog API (no key, no
// wallet); the reference for the streaming/browse model is derekross/zaptrax
// (MIT, credited in CREDITS.md). NO zaps / charts / tips this pass. Any network
// failure degrades to an empty tree — foobar keeps working.
//
// It's a real, navigable library, not just "trending": a search box, browse
// modes (Trending + genres), and lazy per-artist catalog drill-in on expand.

const API = 'https://wavlake.com/api/v1'
const SOURCE_ID = 'wavlake'

// Genre browse chips (Wavlake rankings accept a `genre` filter; if the API ever
// ignores it the chip still returns music, never an error).
const GENRES: { slug: string; label: string }[] = [
  { slug: 'rock', label: 'Rock' },
  { slug: 'hip-hop', label: 'Hip-Hop' },
  { slug: 'electronic', label: 'Electronic' },
  { slug: 'pop', label: 'Pop' },
  { slug: 'folk', label: 'Folk' },
  { slug: 'jazz', label: 'Jazz' },
  { slug: 'metal', label: 'Metal' },
  { slug: 'country', label: 'Country' },
  { slug: 'classical', label: 'Classical' },
  { slug: 'reggae', label: 'Reggae' },
  { slug: 'blues', label: 'Blues' },
  { slug: 'ambient', label: 'Ambient' },
]

const MODES: BrowseMode[] = [
  { id: 'trending', label: 'Trending' },
  ...GENRES.map((g) => ({ id: `genre:${g.slug}`, label: g.label })),
]

// Wavlake track shape (tolerant — only the fields we use, all optional so a
// slightly different response still parses into whatever is present).
interface WvTrack {
  id: string
  title?: string
  name?: string
  artist?: string
  artistId?: string
  albumTitle?: string
  albumId?: string
  mediaUrl?: string
  albumArtUrl?: string
  artistArtUrl?: string
  duration?: number
  releaseDate?: string
  order?: number
}

function yearOf(releaseDate?: string): number | null {
  if (!releaseDate) return null
  const y = Number(releaseDate.slice(0, 4))
  return Number.isFinite(y) && y > 0 ? y : null
}

function toTrack(w: WvTrack): Track {
  return {
    id: `wv-${w.id}`,
    title: w.title ?? w.name ?? 'Untitled',
    artist: w.artist ?? 'Unknown Artist',
    album: w.albumTitle ?? 'Singles',
    year: yearOf(w.releaseDate),
    trackNo: w.order,
    durationSec: w.duration ?? null,
    art: w.albumArtUrl ?? w.artistArtUrl ?? null,
    src: w.mediaUrl ?? null,
    sourceId: SOURCE_ID,
  }
}

// Group a track list into artist → release albums (used inside a band).
function albumsOf(tracks: Track[]): AlbumNode[] {
  const byAlbum = new Map<string, AlbumNode>()
  for (const t of tracks) {
    let al = byAlbum.get(t.album)
    if (!al) { al = { key: `wv|${t.artist}|${t.album}`, album: t.album, year: t.year, tracks: [] }; byAlbum.set(t.album, al) }
    al.tracks.push(t)
  }
  for (const al of byAlbum.values()) al.tracks.sort((a, b) => (a.trackNo ?? 0) - (b.trackNo ?? 0))
  return [...byAlbum.values()].sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.album.localeCompare(b.album))
}

// Build the artist → release → track tree under one library-name wrapper, so it
// slots into the shared label → band → album → track tree unchanged. Each band
// keeps its Wavlake artistId for lazy full-catalog drill-in on expand.
function buildTree(tracks: Track[], wrapperName: string, artistIdByName: Map<string, string>): LabelNode[] {
  if (!tracks.length) return []
  const byArtist = new Map<string, Track[]>()
  for (const t of tracks) {
    const arr = byArtist.get(t.artist) ?? []
    arr.push(t)
    byArtist.set(t.artist, arr)
  }
  const bands: BandNode[] = [...byArtist.entries()]
    .map(([name, ts]) => ({
      name,
      albums: albumsOf(ts),
      artistId: artistIdByName.get(name),
      sourceId: SOURCE_ID,
      loaded: false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return [{ id: 'wavlake-lib', name: wrapperName, bands }]
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`wavlake ${res.status}`)
  return res.json()
}

// Normalize the various array-ish response shapes the API may return.
function trackArray(json: unknown): WvTrack[] {
  if (Array.isArray(json)) return json as WvTrack[]
  const obj = json as { data?: WvTrack[]; tracks?: WvTrack[]; content?: WvTrack[] }
  return obj.data ?? obj.tracks ?? obj.content ?? []
}

// Collect an artistId-per-name map from raw items so bands can drill in later.
function artistIds(items: WvTrack[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const w of items) if (w.artist && w.artistId && !m.has(w.artist)) m.set(w.artist, w.artistId)
  return m
}

export const wavlakeSource: LibrarySource = {
  id: SOURCE_ID,
  label: 'Wavlake',
  searchable: true,
  modes: MODES,

  // A real browsable library: search runs Wavlake search; a genre mode filters
  // rankings by genre; the default is trending. Any failure throws → foobar
  // shows the graceful empty/"unavailable" state (the player keeps working).
  async getTree(opts) {
    const term = opts?.term?.trim()
    if (term) {
      const json = await fetchJson(`${API}/content/search?term=${encodeURIComponent(term)}`)
      const raw = trackArray(json).filter((w) => w && w.id)
      const tracks = raw.map(toTrack).filter((t) => t.title)
      return buildTree(tracks, `Search: “${term}”`, artistIds(raw))
    }
    const mode = opts?.mode ?? 'trending'
    const genre = mode.startsWith('genre:') ? mode.slice(6) : ''
    const label = genre ? (GENRES.find((g) => g.slug === genre)?.label ?? genre) : 'Trending on Wavlake'
    const q = new URLSearchParams({ sort: 'sats', days: '90', limit: '100' })
    if (genre) q.set('genre', genre)
    const json = await fetchJson(`${API}/content/rankings?${q.toString()}`)
    const raw = trackArray(json).filter((w) => w && w.id)
    const tracks = raw.map(toTrack).filter((t) => t.title)
    return buildTree(tracks, genre ? `${label} · Wavlake` : label, artistIds(raw))
  },

  // Lazy drill-in: fetch an artist's FULL catalog and return it as a band so the
  // tree can replace the trending stub with everything that artist has released.
  async loadArtist(artistId) {
    try {
      const json = (await fetchJson(`${API}/content/artist/${artistId}`)) as {
        name?: string
        artist?: string
        albums?: { title?: string; releaseDate?: string; tracks?: WvTrack[] }[]
        tracks?: WvTrack[]
      }
      const name = json.name ?? json.artist ?? 'Unknown Artist'
      // Tracks may hang off the artist directly or inside each album.
      const flat: WvTrack[] = []
      if (Array.isArray(json.tracks)) flat.push(...json.tracks)
      for (const al of json.albums ?? []) {
        for (const t of al.tracks ?? []) {
          flat.push({ ...t, albumTitle: t.albumTitle ?? al.title, releaseDate: t.releaseDate ?? al.releaseDate })
        }
      }
      const tracks = flat.filter((w) => w && w.id).map((w) => ({ ...toTrack(w), artist: w.artist ?? name }))
      if (!tracks.length) return null
      return { name, albums: albumsOf(tracks), artistId, sourceId: SOURCE_ID, loaded: true }
    } catch {
      return null
    }
  },

  // The mapped track already carries its mediaUrl as `src`; if a listing omitted
  // it, fetch the track detail to resolve one. Returns null → ready/empty.
  async resolveStreamUrl(track) {
    if (track.src) return track.src
    const id = track.id.replace(/^wv-/, '')
    try {
      const json = (await fetchJson(`${API}/content/track/${id}`)) as {
        mediaUrl?: string
        tracks?: { mediaUrl?: string }[]
      }
      return json.mediaUrl ?? json.tracks?.[0]?.mediaUrl ?? null
    } catch {
      return null
    }
  },
}
