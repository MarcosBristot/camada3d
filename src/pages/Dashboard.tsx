import { Loader2 } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { AuthScreen } from '../components/dashboard/AuthScreen'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import Calculator from './dashboard/Calculator'
import Empresa from './dashboard/Empresa'
import Expenses from './dashboard/Expenses'
import Overview from './dashboard/Overview'
import Pedidos from './dashboard/Pedidos'
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
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="calculadora" element={<Calculator />} />
        <Route path="produtos" element={<Products />} />
        <Route path="despesas" element={<Expenses />} />
        <Route path="empresa" element={<Empresa />} />
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
