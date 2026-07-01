import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_VISUAL_STYLE, type VisualStyle } from './themes'
import type { AppArgs, AppId, Geometry, SnapZone, WindowInstance } from './types'
import { APP_META } from './appMeta'
import { playSound, setSoundPrefs } from './sound'

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

  /** Selected live desktop wallpaper id (Display Properties → Desktop), or 'none'. */
  wallpaper: string
  setWallpaper: (id: string) => void
  /** Single-image wallpaper URL + fit mode (used when wallpaper === 'image'). */
  wallpaperImage: string
  setWallpaperImage: (url: string) => void
  wallpaperFit: string
  setWallpaperFit: (fit: string) => void

  /** Tray volume: system sounds are muted / scaled by this (0..1). Persisted.
      The sound pack itself is Phase 8 — these gate the silent seam today. */
  muted: boolean
  volume: number
  setMuted: (on: boolean) => void
  toggleMuted: () => void
  setVolume: (v: number) => void

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
      muted: false,
      volume: 0.8,
      setMuted: (muted) => { setSoundPrefs({ muted, volume: get().volume }); set({ muted }) },
      toggleMuted: () => { const muted = !get().muted; setSoundPrefs({ muted, volume: get().volume }); set({ muted }) },
      setVolume: (volume) => { const v = Math.max(0, Math.min(1, volume)); setSoundPrefs({ muted: get().muted, volume: v }); set({ volume: v }) },
      screensaver: 'none',
      setScreensaver: (screensaver) => set({ screensaver }),

      wallpaper: 'none',
      setWallpaper: (wallpaper) => set({ wallpaper }),
      wallpaperImage: '',
      setWallpaperImage: (wallpaperImage) => set({ wallpaperImage }),
      wallpaperFit: 'fill',
      setWallpaperFit: (wallpaperFit) => set({ wallpaperFit }),

      booted: false,
      setBooted: (booted) => set({ booted }),

      loggedIn: false,
      account: '',
      login: (account) => { playSound('startup'); set({ loggedIn: true, account }) },
      logOff: () => { playSound('shutdown'); set({ loggedIn: false, account: '', windows: [], startMenuOpen: false }) },

      startMenuOpen: false,
      toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),
      closeStartMenu: () => set((s) => (s.startMenuOpen ? { startMenuOpen: false } : s)),

      windows: [],
      nextId: 0,
      nextZ: 1,

      snapPreview: null,
      setSnapPreview: (zone) => set((s) => (s.snapPreview === zone ? s : { snapPreview: zone })),

      openApp: (appId, args) => {
        // The error ding for message boxes / BSOD; a window-open tick otherwise.
        playSound(appId === 'msgbox' || appId === 'bsod' ? 'error' : 'window-open')
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
          // Responsive open geometry: clamp the window to the viewport so it's
          // never larger than the screen or cascaded off-edge. On phones, open
          // maximized when the app doesn't already fit (small fixed apps like
          // Calculator stay at natural size, centered, rather than stretching).
          const { w: vw, h: vh } = surfaceSize()
          const width = Math.max(MIN_W, Math.min(meta.width, vw - 8))
          const height = Math.max(MIN_H, Math.min(meta.height, vh - 8))
          const fits = meta.width <= vw - 8 && meta.height <= vh - 8
          const maximize = vw < 768 && !fits
          const cx = Math.max(0, (vw - width) >> 1)
          const cy = Math.max(0, (vh - height) >> 1)
          const x = vw < 768 ? cx : Math.max(0, Math.min(64 + (count % 6) * 26, vw - width))
          const y = vw < 768 ? cy : Math.max(0, Math.min(44 + (count % 6) * 26, vh - height))
          const win: WindowInstance = {
            id: s.nextId,
            appId,
            title,
            x,
            y,
            width,
            height,
            z: s.nextZ,
            minimized: false,
            maximized: maximize,
            snapped: null,
            // A maximized window needs a restore target (the centered clamped box).
            prev: maximize ? { x: cx, y: cy, width, height } : null,
            args,
          }
          return {
            startMenuOpen: false,
            windows: [...s.windows, win],
            nextId: s.nextId + 1,
            nextZ: s.nextZ + 1,
          }
        })
      },

      closeWindow: (id) => { playSound('window-close'); set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })) },

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

      minimizeWindow: (id) => {
        playSound('minimize')
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
        }))
      },

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
        wallpaper: state.wallpaper,
        wallpaperImage: state.wallpaperImage,
        wallpaperFit: state.wallpaperFit,
        muted: state.muted,
        volume: state.volume,
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

// Seed the sound manager with the (possibly persisted) mute/volume so silent-
// seam events honor it from the first interaction.
setSoundPrefs({ muted: useOS.getState().muted, volume: useOS.getState().volume })
