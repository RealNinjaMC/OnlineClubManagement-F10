import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ClubsProvider } from './context/ClubsContext'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClubsProvider>
        <App />
      </ClubsProvider>
    </BrowserRouter>
  </StrictMode>,
)
