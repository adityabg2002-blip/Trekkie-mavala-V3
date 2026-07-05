import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { installApiShim } from './lib/apiShim'
import App from './App.tsx'

// Rewrite legacy /api/* paths to the consolidated serverless functions.
// Must run before any component fetches.
installApiShim()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
