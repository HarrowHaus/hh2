import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_VISUAL_STYLE, type VisualStyle } from './themes'
import type { AppId, WindowInstance } from './types'
import { APP_META } from './appMeta'

// Core OS state. Window-manager logic is ported from the winXP reducer
// (add/del/focus/minimize/maximize + z-order) onto a typed Zustand store.
// Only the visual style persists in Phase 1; window/session persistence is Phase 2.
interface OSState {
  visualStyle: VisualStyle
  setVisualStyle: (style: VisualStyle) => void

  booted: boolean
  setBooted: (booted: boolean) => void

  loggedIn: boolean
  account: string
  login: (account: string) => void
  logOff: () => void

  startMenuOpen: boolean
  toggleStartMenu: () => void
  closeStartMenu: () => void

  windows: WindowInstance[]
  nextId: number
  nextZ: number

  openApp: (appId: AppId) => void
  closeWindow: (id: number) => void
  focusWindow: (id: number) => void
  minimizeWindow: (id: number) => void
  toggleMaximize: (id: number) => void
  moveWindow: (id: number, x: number, y: number) => void
  /** Taskbar button: minimize if focused, else focus/restore. */
  taskbarClick: (id: number) => void
}

/** Focused window = top-most (highest z) non-minimized window, like winXP. */
export function getFocusedId(windows: WindowInstance[]): number {
  let focused = -1
  let topZ = -Infinity
  for (const w of windows) {
    if (!w.minimized && w.z > topZ) {
      topZ = w.z
      focused = w.id
    }
  }
  return focused
}

export const useOS = create<OSState>()(
  persist(
    (set, get) => ({
      visualStyle: DEFAULT_VISUAL_STYLE,
      setVisualStyle: (visualStyle) => set({ visualStyle }),

      booted: false,
      setBooted: (booted) => set({ booted }),

      loggedIn: false,
      account: '',
      login: (account) => set({ loggedIn: true, account }),
      logOff: () => set({ loggedIn: false, account: '', windows: [], startMenuOpen: false }),

      startMenuOpen: false,
      toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),
      closeStartMenu: () => set((s) => (s.startMenuOpen ? { startMenuOpen: false } : s)),

      windows: [],
      nextId: 0,
      nextZ: 1,

      openApp: (appId) =>
        set((s) => {
          const meta = APP_META[appId]
          if (meta.single) {
            const existing = s.windows.find((w) => w.appId === appId)
            if (existing) {
              return {
                startMenuOpen: false,
                nextZ: s.nextZ + 1,
                windows: s.windows.map((w) =>
                  w.id === existing.id ? { ...w, minimized: false, z: s.nextZ } : w,
                ),
              }
            }
          }
          const count = s.windows.length
          const win: WindowInstance = {
            id: s.nextId,
            appId,
            title: meta.title,
            x: 64 + (count % 6) * 26,
            y: 44 + (count % 6) * 26,
            width: meta.width,
            height: meta.height,
            z: s.nextZ,
            minimized: false,
            maximized: false,
          }
          return {
            startMenuOpen: false,
            windows: [...s.windows, win],
            nextId: s.nextId + 1,
            nextZ: s.nextZ + 1,
          }
        }),

      closeWindow: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

      focusWindow: (id) =>
        set((s) => {
          if (getFocusedId(s.windows) === id) return s
          return {
            nextZ: s.nextZ + 1,
            windows: s.windows.map((w) =>
              w.id === id ? { ...w, minimized: false, z: s.nextZ } : w,
            ),
          }
        }),

      minimizeWindow: (id) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
        })),

      toggleMaximize: (id) =>
        set((s) => ({
          nextZ: s.nextZ + 1,
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, maximized: !w.maximized, minimized: false, z: s.nextZ } : w,
          ),
        })),

      moveWindow: (id, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
        })),

      taskbarClick: (id) => {
        const s = get()
        if (getFocusedId(s.windows) === id) s.minimizeWindow(id)
        else s.focusWindow(id)
      },
    }),
    {
      name: 'hmd.os',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ visualStyle: state.visualStyle }),
    },
  ),
)
