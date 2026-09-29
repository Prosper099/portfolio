import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'
import './styles/chrome.css'
import './styles/chapters.css'

// headless entry: the whole app, mounted into #root, for the smoke test
const el = document.getElementById('root')
if (el) createRoot(el).render(<App />)
