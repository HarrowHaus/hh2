// Visual-style registry. The authoritative palette lives in tokens/themes.css;
// this module is the typed index the OS uses to know which styles exist and
// which <body> class drives each one. Add a style here AND in tokens/themes.css.

export type VisualStyle = 'dark' | 'luna' | 'classic'

export interface VisualStyleMeta {
  id: VisualStyle
  /** Diegetic name shown in Display Properties (Phase 1). */
  label: string
  /** Class applied to <body>; must match a selector block in tokens/themes.css. */
  bodyClass: string
}

export const VISUAL_STYLES: Record<VisualStyle, VisualStyleMeta> = {
  dark: { id: 'dark', label: 'bug', bodyClass: 'theme-dark' },
  luna: { id: 'luna', label: 'Windows XP', bodyClass: 'luna' },
  classic: { id: 'classic', label: 'Windows Classic', bodyClass: 'classic' },
}

export const DEFAULT_VISUAL_STYLE: VisualStyle = 'dark'

export const ALL_BODY_CLASSES = Object.values(VISUAL_STYLES).map((s) => s.bodyClass)
