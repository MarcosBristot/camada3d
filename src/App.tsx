import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'

// O painel (Supabase, formulários) só é baixado quando o usuário entra nele
const Dashboard = lazy(() => import('./pages/Dashboard'))

const Carregando = () => (
  <div className="flex min-h-screen items-center justify-center text-zinc-500">
    <Loader2 className="animate-spin" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Carregando />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </Suspense>
  )
}
