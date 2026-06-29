import { useEffect } from 'react'
import { useOS, getFocusedId } from './store'
import { useMenu } from './menu'

// Global OS keyboard: Alt+Tab cycles windows, Esc closes menus. Reads fresh
// state via getState() so it never needs re-subscription.
export function useKeyboard(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'Tab' || e.key === 'Tab')) {
        const { windows, focusWindow } = useOS.getState()
        const open = windows
          .filter((w) => !w.minimized)
          .sort((a, b) => a.z - b.z)
        if (open.length < 2) return
        e.preventDefault()
        const focusedId = getFocusedId(windows)
        const idx = open.findIndex((w) => w.id === focusedId)
        const step = e.shiftKey ? -1 : 1
        const next = open[(idx + step + open.length) % open.length]
        focusWindow(next.id)
      } else if (e.key === 'Escape') {
        useMenu.getState().closeMenu()
        useOS.getState().closeStartMenu()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
