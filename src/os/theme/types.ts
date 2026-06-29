// Theme-pack manifest — the engine's contract (schema mirrors docs/06 so the
// deferred real-.msstyles converter emits the SAME shape and drops in additively).
// Our 3 built-in styles are just the first packs. DO NOT hard-code per theme.

export type VisualStyle = 'dark' | 'luna' | 'classic'

/** One 9-slice image layer for a chrome part/state (border-image-ready). */
export interface PartLayer {
  /** Image URL or blob: URL. Bundled packs leave this empty (gradient/color only). */
  image: string
  /** border-image-slice, top/right/bottom/left (px, unitless). */
  slice?: [number, number, number, number]
  /** border-image-width, top/right/bottom/left (px). */
  width?: [number, number, number, number]
  /** stretch | repeat | round | space (maps to border-image-repeat). */
  fill?: 'stretch' | 'repeat' | 'round' | 'space'
}

/** A theme pack. `colors`/`fonts`/`metrics` are CSS custom properties applied to
 *  :root. `parts` (optional) carries 9-slice bitmaps for future real-.msstyles
 *  packs; bundled packs omit it. */
export interface ThemePack {
  id: VisualStyle
  /** Diegetic name shown in Display Properties. */
  name: string
  colors: Record<string, string>
  fonts?: Record<string, string>
  metrics?: Record<string, string>
  /** part key -> state -> layer. e.g. parts.windowCaption.active */
  parts?: Record<string, Record<string, PartLayer>>
}
