import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_VISUAL_STYLE, type VisualStyle } from './themes'

// Core OS state. Phase 0 only needs the visual-style selection (persisted) and
// boot status (not persisted — every load boots). Window/FS/app state lands in
// later phases; this store is the seam they hang off of.
interface OSState {
  /** Selected visual style — persisted across sessions (docs/02 #10). */
  visualStyle: VisualStyle
  setVisualStyle: (style: VisualStyle) => void

  /** Whether the boot sequence has handed off to the desktop. Not persisted. */
  booted: boolean
  setBooted: (booted: boolean) => void
}

export const useOS = create<OSState>()(
  persist(
    (set) => ({
      visualStyle: DEFAULT_VISUAL_STYLE,
      setVisualStyle: (visualStyle) => set({ visualStyle }),

      booted: false,
      setBooted: (booted) => set({ booted }),
    }),
    {
      name: 'hmd.os',
      storage: createJSONStorage(() => localStorage),
      // Persist only durable preferences, never transient session state.
      partialize: (state) => ({ visualStyle: state.visualStyle }),
    },
  ),
)
