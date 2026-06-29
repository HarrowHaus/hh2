import type { FSNode } from './types'
import { DESKTOP_PATH } from './path'

// Minimal STRUCTURAL seed only — folders the OS needs to be browsable. The real
// palimpsest content + period strata are populated in Phase 3 after the content
// manifest is approved (docs/05 checkpoint, docs/07). No narrative copy here.
export function seedFS(): Record<string, FSNode> {
  const t = Date.now()
  const folder = (path: string, name: string): FSNode => ({ path, name, type: 'folder', kind: 'folder', ts: t })
  const C = '/Local Disk (C:)'
  const DOCS = `${C}/Documents and Settings`
  const OWNER = `${DOCS}/owner`
  const MYDOCS = `${OWNER}/My Documents`

  const nodes: FSNode[] = [
    folder(C, 'Local Disk (C:)'),
    folder(`${C}/WINDOWS`, 'WINDOWS'),
    folder(`${C}/Program Files`, 'Program Files'),
    folder(DOCS, 'Documents and Settings'),
    folder(OWNER, 'owner'),
    folder(DESKTOP_PATH, 'Desktop'),
    folder(MYDOCS, 'My Documents'),
    folder(`${MYDOCS}/My Music`, 'My Music'),
    folder(`${MYDOCS}/My Pictures`, 'My Pictures'),
    { path: `${MYDOCS}/readme.txt`, name: 'readme.txt', type: 'file', kind: 'text', ts: t, content: '' },
  ]

  return Object.fromEntries(nodes.map((n) => [n.path, n]))
}
