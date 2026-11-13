import { motion } from 'framer-motion'
import { CircleDollarSign, Plus, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { NovaVendaModal } from '../../components/dashboard/NovaVendaModal'
import { SalesHistory } from '../../components/dashboard/SalesHistory'
import { Page, PageHeader, Skeleton } from '../../components/dashboard/bits'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { Button } from '../../components/ui/form'
import { useResumo, useVendas } from '../../hooks/useData'
import { formatBRL, formatNumber } from '../../lib/format'

interface StatProps {
  label: string
  value: number
  icon: ReactNode
  tone: 'orange' | 'red' | 'emerald' | 'sky'
  sub?: ReactNode
  format?: (n: number) => string
  loading?: boolean
  index: number
}

const tones = {
  orange: 'from-brand-500/20 text-brand-300 ring-brand-400/20',
  red: 'from-red-500/15 text-red-300 ring-red-400/20',
  emerald: 'from-emerald-500/15 text-emerald-300 ring-emerald-400/20',
  sky: 'from-sky-500/15 text-sky-300 ring-sky-400/20',
}

function StatCard({ label, value, icon, tone, sub, format, loading, index }: StatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br to-transparent ring-1 ${tones[tone]}`}>{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-32" />
      ) : (
        <AnimatedNumber value={value} format={format} className="mt-2 block font-display text-3xl font-bold tracking-tight" />
      )}
      {sub && <div className="mt-2 text-xs text-zinc-500">{sub}</div>}
    </motion.div>
  )
}

export default function Overview() {
  const { data: r, isLoading } = useResumo()
  const { data: vendas = [] } = useVendas()
  const [aberto, setAberto] = useState(false)
  const fechar = useCallback(() => setAberto(false), [])

  const pendentes = vendas.filter((v) => !['entregue', 'cancelado'].includes(v.status_entrega)).length
  const margemLiquida = r && r.faturamentoTotal > 0 ? (r.lucroLiquido / r.faturamentoTotal) * 100 : 0

  return (
    <Page>
      <PageHeader
        title="Visão geral"
        description="Resultado consolidado de todas as vendas (canceladas não entram)."
        action={
          <Button onClick={() => setAberto(true)} className="!px-5">
            <Plus size={18} /> Nova venda
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} loading={isLoading} label="Faturamento total" value={r?.faturamentoTotal ?? 0} icon={<CircleDollarSign size={18} />} tone="orange" />
        <StatCard
          index={1}
          loading={isLoading}
          label="Gastos"
          value={r?.gastosTotal ?? 0}
          icon={<TrendingDown size={18} />}
          tone="red"
          sub={r && <>Produtos {formatBRL(r.custoProdutos)} · Operação {formatBRL(r.despesasOperacionais)}</>}
        />
        <StatCard
          index={2}
          loading={isLoading}
          label="Lucro líquido"
          value={r?.lucroLiquido ?? 0}
          icon={<TrendingUp size={18} />}
          tone="emerald"
          sub={r && r.faturamentoTotal > 0 && <>Margem líquida de {formatNumber(margemLiquida)}%</>}
        />
        <StatCard
          index={3}
          loading={isLoading}
          label="Vendas"
          value={r?.totalVendas ?? 0}
          format={(n) => String(Math.round(n))}
          icon={<ReceiptText size={18} />}
          tone="sky"
          sub={pendentes > 0 ? `${pendentes} aguardando entrega` : 'Nenhuma entrega pendente'}
        />
      </div>

      <div className="mt-8">
        <SalesHistory />
      </div>

      <NovaVendaModal open={aberto} onClose={fechar} />
    </Page>
  )
}
