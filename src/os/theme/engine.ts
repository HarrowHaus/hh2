import type { PartLayer, ThemePack } from './types'

// The pack-driven theming engine: applies a ThemePack by writing its custom
// properties (and any 9-slice part bitmaps) to :root at runtime. Switching packs
// = applying a different manifest. The deferred .msstyles converter (docs/06)
// produces the same ThemePack shape, so it plugs in here with no engine change.

// Part var names we've set, so we can clear stale ones when switching packs.
let appliedPartVars: string[] = []

function setVars(root: HTMLElement, vars?: Record<string, string>) {
  if (!vars) return
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
}

// border-image shorthand from a layer; plus a matching border-width var so the
// 9-slice actually renders. Chrome consumes `var(--bi-<part>-<state>, none)`
// and `var(--biw-<part>-<state>, 0)` — inert until a pack provides images.
function applyPart(root: HTMLElement, part: string, state: string, layer: PartLayer) {
  const slice = (layer.slice ?? [0, 0, 0, 0]).join(' ')
  const width = (layer.width ?? [0, 0, 0, 0]).map((n) => `${n}px`).join(' ')
  const repeat = layer.fill ?? 'stretch'
  const biVar = `--bi-${part}-${state}`
  const bwVar = `--biw-${part}-${state}`
  root.style.setProperty(biVar, `url("${layer.image}") ${slice} / ${width} / 0 ${repeat}`)
  root.style.setProperty(bwVar, width)
  appliedPartVars.push(biVar, bwVar)
}

function applyParts(root: HTMLElement, parts?: ThemePack['parts']) {
  // Clear part vars from the previous pack first (colors/fonts/metrics are
  // re-set every pack so they never go stale; parts can disappear).
  for (const name of appliedPartVars) root.style.removeProperty(name)
  appliedPartVars = []
  if (!parts) return
  for (const [part, states] of Object.entries(parts)) {
    for (const [state, layer] of Object.entries(states)) {
      applyPart(root, part, state, layer)
    }
  }
}

export function applyThemePack(pack: ThemePack): void {
  const root = document.documentElement
  setVars(root, pack.colors)
  setVars(root, pack.fonts)
  setVars(root, pack.metrics)
  applyParts(root, pack.parts)
  // Keep an attribute hook for any CSS that wants to key off the active pack.
  root.setAttribute('data-theme', pack.id)
}
