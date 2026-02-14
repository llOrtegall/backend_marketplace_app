import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import axios from 'axios'
import './index.css'

import { RouterProvider } from 'react-router'
import { router } from './routes'

axios.defaults.baseURL = 'http://localhost:3000/api/v1'
axios.defaults.withCredentials = true

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
