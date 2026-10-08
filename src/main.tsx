import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// No StrictMode — it runs effects twice in dev which causes pdfjs
// to try transferring an already-detached ArrayBuffer on the second run.
createRoot(document.getElementById('root')!).render(
  <App />
)