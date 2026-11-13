import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, Calculator, ClipboardList, FlaskConical, LayoutDashboard, LogOut, Package, RotateCcw, UserRound, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTema } from '../../contexts/ThemeContext'
import { usePerfil, useSalvarPerfil } from '../../hooks/useData'
import { reiniciarDemo } from '../../lib/api/demoApi'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'

const nav = [
  { to: '/dashboard', label: 'Visão geral', curto: 'Início', icon: LayoutDashboard, end: true },
  { to: '/dashboard/pedidos', label: 'Pedidos', curto: 'Pedidos', icon: ClipboardList },
  { to: '/dashboard/calculadora', label: 'Calculadora', curto: 'Calcular', icon: Calculator },
  { to: '/dashboard/produtos', label: 'Produtos', curto: 'Produtos', icon: Package },
  { to: '/dashboard/despesas', label: 'Despesas', curto: 'Despesas', icon: Wallet },
  { to: '/dashboard/empresa', label: 'Empresa', curto: 'Empresa', icon: Building2 },
]

/** Logo + nome da empresa (ou a marca farmOps 3D enquanto não houver perfil). */
function Marca() {
  const { data: perfil } = usePerfil()
  if (!perfil) return <Logo />
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {perfil.logo_url ? (
        <img src={perfil.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-xl bg-white/5 object-contain p-0.5 ring-1 ring-white/10" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 font-display text-sm font-bold text-brand-fg">
          {perfil.nome.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="truncate font-display text-lg font-bold tracking-tight">{perfil.nome}</span>
    </span>
  )
}

export function DashboardLayout() {
  const { user, demo, sair } = useAuth()
  const qc = useQueryClient()
  const { pathname } = useLocation()
  const { data: perfil } = usePerfil()
  const salvarPerfil = useSalvarPerfil()
  const { definirTema } = useTema()

  // As cores e o modo salvos no perfil valem para o site todo
  useEffect(() => {
    if (perfil) definirTema({ primaria: perfil.cor_primaria, secundaria: perfil.cor_secundaria, modo: perfil.tema })
  }, [perfil, definirTema])

  const persistirModo = (modo: 'claro' | 'escuro') => {
    if (!perfil) return
    salvarPerfil.mutate({
      input: { nome: perfil.nome, cor_primaria: perfil.cor_primaria, cor_secundaria: perfil.cor_secundaria, tema: modo },
    })
  }

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
        <div className="flex items-center justify-between gap-2 px-3">
          <NavLink to="/dashboard" className="min-w-0">
            <Marca />
          </NavLink>
          <ThemeToggle onChange={persistirModo} />
        </div>

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
                  <item.icon size={18} className={`relative ${isActive ? 'text-brand-400' : ''}`} />
                  <span className="relative">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <nav aria-label="Documentos" className="flex flex-wrap gap-x-3 gap-y-1 px-3 text-[11px] text-zinc-600">
            <NavLink to="/termos" target="_blank" className="hover:text-zinc-400">Termos</NavLink>
            <NavLink to="/privacidade" target="_blank" className="hover:text-zinc-400">Privacidade</NavLink>
            <NavLink to="/contato" target="_blank" className="hover:text-zinc-400">Contato</NavLink>
          </nav>
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
            <NavLink to="/dashboard/conta" className="flex min-w-0 items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100" title="Conta e privacidade">
              <UserRound size={15} className="shrink-0" />
              <span className="truncate">{demo ? 'Usuário de demonstração' : user?.email}</span>
            </NavLink>
            {!demo && (
              <button onClick={handleSair} aria-label="Sair" title="Sair" className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Topo (mobile) */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/5 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <NavLink to="/dashboard" className="min-w-0">
          <Marca />
        </NavLink>
        <div className="flex shrink-0 items-center gap-2">
          {demo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-amber-400/25">
              <FlaskConical size={12} /> Demo
            </span>
          )}
          <ThemeToggle onChange={persistirModo} />
          <NavLink to="/dashboard/conta" aria-label="Conta e privacidade" className="rounded-lg p-2 text-zinc-400">
            <UserRound size={18} />
          </NavLink>
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
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-white/5 bg-zinc-950/90 px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium ${isActive ? 'text-brand-400' : 'text-zinc-500'}`
            }
          >
            <item.icon size={19} />
            {item.curto}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
