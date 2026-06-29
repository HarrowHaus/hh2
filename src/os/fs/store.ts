import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FSNode } from './types'
import { joinPath, parentOf, uniqueName } from './path'
import { seedFS } from './seed'
import { idbStorage } from './idb'

// Virtual file system store, persisted to IndexedDB. Holds the node map plus a
// desktop-icon layout (path -> position) so the desktop arrangement survives.

interface FSState {
  nodes: Record<string, FSNode>
  desktopPos: Record<string, { x: number; y: number }>

  createFolder: (dir: string) => string
  createTextFile: (dir: string) => string
  writeFile: (path: string, content: string) => void
  rename: (path: string, name: string) => void
  remove: (path: string) => void
  setDesktopPos: (path: string, pos: { x: number; y: number }) => void
}

export const useFS = create<FSState>()(
  persist(
    (set, get) => ({
      nodes: seedFS(),
      desktopPos: {},

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
    }),
    {
      name: 'hmd.fs',
      // v11: + static AIM / mIRC / Internet Explorer (guestbook + webring) props
      // and their launchers. Bumping discards the old dev seed (pre-release).
      version: 11,
      storage: createJSONStorage(() => idbStorage),
    },
  ),
)
