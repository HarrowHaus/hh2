import { create } from 'zustand'

// Global context-menu state (not persisted). Any surface calls openMenu with a
// position + item list; a single <ContextMenu> renders it.
export interface MenuItem {
  label?: string
  onClick?: () => void
  disabled?: boolean
  separator?: boolean
}

interface MenuState {
  open: boolean
  x: number
  y: number
  items: MenuItem[]
  openMenu: (x: number, y: number, items: MenuItem[]) => void
  closeMenu: () => void
}

export const useMenu = create<MenuState>((set) => ({
  open: false,
  x: 0,
  y: 0,
  items: [],
  openMenu: (x, y, items) => set({ open: true, x, y, items }),
  closeMenu: () => set((s) => (s.open ? { open: false, items: [] } : s)),
}))
