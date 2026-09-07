import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminLogin from './components/AdminLogin.jsx'

const isAdminRoute = window.location.pathname === '/admin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminRoute ? <AdminLogin /> : <App />}
  </StrictMode>,
)
