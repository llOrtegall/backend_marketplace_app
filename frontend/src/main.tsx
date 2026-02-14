import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import axios from 'axios'
import './index.css'

axios.defaults.baseURL = 'http://localhost:4000/api/v1'
axios.defaults.withCredentials = true

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="text-center text-2xl font-bold">test</div>
  </StrictMode>,
)
