import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AvisoArmazenamento } from './components/legal/AvisoArmazenamento'
import { AvisoErroLink } from './components/ui/AvisoErroLink'
import Landing from './pages/Landing'

// O painel (Supabase, formulários) só é baixado quando o usuário entra nele
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Termos = lazy(() => import('./pages/legal/Termos'))
const Privacidade = lazy(() => import('./pages/legal/Privacidade'))
const Cookies = lazy(() => import('./pages/legal/Cookies'))
const Reembolso = lazy(() => import('./pages/legal/Reembolso'))
const Contato = lazy(() => import('./pages/legal/Contato'))
const RedefinirSenha = lazy(() => import('./pages/RedefinirSenha'))

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
        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/reembolso" element={<Reembolso />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <AvisoArmazenamento />
      <AvisoErroLink />
    </Suspense>
  )
}
