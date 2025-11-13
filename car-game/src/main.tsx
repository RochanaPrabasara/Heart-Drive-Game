import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />,
    <Toaster
        position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold',
        },
      }}
      />
  </StrictMode>,
)
