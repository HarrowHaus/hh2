// Untyped third-party modules loaded dynamically by Tier-3 emulator apps.
declare module 'v86/build/libv86.mjs'

// Podcast feed parser (ISC) — ships no types; we use getPodcastFromFeed(str).
declare module '@podverse/podcast-feed-parser' {
  const parser: {
    getPodcastFromFeed: (feed: string, params?: unknown) => { meta?: unknown; episodes?: unknown[] }
    getPodcastFromURL: (params: unknown) => Promise<unknown>
  }
  export default parser
}

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
