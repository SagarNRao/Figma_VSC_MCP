import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './generated.css'
import GeneratedComponent from './GeneratedComponent.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GeneratedComponent />
  </StrictMode>,
)