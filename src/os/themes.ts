// Public theming facade. The visual styles are pack manifests (theme/packs.ts);
// the engine (theme/engine.ts) applies the active pack to :root at runtime.
// Kept as a thin re-export so the rest of the app imports from one place.

export type { VisualStyle, ThemePack, PartLayer } from './theme/types'
export { PACKS, PACK_LIST, DEFAULT_VISUAL_STYLE } from './theme/packs'
export { applyThemePack } from './theme/engine'
