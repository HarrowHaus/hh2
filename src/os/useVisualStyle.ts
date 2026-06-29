import { useEffect } from 'react'
import { useOS } from './store'
import { PACKS } from './theme/packs'
import { applyThemePack } from './theme/engine'

// Theme-switch plumbing: apply the selected pack manifest to :root whenever it
// changes. Display Properties drives this by setting visualStyle in the store.
export function useVisualStyle(): void {
  const visualStyle = useOS((s) => s.visualStyle)

  useEffect(() => {
    applyThemePack(PACKS[visualStyle])
  }, [visualStyle])
}
