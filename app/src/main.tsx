import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/instrument-sans'
import './index.css'
import App from './App.tsx'
import { applyTheme, getTheme } from './utils/theme'
import { applyDirection } from './i18n'
import { applyModeIcons, getNutritionMode } from './utils/nutritionMode'

applyTheme(getTheme())
applyDirection()
const initialMode = getNutritionMode()
applyModeIcons(initialMode)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialMode={initialMode} />
  </StrictMode>,
)
