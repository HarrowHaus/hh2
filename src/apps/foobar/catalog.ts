import disco from '../../../data/discography.json'

// Catalog adapter for foobar2000, built from the REAL data/discography.json.
//
// PLAYBACK SEAM — IMPORTANT (docs/03): real audio is intentionally NOT wired.
// Bandcamp blocks automated fetches (403), so cover art + embed/track IDs can't
// be auto-resolved. When the owner supplies Bandcamp embed IDs, fill
// `bandcampAlbumId` / `bandcampTrackId` (and `art`) below — the player already
// reads these fields and `usePlayer.load()` is the single place real playback
// drops in. Until then there is NO fake audio.

interface DiscoSource {
  id: string
  name: string
  type: string
  url: string
}
const data = disco as unknown as {
  sources: DiscoSource[]
  bands: { name: string }[]
}

export interface Track {
  id: string
  artist: string
  title: string
  /** Owning label/source name once resolved (unmapped for now). */
  label?: string
  /** SEAM: paste the Bandcamp ids here to enable real playback. */
  bandcampAlbumId?: string
  bandcampTrackId?: string
  /** SEAM: cover-art URL once resolved. */
  art?: string
  durationSec?: number
}

export const SOURCES = data.sources

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// One catalog row per act. Titles/durations/ids are unresolved by design.
export const TRACKS: Track[] = data.bands.map((b, i) => ({
  id: `${slug(b.name) || 'act'}-${i}`,
  artist: b.name,
  title: '—',
}))

export const fmtTime = (sec?: number) => {
  if (sec == null) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
