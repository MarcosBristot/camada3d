import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './components/ui/Toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { capturarOrigem } from './lib/origem'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './index.css'

// Guarda de qual anúncio/post a pessoa veio (antes do React mexer na URL)
capturarOrigem()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* Respeita "reduzir movimento" do sistema operacional */}
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <ToastProvider>
              <App />
            </ToastProvider>
          </MotionConfig>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
