import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Podcast progress state (docs/11 §3.3): which episodes are played and where
// playback left off, persisted to localStorage 'hmd.podcast'. Keyed by episode
// id (guid/enclosure) so it survives feed re-fetches.

interface PodState {
  played: Record<string, boolean>
  resume: Record<string, number>
  markPlayed: (id: string, played?: boolean) => void
  setResume: (id: string, sec: number) => void
  clearResume: (id: string) => void
}

export const usePodcast = create<PodState>()(
  persist(
    (set) => ({
      played: {},
      resume: {},
      markPlayed: (id, played = true) =>
        set((s) => {
          const next = { ...s.played }
          if (played) next[id] = true
          else delete next[id]
          // A played episode no longer needs a resume point.
          const resume = { ...s.resume }
          if (played) delete resume[id]
          return { played: next, resume }
        }),
      setResume: (id, sec) =>
        set((s) => (sec > 5 ? { resume: { ...s.resume, [id]: sec } } : s)),
      clearResume: (id) =>
        set((s) => {
          if (!(id in s.resume)) return s
          const resume = { ...s.resume }
          delete resume[id]
          return { resume }
        }),
    }),
    { name: 'hmd.podcast', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
)
