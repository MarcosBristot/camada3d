import { Loader2 } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { AuthScreen } from '../components/dashboard/AuthScreen'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import Admin from './dashboard/Admin'
import Calculator from './dashboard/Calculator'
import Conta from './dashboard/Conta'
import Empresa from './dashboard/Empresa'
import Expenses from './dashboard/Expenses'
import OrdemServico from './dashboard/OrdemServico'
import Overview from './dashboard/Overview'
import Pedidos from './dashboard/Pedidos'
import Plano from './dashboard/Plano'
import Products from './dashboard/Products'

function DashboardRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <Routes>
      {/* Ordem de serviço: página própria, sem menu, pronta para imprimir */}
      <Route path="pedidos/:id/os" element={<OrdemServico />} />
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="calculadora" element={<Calculator />} />
        <Route path="produtos" element={<Products />} />
        <Route path="despesas" element={<Expenses />} />
        <Route path="empresa" element={<Empresa />} />
        <Route path="conta" element={<Conta />} />
        <Route path="plano" element={<Plano />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<Overview />} />
      </Route>
    </Routes>
  )
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <DashboardRoutes />
    </AuthProvider>
  )
}
