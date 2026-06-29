import { useEffect } from 'react'
import { useOS } from './store'
import { ALL_BODY_CLASSES, VISUAL_STYLES } from './themes'

// Theme-switch plumbing: mirror the selected visual style onto <body> so the
// tokens in tokens/themes.css take effect. No switcher UI yet (Phase 1) — this
// is the wire that a Display Properties panel will later drive.
export function useVisualStyle(): void {
  const visualStyle = useOS((s) => s.visualStyle)

  useEffect(() => {
    const body = document.body
    body.classList.remove(...ALL_BODY_CLASSES)
    body.classList.add(VISUAL_STYLES[visualStyle].bodyClass)
  }, [visualStyle])
}
