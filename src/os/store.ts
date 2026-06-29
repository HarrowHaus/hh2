import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_VISUAL_STYLE, type VisualStyle } from './themes'
import type { AppArgs, AppId, Geometry, SnapZone, WindowInstance } from './types'
import { APP_META } from './appMeta'

const TASKBAR_H = 30
export const MIN_W = 200
export const MIN_H = 130

function surfaceSize() {
  return { w: window.innerWidth, h: window.innerHeight - TASKBAR_H }
}

// Core OS state. Window-manager logic is ported from the winXP reducer
// (add/del/focus/minimize/maximize + z-order) onto a typed Zustand store.
// Only the visual style persists in Phase 1; window/session persistence is Phase 2.
interface OSState {
  visualStyle: VisualStyle
  setVisualStyle: (style: VisualStyle) => void

  /** CRT/VHS post-process overlay (Display Properties → Effects). Persisted. */
  crt: boolean
  setCrt: (on: boolean) => void
  /** oneko desktop pet on/off. Persisted. */
  neko: boolean
  setNeko: (on: boolean) => void
  /** Selected screen saver id (Display Properties → Screen Saver), or 'none'. */
  screensaver: string
  setScreensaver: (id: string) => void

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

  /** Transient drag-snap preview (not persisted). */
  snapPreview: SnapZone
  setSnapPreview: (zone: SnapZone) => void

  openApp: (appId: AppId, args?: AppArgs) => void
  closeWindow: (id: number) => void
  focusWindow: (id: number) => void
  minimizeWindow: (id: number) => void
  toggleMaximize: (id: number) => void
  moveWindow: (id: number, x: number, y: number) => void
  setWindowTitle: (id: number, title: string) => void
  resizeWindow: (id: number, geo: Geometry) => void
  /** Half/maximize tile a window, remembering pre-snap geometry. */
  snapWindow: (id: number, zone: SnapZone) => void
  /** Restore a snapped/maximized window to floating geometry (for drag-off). */
  restoreWindow: (id: number, x: number, y: number) => void
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

      crt: false,
      setCrt: (crt) => set({ crt }),
      neko: false,
      setNeko: (neko) => set({ neko }),
      screensaver: 'none',
      setScreensaver: (screensaver) => set({ screensaver }),

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

      snapPreview: null,
      setSnapPreview: (zone) => set((s) => (s.snapPreview === zone ? s : { snapPreview: zone })),

      openApp: (appId, args) =>
        set((s) => {
          const meta = APP_META[appId]
          const title = (args?.title as string) || meta.title
          if (meta.single) {
            const existing = s.windows.find((w) => w.appId === appId)
            if (existing) {
              return {
                startMenuOpen: false,
                nextZ: s.nextZ + 1,
                windows: s.windows.map((w) =>
                  w.id === existing.id ? { ...w, minimized: false, z: s.nextZ, args, title } : w,
                ),
              }
            }
          }
          const count = s.windows.length
          const win: WindowInstance = {
            id: s.nextId,
            appId,
            title,
            x: 64 + (count % 6) * 26,
            y: 44 + (count % 6) * 26,
            width: meta.width,
            height: meta.height,
            z: s.nextZ,
            minimized: false,
            maximized: false,
            snapped: null,
            prev: null,
            args,
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
          windows: s.windows.map((w) => {
            if (w.id !== id) return w
            // Remember floating geometry so restore returns to it.
            const prev = w.maximized ? w.prev : { x: w.x, y: w.y, width: w.width, height: w.height }
            return { ...w, maximized: !w.maximized, snapped: null, minimized: false, z: s.nextZ, prev }
          }),
        })),

      moveWindow: (id, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
        })),

      setWindowTitle: (id, title) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, title } : w)),
        })),

      resizeWindow: (id, geo) =>
        set((s) => ({
          // Any manual resize makes the window floating again.
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, ...geo, maximized: false, snapped: null, prev: null } : w,
          ),
        })),

      snapWindow: (id, zone) =>
        set((s) => {
          if (!zone) return s
          const { w: W, h: H } = surfaceSize()
          return {
            snapPreview: null,
            nextZ: s.nextZ + 1,
            windows: s.windows.map((w) => {
              if (w.id !== id) return w
              const prev =
                w.maximized || w.snapped
                  ? w.prev
                  : { x: w.x, y: w.y, width: w.width, height: w.height }
              if (zone === 'max') {
                return { ...w, maximized: true, snapped: null, minimized: false, z: s.nextZ, prev }
              }
              const half = Math.round(W / 2)
              const geo =
                zone === 'left'
                  ? { x: 0, y: 0, width: half, height: H }
                  : { x: W - half, y: 0, width: half, height: H }
              return { ...w, ...geo, maximized: false, snapped: zone, minimized: false, z: s.nextZ, prev }
            }),
          }
        }),

      restoreWindow: (id, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) => {
            if (w.id !== id) return w
            const size = w.prev ?? { width: w.width, height: w.height, x, y }
            return {
              ...w,
              x,
              y,
              width: size.width,
              height: size.height,
              maximized: false,
              snapped: null,
              prev: null,
            }
          }),
        })),

      taskbarClick: (id) => {
        const s = get()
        if (getFocusedId(s.windows) === id) s.minimizeWindow(id)
        else s.focusWindow(id)
      },
    }),
    {
      name: 'hmd.os',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Persist durable session state: visual style + open windows (docs/02 #10).
      // Transient flags (booted/loggedIn/startMenu/snapPreview/account) are not
      // persisted — every load re-boots and re-logs-in, then windows restore.
      partialize: (state) => ({
        visualStyle: state.visualStyle,
        crt: state.crt,
        neko: state.neko,
        screensaver: state.screensaver,
        windows: state.windows,
        nextId: state.nextId,
        nextZ: state.nextZ,
      }),
      // Drop any persisted window whose app no longer exists (defensive).
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<OSState>
        const windows = (p.windows ?? []).filter((w) => w.appId in APP_META)
        return { ...current, ...p, windows }
      },
    },
  ),
)
