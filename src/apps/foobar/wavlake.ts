import type { LibrarySource, Track, LabelNode, BandNode, AlbumNode } from './catalog'

// Wavlake library source (docs/11 §2.2) — a second LibrarySource that streams
// value-4-value music from Wavlake, rendered IDENTICALLY in foobar's tree /
// columns / transport. Uses Wavlake's public HTTP catalog API (no key, no
// wallet); the reference for the streaming/browse model is derekross/zaptrax
// (MIT, credited in CREDITS.md). NO zaps / charts / tips this pass. Any network
// failure degrades to an empty tree — foobar keeps working.

const API = 'https://wavlake.com/api/v1'
const SOURCE_ID = 'wavlake'

// Wavlake track shape (tolerant — only the fields we use, all optional so a
// slightly different response still parses into whatever is present).
interface WvTrack {
  id: string
  title?: string
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
    title: w.title ?? 'Untitled',
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

// Group Wavlake tracks into artist → release → track, under one library-name
// wrapper node so it slots into the label → band → album → track tree unchanged.
function buildTree(tracks: Track[], wrapperName: string): LabelNode[] {
  if (!tracks.length) return []
  const byArtist = new Map<string, BandNode>()
  for (const t of tracks) {
    let band = byArtist.get(t.artist)
    if (!band) { band = { name: t.artist, albums: [] }; byArtist.set(t.artist, band) }
    let album = band.albums.find((a) => a.album === t.album)
    if (!album) {
      const node: AlbumNode = { key: `wv|${t.artist}|${t.album}`, album: t.album, year: t.year, tracks: [] }
      band.albums.push(node)
      album = node
    }
    album.tracks.push(t)
  }
  for (const band of byArtist.values()) {
    band.albums.sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.album.localeCompare(b.album))
    for (const al of band.albums) al.tracks.sort((a, b) => (a.trackNo ?? 0) - (b.trackNo ?? 0))
  }
  const wrapper: LabelNode = {
    id: 'wavlake-trending',
    name: wrapperName,
    bands: [...byArtist.values()].sort((a, b) => a.name.localeCompare(b.name)),
  }
  return [wrapper]
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`wavlake ${res.status}`)
  return res.json()
}

// Normalize the various array-ish response shapes the API may return.
function asArray(json: unknown): WvTrack[] {
  if (Array.isArray(json)) return json as WvTrack[]
  const obj = json as { data?: WvTrack[]; tracks?: WvTrack[]; content?: WvTrack[] }
  return obj.data ?? obj.tracks ?? obj.content ?? []
}

export const wavlakeSource: LibrarySource = {
  id: SOURCE_ID,
  label: 'Wavlake',

  // Seed the browsable library from Wavlake's trending rankings — a populated
  // "here's music on Wavlake" listening room with real stream URLs. Any failure
  // (offline, CORS, shape change) throws → foobar shows the graceful empty state.
  async getTree() {
    const json = await fetchJson(`${API}/content/rankings?sort=sats&days=30&limit=80`)
    const tracks = asArray(json).filter((w) => w && w.id).map(toTrack).filter((t) => t.title)
    return buildTree(tracks, 'Trending on Wavlake')
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
