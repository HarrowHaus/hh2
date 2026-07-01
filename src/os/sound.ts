// System sound manager — the ARCHITECTURE for OS sounds, shipped silent.
//
// Per CLAUDE.md the sound *pack* is deferred to Phase 8; this is the seam it
// drops into. Every event point already calls playSound(); it stays silent
// because every slot below is empty (null). Phase 8 only has to (a) drop .wav
// files into public/sounds/ and (b) fill the SLOTS paths — no rewiring.
//
// Mute/volume live in the OS store; the store pushes them here via setSoundPrefs
// (one-directional store → sound, so there's no import cycle). playSound honors
// them and no-ops when muted, silent, or slot-empty.

export type SoundEvent =
  | 'startup'
  | 'shutdown'
  | 'window-open'
  | 'window-close'
  | 'minimize'
  | 'menu'
  | 'error'
  // AIM: sign-on/off (door open/slam) + IM in/out — silent slots (Phase 8).
  | 'aim-signon'
  | 'aim-signoff'
  | 'aim-in'
  | 'aim-out'

// Phase 8 fills these with `${import.meta.env.BASE_URL}sounds/<name>.wav`.
const SLOTS: Record<SoundEvent, string | null> = {
  startup: null,
  shutdown: null,
  'window-open': null,
  'window-close': null,
  minimize: null,
  menu: null,
  error: null,
  'aim-signon': null,
  'aim-signoff': null,
  'aim-in': null,
  'aim-out': null,
}

let muted = false
let volume = 0.8
const cache = new Map<string, HTMLAudioElement>()

/** Store pushes the current mute/volume here whenever they change. */
export function setSoundPrefs(next: { muted: boolean; volume: number }): void {
  muted = next.muted
  volume = next.volume
}

/** Play the sound mapped to an event — silent until Phase 8 fills the slot. */
export function playSound(event: SoundEvent): void {
  const url = SLOTS[event]
  if (!url || muted || volume <= 0) return
  try {
    let a = cache.get(url)
    if (!a) {
      a = new Audio(url)
      cache.set(url, a)
    }
    a.volume = volume
    a.currentTime = 0
    void a.play().catch(() => {})
  } catch {
    /* never let a sound break the OS */
  }
}
