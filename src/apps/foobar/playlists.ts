import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Track } from './catalog'

// Multiple named, tabbed playlists (docs/11 §2.3). Tracks are stored
// denormalized (the whole Track object) so a playlist survives reload even if
// its source library (Discography R2, Wavlake relay) is offline. Persisted to
// localStorage under 'hmd.foobar'.

export interface Playlist {
  id: string
  name: string
  tracks: Track[]
}

interface PlaylistState {
  playlists: Playlist[]
  activeId: string
  addPlaylist: () => void
  removePlaylist: (id: string) => void
  renamePlaylist: (id: string, name: string) => void
  setActive: (id: string) => void
  /** Append tracks to a playlist, de-duped by track id. Returns the # added. */
  addTracks: (id: string, tracks: Track[]) => number
  removeTracks: (id: string, trackIds: string[]) => void
  clearPlaylist: (id: string) => void
}

let seq = 0
const newId = () => `pl-${Date.now().toString(36)}-${seq++}`

function firstPlaylist(): Playlist {
  return { id: newId(), name: 'Default', tracks: [] }
}

export const usePlaylists = create<PlaylistState>()(
  persist(
    (set) => {
      const initial = firstPlaylist()
      return {
        playlists: [initial],
        activeId: initial.id,

        addPlaylist: () =>
          set((s) => {
            const n = s.playlists.filter((p) => /^New Playlist/.test(p.name)).length
            const pl: Playlist = { id: newId(), name: n ? `New Playlist ${n + 1}` : 'New Playlist', tracks: [] }
            return { playlists: [...s.playlists, pl], activeId: pl.id }
          }),

        removePlaylist: (id) =>
          set((s) => {
            if (s.playlists.length <= 1) return s // always keep one
            const playlists = s.playlists.filter((p) => p.id !== id)
            const activeId = s.activeId === id ? playlists[0].id : s.activeId
            return { playlists, activeId }
          }),

        renamePlaylist: (id, rawName) =>
          set((s) => {
            const name = rawName.trim()
            if (!name) return s
            return { playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)) }
          }),

        setActive: (id) => set((s) => (s.playlists.some((p) => p.id === id) ? { activeId: id } : s)),

        addTracks: (id, tracks) => {
          let added = 0
          set((s) => ({
            playlists: s.playlists.map((p) => {
              if (p.id !== id) return p
              const have = new Set(p.tracks.map((t) => t.id))
              const fresh = tracks.filter((t) => !have.has(t.id))
              added = fresh.length
              return fresh.length ? { ...p, tracks: [...p.tracks, ...fresh] } : p
            }),
          }))
          return added
        },

        removeTracks: (id, trackIds) => {
          const drop = new Set(trackIds)
          set((s) => ({
            playlists: s.playlists.map((p) =>
              p.id === id ? { ...p, tracks: p.tracks.filter((t) => !drop.has(t.id)) } : p,
            ),
          }))
        },

        clearPlaylist: (id) =>
          set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...p, tracks: [] } : p)) })),
      }
    },
    {
      name: 'hmd.foobar',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ playlists: s.playlists, activeId: s.activeId }),
    },
  ),
)
