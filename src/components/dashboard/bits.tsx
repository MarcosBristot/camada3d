import { motion } from 'framer-motion'
import { Box } from 'lucide-react'
import type { ReactNode } from 'react'
import { STATUS, STATUS_ORDEM } from '../../lib/labels'
import type { StatusEntrega } from '../../types/database'

export function ProductThumb({ src, alt, size = 'md' }: { src: string | null | undefined; alt: string; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-10 w-10 rounded-lg' : 'h-12 w-12 rounded-xl'
  return src ? (
    <img src={src} alt={alt} loading="lazy" className={`${cls} shrink-0 object-cover ring-1 ring-white/10`} />
  ) : (
    <span
      aria-hidden
      className={`${cls} flex shrink-0 items-center justify-center bg-gradient-to-br from-orange-500/20 to-zinc-800 text-orange-300/80 ring-1 ring-white/10`}
    >
      <Box size={size === 'sm' ? 16 : 20} />
    </span>
  )
}

export function StatusBadge({ status }: { status: StatusEntrega }) {
  const s = STATUS[status]
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${s.cls}`}>{s.label}</span>
}

export function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: StatusEntrega
  onChange: (s: StatusEntrega) => void
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      aria-label="Status de entrega"
      onChange={(e) => onChange(e.target.value as StatusEntrega)}
      className={`cursor-pointer appearance-none rounded-full border-0 px-3 py-1 text-xs font-medium ring-1 outline-none transition focus:ring-2 disabled:opacity-50 ${STATUS[value].cls}`}
    >
      {STATUS_ORDEM.map((s) => (
        <option key={s} value={s} className="bg-zinc-900 text-zinc-100">
          {STATUS[s].label}
        </option>
      ))}
    </select>
  )
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-zinc-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/10 bg-zinc-900/60 ${className}`}>{children}</div>
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-zinc-400">{icon}</span>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      {children && <div className="mt-2 max-w-sm text-sm text-zinc-400">{children}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />
}

/** Entrada suave de cada página do painel. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
