import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './components/App'
import { AuthProvider } from './utils/AuthContext'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)