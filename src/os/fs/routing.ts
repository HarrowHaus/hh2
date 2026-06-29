import type { AppId } from '../types'
import type { FSNode } from './types'

// open-with routing: which app opens a given node. Folders open in Explorer.
// File kinds map to apps as those apps ship (Notepad/viewers/foobar = Phase 3).
const KIND_APP: Partial<Record<FSNode['kind'], AppId>> = {
  text: 'notepad',
  audio: 'foobar',
  image: 'imageviewer',
  markdown: 'markdown',
  pdf: 'pdf',
}

export interface OpenTarget {
  appId: AppId
  args: { path: string; title: string; kind?: string }
}

export function routeOpen(node: FSNode): OpenTarget | null {
  // A locked folder denies access via an in-voice message box instead of opening.
  if (node.type === 'folder' && node.locked) {
    return { appId: 'msgbox', args: { path: node.path, title: node.name, kind: 'locked' } }
  }
  // Explicit program launcher wins (e.g. a .exe shortcut).
  if (node.app) return { appId: node.app, args: { path: node.path, title: node.name } }
  if (node.type === 'folder') {
    return { appId: 'explorer', args: { path: node.path, title: node.name } }
  }
  // Extension wins over generic kind (.md/.pdf may be stored as text/file kinds).
  const ext = node.name.toLowerCase().split('.').pop()
  if (ext === 'md') return { appId: 'markdown', args: { path: node.path, title: node.name } }
  if (ext === 'pdf') return { appId: 'pdf', args: { path: node.path, title: node.name } }
  if (ext === 'nfo' || ext === 'ans' || ext === 'asc') {
    return { appId: 'ansi', args: { path: node.path, title: node.name } }
  }
  const appId = KIND_APP[node.kind]
  return appId ? { appId, args: { path: node.path, title: node.name } } : null
}
