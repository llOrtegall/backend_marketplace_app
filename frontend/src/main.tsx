import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import axios from 'axios'
import './index.css'

import Header from './components/Header'

axios.defaults.baseURL = 'http://localhost:3000/api/v1'
axios.defaults.withCredentials = true

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Header />
  </StrictMode>,
)
