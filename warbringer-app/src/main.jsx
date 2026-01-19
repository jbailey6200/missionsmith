import React from 'react'
import ReactDOM from 'react-dom/client'
import Warbringer from './Warbringer'
import { Analytics } from "@vercel/analytics/react"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Warbringer />
    <Analytics />
  </React.StrictMode>,
)