import type { AppId } from '../types'
import type { FSNode } from './types'

// open-with routing: which app opens a given node. Folders open in Explorer.
// File kinds map to apps as those apps ship (Notepad/viewers/foobar = Phase 3).
const KIND_APP: Partial<Record<FSNode['kind'], AppId>> = {
  text: 'notepad',
  audio: 'foobar',
  // image: 'imageviewer',  // Phase 3 (image-viewer ticket)
}

export interface OpenTarget {
  appId: AppId
  args: { path: string; title: string }
}

export function routeOpen(node: FSNode): OpenTarget | null {
  if (node.type === 'folder') {
    return { appId: 'explorer', args: { path: node.path, title: node.name } }
  }
  const appId = KIND_APP[node.kind]
  return appId ? { appId, args: { path: node.path, title: node.name } } : null
}
