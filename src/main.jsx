import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { supabase } from './lib/supabase'
import Setup from './pages/Setup'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {supabase ? (
        <AuthProvider>
          <App />
        </AuthProvider>
      ) : (
        <Setup />
      )}
    </BrowserRouter>
  </StrictMode>,
)
