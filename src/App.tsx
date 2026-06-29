import { useOS } from './os/store'
import { useVisualStyle } from './os/useVisualStyle'
import { Boot } from './components/Boot/Boot'
import { Logon } from './components/Logon/Logon'
import { Desktop } from './components/Desktop/Desktop'

export function App() {
  // Keep <body> in sync with the selected visual style for the whole session.
  useVisualStyle()

  const booted = useOS((s) => s.booted)
  const loggedIn = useOS((s) => s.loggedIn)

  if (!booted) return <Boot />
  if (!loggedIn) return <Logon />
  return <Desktop />
}
