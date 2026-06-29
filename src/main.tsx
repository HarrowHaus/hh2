import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Order matters: visual-style tokens first, then global base that consumes them.
import '../tokens/themes.css'
import './styles/global.css'

import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
