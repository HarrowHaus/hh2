import type { FSNode } from './types'

export const ROOT = '/'
export const DESKTOP_PATH = '/Local Disk (C:)/Documents and Settings/owner/Desktop'

export function parentOf(path: string): string {
  if (path === ROOT) return ROOT
  const i = path.lastIndexOf('/')
  return i <= 0 ? ROOT : path.slice(0, i)
}

export function baseName(path: string): string {
  if (path === ROOT) return 'My Computer'
  return path.slice(path.lastIndexOf('/') + 1)
}

export function joinPath(parent: string, name: string): string {
  return parent === ROOT ? `/${name}` : `${parent}/${name}`
}

/** Direct children of a directory, folders first then alphabetical. */
export function listDir(nodes: Record<string, FSNode>, dir: string): FSNode[] {
  return Object.values(nodes)
    .filter((n) => n.path !== ROOT && parentOf(n.path) === dir)
    .sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1,
    )
}

/** A unique sibling name, appending " (n)" if taken. */
export function uniqueName(nodes: Record<string, FSNode>, dir: string, base: string): string {
  const siblings = new Set(listDir(nodes, dir).map((n) => n.name))
  if (!siblings.has(base)) return base
  let n = 2
  while (siblings.has(`${base} (${n})`)) n++
  return `${base} (${n})`
}
