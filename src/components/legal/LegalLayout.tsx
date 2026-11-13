import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LEGAL, dataVigencia, pendenciasLegais } from '../../config/legal'
import { Logo } from '../ui/Logo'
import { ThemeToggle } from '../ui/ThemeToggle'
import { RodapeLegal } from './RodapeLegal'

export const DOCUMENTOS = [
  { to: '/termos', label: 'Termos de Uso' },
  { to: '/privacidade', label: 'Política de Privacidade' },
  { to: '/cookies', label: 'Cookies e armazenamento' },
  { to: '/reembolso', label: 'Cancelamento e Reembolso' },
  { to: '/contato', label: 'Contato' },
]

export interface ItemSumario {
  id: string
  titulo: string
}

interface Props {
  titulo: string
  resumo: string
  sumario?: ItemSumario[]
  children: ReactNode
}

/** Estrutura comum das páginas legais (legível, imprimível, com sumário). */
export function LegalLayout({ titulo, resumo, sumario = [], children }: Props) {
  const pendencias = import.meta.env.DEV ? pendenciasLegais() : []

  useEffect(() => {
    document.title = `${titulo} — ${LEGAL.servico}`
    window.scrollTo(0, 0)
    return () => {
      document.title = `${LEGAL.servico} — Gestão para impressão 3D`
    }
  }, [titulo])

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" aria-label={`${LEGAL.servico} — início`}>
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100 sm:inline-flex">
              <ArrowLeft size={15} /> Voltar ao site
            </Link>
          </div>
        </div>
      </header>

      {pendencias.length > 0 && (
        <div className="border-b border-amber-400/20 bg-amber-400/10 px-6 py-3 text-sm text-amber-200 print:hidden">
          <div className="mx-auto flex max-w-6xl gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" />
            <p>
              <strong>Só aparece em desenvolvimento:</strong> {pendencias.length} campo(s) a preencher em{' '}
              <code className="rounded bg-black/20 px-1">src/config/legal.ts</code> antes do deploy (rode{' '}
              <code className="rounded bg-black/20 px-1">npm run check:legal</code>).
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-14">
        {/* Navegação entre documentos + sumário */}
        <aside className="space-y-8 print:hidden lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Documentos legais" className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {DOCUMENTOS.map((d) => (
              <NavLink
                key={d.to}
                to={d.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-white/[0.06] font-medium text-zinc-50 ring-1 ring-white/10' : 'text-zinc-400 hover:text-zinc-100'
                  }`
                }
              >
                {d.label}
              </NavLink>
            ))}
          </nav>
          {sumario.length > 0 && (
            <div className="hidden lg:block">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Nesta página</p>
              <ol className="space-y-1 border-l border-white/10">
                {sumario.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-xs leading-snug text-zinc-500 hover:border-brand-400 hover:text-zinc-200">
                      {i + 1}. {s.titulo}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="legal min-w-0 max-w-3xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">{LEGAL.servico}</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">{titulo}</h1>
          <p className="mt-4 text-lg text-zinc-400">{resumo}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
            <span>Vigente desde {dataVigencia()}</span>
            <span>Versão {LEGAL.versao}</span>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1 hover:text-zinc-300 print:hidden">
              <Printer size={13} /> Imprimir / salvar PDF
            </button>
          </div>
          <div className="mt-10">{children}</div>
        </motion.article>
      </div>

      <RodapeLegal />
    </div>
  )
}

/** Seção numerada com âncora. */
export function Secao({ id, n, titulo, children }: { id: string; n: number; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/5 py-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-xl font-semibold text-zinc-100">
        <span className="mr-2 text-brand-400">{n}.</span>
        {titulo}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-zinc-300">{children}</div>
    </section>
  )
}

/** Lista com marcadores no estilo dos textos legais. */
export function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Destaque({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-brand-500/[0.07] p-4 text-zinc-200 ring-1 ring-brand-400/20">{children}</div>
}

export const Email = ({ endereco, assunto }: { endereco: string; assunto?: string }) =>
  endereco.includes('[PREENCHER') ? (
    <span className="font-medium text-amber-300">{endereco}</span>
  ) : (
    <a href={`mailto:${endereco}${assunto ? `?subject=${encodeURIComponent(assunto)}` : ''}`} className="font-medium text-brand-300 underline-offset-2 hover:underline">
      {endereco}
    </a>
  )
