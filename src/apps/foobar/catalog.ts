import disco from '../../../data/discography.json'
import manifest from '../../../data/audio-manifest.json'

// Joins the METADATA SPINE (discography.json) with the GENERATED audio manifest
// (audio-manifest.json) into a browsable library: label -> band -> album -> tracks.
// Audio is self-hosted on R2 (real HTML5 <audio>). Until the ingest runs, tracks
// is empty and the UI shows a ready/empty state — NO fake audio.

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  label?: string
  year?: number | null
  trackNo?: number
  durationSec?: number | null
  art?: string | null
  /** R2 URL — empty until ingest populates the manifest. */
  src?: string | null
  bandcamp?: string
}
interface SpineLabel { id: string; name: string; founded?: number; url?: string }
interface SpineBand { name: string; year?: number | null; era?: string | null; labels?: string[]; url?: string }

const spine = disco as unknown as { labels: SpineLabel[]; bands: SpineBand[] }
const audio = manifest as unknown as { tracks: Track[]; r2PublicBase?: string | null }

export const LABELS = spine.labels
export const BANDS = spine.bands
export const TRACKS: Track[] = audio.tracks ?? []
export const HAS_AUDIO = TRACKS.length > 0

export interface AlbumNode { key: string; album: string; year?: number | null; tracks: Track[] }
export interface BandNode { name: string; year?: number | null; era?: string | null; albums: AlbumNode[] }
export interface LabelNode { id: string; name: string; founded?: number; bands: BandNode[] }

const ROSTER_ID = '__roster'
const lc = (s: string) => s.toLowerCase()

// Group a band's tracks (matched by artist name) into album nodes.
function albumsForBand(name: string): AlbumNode[] {
  const byAlbum = new Map<string, AlbumNode>()
  for (const t of TRACKS) {
    if (lc(t.artist) !== lc(name)) continue
    const album = t.album || 'Unknown Album'
    let node = byAlbum.get(album)
    if (!node) {
      node = { key: `${name}|${album}`, album, year: t.year, tracks: [] }
      byAlbum.set(album, node)
    }
    node.tracks.push(t)
  }
  for (const node of byAlbum.values()) {
    node.tracks.sort((a, b) => (a.trackNo ?? 0) - (b.trackNo ?? 0))
  }
  return [...byAlbum.values()].sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.album.localeCompare(b.album))
}

/** label -> band -> album tree, including bands with no audio yet (from spine). */
export function buildLibrary(): LabelNode[] {
  const labelNodes: LabelNode[] = LABELS.map((l) => ({ id: l.id, name: l.name, founded: l.founded, bands: [] }))
  const roster: LabelNode = { id: ROSTER_ID, name: 'Unsigned / roster', bands: [] }
  const byId = new Map(labelNodes.map((l) => [l.id, l]))

  for (const b of BANDS) {
    const node: BandNode = { name: b.name, year: b.year, era: b.era, albums: albumsForBand(b.name) }
    const ids = b.labels && b.labels.length ? b.labels : [ROSTER_ID]
    for (const id of ids) (byId.get(id) ?? roster).bands.push(node)
  }

  // Tracks whose artist isn't in the spine still surface (under the label named
  // on the track, else roster).
  const known = new Set(BANDS.map((b) => lc(b.name)))
  const orphanByArtist = new Map<string, Track[]>()
  for (const t of TRACKS) {
    if (known.has(lc(t.artist))) continue
    const arr = orphanByArtist.get(t.artist) ?? []
    arr.push(t)
    orphanByArtist.set(t.artist, arr)
  }
  for (const [artist] of orphanByArtist) {
    const labelName = TRACKS.find((t) => t.artist === artist)?.label
    const target = labelNodes.find((l) => labelName && lc(l.name) === lc(labelName)) ?? roster
    target.bands.push({ name: artist, albums: albumsForBand(artist) })
  }

  // Always show the real labels (founding-year facts) even before bands are
  // mapped to them; the roster only appears when it holds bands.
  const all = [...labelNodes, ...(roster.bands.length ? [roster] : [])]
  for (const l of all) l.bands.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.name.localeCompare(b.name))
  return all
}

export const fmtTime = (sec?: number | null) => {
  if (sec == null) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
