import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FSNode } from './types'
import { joinPath, parentOf, uniqueName } from './path'
import { seedFS } from './seed'
import { idbStorage } from './idb'

// Virtual file system store, persisted to IndexedDB. Holds the node map plus a
// desktop-icon layout (path -> position) so the desktop arrangement survives.

interface Clipboard {
  paths: string[]
  op: 'copy' | 'cut'
}

interface FSState {
  nodes: Record<string, FSNode>
  desktopPos: Record<string, { x: number; y: number }>
  /** Cut/copy buffer, shared across Explorer windows + the desktop. Not persisted. */
  clipboard: Clipboard | null

  createFolder: (dir: string) => string
  createTextFile: (dir: string) => string
  writeFile: (path: string, content: string) => void
  rename: (path: string, name: string) => void
  remove: (path: string) => void
  setDesktopPos: (path: string, pos: { x: number; y: number }) => void

  setClipboard: (paths: string[], op: 'copy' | 'cut') => void
  clearClipboard: () => void
  /** Move/copy a set of nodes (folders move recursively) into destDir. */
  moveNodes: (paths: string[], destDir: string) => void
  copyNodes: (paths: string[], destDir: string) => void
  /** Apply the clipboard into destDir (move for cut, copy for copy). */
  paste: (destDir: string) => void
}

// Relocate (move or copy) a set of subtrees into destDir, handling name
// collisions and recursive folder contents. Pure — returns the next maps.
function relocate(
  nodes: Record<string, FSNode>,
  desktopPos: Record<string, { x: number; y: number }>,
  paths: string[],
  destDir: string,
  mode: 'move' | 'copy',
): { nodes: Record<string, FSNode>; desktopPos: Record<string, { x: number; y: number }> } {
  // Drop any path whose ancestor is also selected (avoid double-processing).
  const tops = paths.filter((p) => !paths.some((q) => q !== p && p.startsWith(q + '/')))
  const nextNodes = { ...nodes }
  const nextPos = { ...desktopPos }

  for (const path of tops) {
    const node = nextNodes[path]
    if (!node) continue
    // No-op move within the same folder; can't drop a folder into itself/descendant.
    if (mode === 'move' && parentOf(path) === destDir) continue
    if (destDir === path || destDir.startsWith(path + '/')) continue

    const name = uniqueName(nextNodes, destDir, node.name)
    const newPath = joinPath(destDir, name)
    const subtree = Object.values(nextNodes).filter(
      (n) => n.path === path || n.path.startsWith(path + '/'),
    )
    for (const n of subtree) {
      const moved = newPath + n.path.slice(path.length)
      nextNodes[moved] = { ...n, path: moved, name: n.path === path ? name : n.name }
      if (mode === 'move') {
        delete nextNodes[n.path]
        delete nextPos[n.path]
      }
    }
  }
  return { nodes: nextNodes, desktopPos: nextPos }
}

export const useFS = create<FSState>()(
  persist(
    (set, get) => ({
      nodes: seedFS(),
      desktopPos: {},
      clipboard: null,

      createFolder: (dir) => {
        const { nodes } = get()
        const name = uniqueName(nodes, dir, 'New Folder')
        const path = joinPath(dir, name)
        set({ nodes: { ...nodes, [path]: { path, name, type: 'folder', kind: 'folder', ts: Date.now() } } })
        return path
      },

      createTextFile: (dir) => {
        const { nodes } = get()
        const name = uniqueName(nodes, dir, 'New Text Document.txt')
        const path = joinPath(dir, name)
        set({
          nodes: { ...nodes, [path]: { path, name, type: 'file', kind: 'text', ts: Date.now(), content: '' } },
        })
        return path
      },

      writeFile: (path, content) =>
        set((s) => {
          const node = s.nodes[path]
          if (!node) return s
          return { nodes: { ...s.nodes, [path]: { ...node, content, ts: Date.now() } } }
        }),

      rename: (path, rawName) => {
        const name = rawName.trim()
        if (!name) return
        const { nodes, desktopPos } = get()
        const node = nodes[path]
        if (!node) return
        const newPath = joinPath(parentOf(path), name)
        if (newPath === path || nodes[newPath]) return

        const nextNodes: Record<string, FSNode> = {}
        const nextPos: Record<string, { x: number; y: number }> = { ...desktopPos }
        for (const n of Object.values(nodes)) {
          if (n.path === path) {
            nextNodes[newPath] = { ...n, path: newPath, name }
          } else if (n.path.startsWith(path + '/')) {
            // re-path descendants of a renamed folder
            const moved = newPath + n.path.slice(path.length)
            nextNodes[moved] = { ...n, path: moved }
          } else {
            nextNodes[n.path] = n
          }
        }
        if (nextPos[path]) {
          nextPos[newPath] = nextPos[path]
          delete nextPos[path]
        }
        set({ nodes: nextNodes, desktopPos: nextPos })
      },

      remove: (path) => {
        const { nodes, desktopPos } = get()
        const nextNodes: Record<string, FSNode> = {}
        const nextPos = { ...desktopPos }
        for (const n of Object.values(nodes)) {
          if (n.path === path || n.path.startsWith(path + '/')) {
            delete nextPos[n.path]
            continue
          }
          nextNodes[n.path] = n
        }
        set({ nodes: nextNodes, desktopPos: nextPos })
      },

      setDesktopPos: (path, pos) =>
        set((s) => ({ desktopPos: { ...s.desktopPos, [path]: pos } })),

      setClipboard: (paths, op) => set({ clipboard: { paths: [...paths], op } }),
      clearClipboard: () => set((s) => (s.clipboard ? { clipboard: null } : s)),

      moveNodes: (paths, destDir) =>
        set((s) => relocate(s.nodes, s.desktopPos, paths, destDir, 'move')),
      copyNodes: (paths, destDir) =>
        set((s) => relocate(s.nodes, s.desktopPos, paths, destDir, 'copy')),

      paste: (destDir) =>
        set((s) => {
          if (!s.clipboard) return s
          const { paths, op } = s.clipboard
          const next = relocate(s.nodes, s.desktopPos, paths, destDir, op === 'cut' ? 'move' : 'copy')
          // A cut is consumed once pasted; a copy can paste repeatedly.
          return op === 'cut' ? { ...next, clipboard: null } : next
        }),
    }),
    {
      name: 'hmd.fs',
      // v23: + Emulators/EmulatorJS (console). v22: + Macromedia/Flash Player (Ruffle). v21: + Internet
      // Explorer/iexplore.exe. v20: + TIC-80 (moth.tic). v19: + v86. v18: + Code (Monaco). (v16: keygen/
      // sigil + .nfo routing; v15: FreeCell/Spider; v14: easter eggs; v13: Accessories/GAMES.) Bumping
      // discards the old dev seed.
      version: 23,
      storage: createJSONStorage(() => idbStorage),
    },
  ),
)
