import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/globals.css'
import { themeCssVariables } from './styles/tokens'
import App from './components/App'
import { AuthProvider } from './utils/AuthContext'
import { WeightUnitProvider } from './contexts/WeightUnitContext'

type ThemeMode = 'light' | 'dark'

const resolveThemeMode = (): ThemeMode =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'

const applyThemeVariables = (mode: ThemeMode) => {
  const vars = themeCssVariables[mode]
  for (const [name, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(name, value)
  }
}

// ダークモードの初期設定（FOUC防止）
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  applyThemeVariables(resolveThemeMode());
};

initTheme();

const observer = new MutationObserver(() => {
  applyThemeVariables(resolveThemeMode())
})
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WeightUnitProvider>
          <App />
        </WeightUnitProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
