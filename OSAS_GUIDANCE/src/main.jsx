import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// MOBILE BACK CACHE FIX (NO FLICKER)
window.onpageshow = (event) => {
  if (event.persisted) {
    window.location.replace("/student_login");
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)