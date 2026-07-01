// Untyped third-party modules loaded dynamically by Tier-3 emulator apps.
declare module 'v86/build/libv86.mjs'

// Ruffle (Flash player) self-hosted bundle attaches its source API to window.
interface RuffleInstance extends HTMLElement {
  load: (options: { url: string } | { data: Uint8Array }) => Promise<void>
}
interface RuffleSource {
  createPlayer: () => RuffleInstance
}
interface Window {
  RufflePlayer?: {
    newest: () => RuffleSource
    config?: Record<string, unknown>
  }
}
