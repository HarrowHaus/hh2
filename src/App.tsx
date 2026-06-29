import { useOS } from './os/store'
import { useVisualStyle } from './os/useVisualStyle'
import { Boot } from './components/Boot/Boot'
import { Desktop } from './components/Desktop/Desktop'

export function App() {
  // Keep <body> in sync with the selected visual style for the whole session.
  useVisualStyle()

  const booted = useOS((s) => s.booted)

  return booted ? <Desktop /> : <Boot />
}
