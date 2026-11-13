import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calculator, FlaskConical, LayoutDashboard, LogOut, Package, RotateCcw, Wallet } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { reiniciarDemo } from '../../lib/api/demoApi'
import { Logo } from '../ui/Logo'

const nav = [
  { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/dashboard/calculadora', label: 'Calculadora', icon: Calculator },
  { to: '/dashboard/produtos', label: 'Produtos', icon: Package },
  { to: '/dashboard/despesas', label: 'Despesas', icon: Wallet },
]

export function DashboardLayout() {
  const { user, demo, sair } = useAuth()
  const qc = useQueryClient()
  const { pathname } = useLocation()

  const handleSair = async () => {
    await sair()
    qc.clear()
  }

  const handleReiniciar = () => {
    reiniciarDemo()
    qc.invalidateQueries()
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/5 bg-zinc-950/80 px-4 py-6 backdrop-blur-xl lg:flex">
        <NavLink to="/" className="px-3">
          <Logo />
        </NavLink>

        <nav className="mt-10 flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-ativo"
                      className="absolute inset-0 rounded-xl bg-white/[0.06] ring-1 ring-white/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                  <item.icon size={18} className={`relative ${isActive ? 'text-orange-400' : ''}`} />
                  <span className="relative">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          {demo && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100/80">
              <p className="flex items-center gap-1.5 font-semibold text-amber-300">
                <FlaskConical size={14} /> Modo demonstração
              </p>
              <p className="mt-1">Dados salvos só neste navegador. Configure o Supabase no .env para usar de verdade.</p>
              <button onClick={handleReiniciar} className="mt-2 inline-flex items-center gap-1 text-amber-300 hover:text-amber-200">
                <RotateCcw size={12} /> Restaurar dados de exemplo
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/5 px-3 py-2.5">
            <span className="truncate text-xs text-zinc-400" title={user?.email ?? ''}>
              {demo ? 'Usuário de demonstração' : user?.email}
            </span>
            {!demo && (
              <button onClick={handleSair} aria-label="Sair" title="Sair" className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Topo (mobile) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <NavLink to="/">
          <Logo />
        </NavLink>
        <div className="flex items-center gap-2">
          {demo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-amber-400/25">
              <FlaskConical size={12} /> Demo
            </span>
          )}
          {!demo && (
            <button onClick={handleSair} aria-label="Sair" className="rounded-lg p-2 text-zinc-400">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-10">
        <div key={pathname} className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Navegação inferior (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/5 bg-zinc-950/90 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium ${isActive ? 'text-orange-400' : 'text-zinc-500'}`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
