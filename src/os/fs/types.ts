// Virtual file system node model. The FS is a flat map of full-path -> node;
// directory listings are derived by parent path. Kept flat so persistence and
// path ops stay trivial.

export type FSKind = 'folder' | 'text' | 'image' | 'audio' | 'exe' | 'file' | 'markdown' | 'pdf' | 'whtml'

export interface FSNode {
  /** Full path. '/' is the root (My Computer). */
  path: string
  name: string
  type: 'folder' | 'file'
  /** Routing/icon hint. */
  kind: FSKind
  /** Creation/modified time — drives "sort by date" stratum walking later. */
  ts: number
  /** Inline content for text files (placeholder layer; real content is Phase 3). */
  content?: string
  /** Launchable program: opening this node opens this app (e.g. a .exe shortcut). */
  app?: import('../types').AppId
  /** A locked folder: opening it denies access instead of listing contents. */
  locked?: boolean
  /** Static asset URL for real binary files (e.g. a .pdf served from /public). */
  url?: string
}
