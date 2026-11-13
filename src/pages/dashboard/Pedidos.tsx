import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CalendarClock, CheckCheck, CircleDollarSign, FileText, Hammer, PackageCheck, Plus, Search, Truck, Undo2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { NovoPedidoModal } from '../../components/dashboard/NovoPedidoModal'
import { Card, EmptyState, Page, PageHeader, ProductThumb, Skeleton, StatusSelect } from '../../components/dashboard/bits'
import { mensagemErro, useToast } from '../../components/ui/Toast'
import { Button, inputCls } from '../../components/ui/form'
import { useAtualizarPagamento, useAtualizarStatus, usePedidos } from '../../hooks/useData'
import { formatarData, hojeISO } from '../../lib/dates'
import { formatBRL } from '../../lib/format'
import { formatarHoras, totaisDoPedido } from '../../lib/pedidos'
import type { PedidoCompleto, StatusEntrega } from '../../types/database'

type AbaId = 'fazer' | 'concluidos' | 'entregues'

const ABAS: { id: AbaId; label: string; status: StatusEntrega[]; icon: typeof Hammer; vazio: string }[] = [
  { id: 'fazer', label: 'A fazer', status: ['pendente', 'em_producao'], icon: Hammer, vazio: 'Nenhum pedido esperando produção.' },
  { id: 'concluidos', label: 'Concluídos', status: ['pronto', 'enviado'], icon: PackageCheck, vazio: 'Nada pronto aguardando entrega.' },
  { id: 'entregues', label: 'Entregues', status: ['entregue'], icon: Truck, vazio: 'Nenhuma entrega registrada ainda.' },
]

/** Próximo passo natural de cada status. */
const ACAO: Record<StatusEntrega, { label: string; para: StatusEntrega; icon: typeof Hammer } | null> = {
  pendente: { label: 'Iniciar produção', para: 'em_producao', icon: Hammer },
  em_producao: { label: 'Concluir', para: 'pronto', icon: CheckCheck },
  pronto: { label: 'Marcar entregue', para: 'entregue', icon: Truck },
  enviado: { label: 'Marcar entregue', para: 'entregue', icon: Truck },
  entregue: { label: 'Desfazer entrega', para: 'pronto', icon: Undo2 },
  cancelado: null,
}

const SUBSTATUS: Partial<Record<StatusEntrega, { label: string; cls: string }>> = {
  pendente: { label: 'Na fila', cls: 'text-amber-300' },
  em_producao: { label: 'Imprimindo', cls: 'text-cyan-300' },
  pronto: { label: 'Pronto', cls: 'text-violet-300' },
  enviado: { label: 'Enviado', cls: 'text-sky-300' },
}

function diasDesde(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const [hy, hm, hd] = hojeISO().split('-').map(Number)
  return Math.round((Date.UTC(hy, hm - 1, hd) - Date.UTC(y, m - 1, d)) / 86400000)
}

function CartaoPedido({
  v,
  onStatus,
  onPago,
  ocupado,
}: {
  v: PedidoCompleto
  onStatus: (s: StatusEntrega) => void
  onPago: () => void
  ocupado: boolean
}) {
  const acao = ACAO[v.status_entrega]
  const sub = SUBSTATUS[v.status_entrega]
  const dias = diasDesde(v.data_pedido)
  const emAberto = v.status_entrega === 'pendente' || v.status_entrega === 'em_producao'
  const diasPrazo = v.prazo_entrega ? -diasDesde(v.prazo_entrega) : null
  const atrasado = emAberto && (diasPrazo !== null ? diasPrazo < 0 : dias >= 7)
  const t = totaisDoPedido(v)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="flex flex-col rounded-3xl border border-white/10 bg-zinc-900/60 p-4 transition-colors hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium leading-tight text-zinc-100">{v.cliente_nome}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {formatarData(v.data_pedido)} · {dias <= 0 ? 'hoje' : dias === 1 ? 'há 1 dia' : `há ${dias} dias`}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{v.codigo}</span>
      </div>

      {/* Itens */}
      <ul className="mt-3 space-y-1.5">
        {v.itens.slice(0, 3).map((i) => (
          <li key={i.id} className="flex items-center gap-2 text-sm">
            <ProductThumb src={i.produtos?.foto_url} alt={i.produtos?.nome ?? i.produto_nome ?? ''} size="sm" />
            <span className="min-w-0 flex-1 truncate text-zinc-300">{i.produtos?.nome ?? i.produto_nome ?? 'Produto removido'}</span>
            <span className="shrink-0 text-xs font-semibold text-brand-300">×{i.quantidade}</span>
          </li>
        ))}
        {v.itens.length > 3 && <li className="pl-12 text-xs text-zinc-500">+ {v.itens.length - 3} item(ns)</li>}
      </ul>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
        <span>{t.pecas} peça(s)</span>
        {t.gramas > 0 && <span>{t.gramas.toLocaleString('pt-BR')} g</span>}
        {t.horas > 0 && <span>{formatarHoras(t.horas)} de máquina</span>}
        {v.prazo_entrega && (
          <span className={`inline-flex items-center gap-1 ${atrasado ? 'font-semibold text-red-300' : ''}`}>
            <CalendarClock size={11} /> {atrasado ? 'atrasado · ' : ''}entrega {formatarData(v.prazo_entrega)}
          </span>
        )}
        {!v.prazo_entrega && atrasado && <span className="font-medium text-red-300">atenção: {dias} dias</span>}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold">{formatBRL(t.total)}</span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onPago}
            disabled={ocupado}
            title={v.pago ? 'Marcar como não pago' : 'Marcar como pago'}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition disabled:opacity-50 ${
              v.pago ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25' : 'bg-red-400/10 text-red-300 ring-red-400/25'
            }`}
          >
            <CircleDollarSign size={12} /> {v.pago ? 'Pago' : 'A receber'}
          </motion.button>
        </div>
        {sub && <span className={`text-xs font-medium ${sub.cls}`}>{sub.label}</span>}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
        {acao && (
          <Button
            variant={v.status_entrega === 'entregue' ? 'ghost' : 'secondary'}
            onClick={() => onStatus(acao.para)}
            disabled={ocupado}
            className="flex-1 !py-2 text-xs"
          >
            <acao.icon size={14} /> {acao.label}
            {v.status_entrega !== 'entregue' && <ArrowRight size={13} className="opacity-60" />}
          </Button>
        )}
        <Link
          to={`/dashboard/pedidos/${v.id}/os`}
          title="Ordem de serviço"
          aria-label={`Ordem de serviço de ${v.codigo}`}
          className="rounded-xl p-2 text-zinc-400 ring-1 ring-white/10 transition hover:text-brand-300"
        >
          <FileText size={15} />
        </Link>
        <StatusSelect value={v.status_entrega} onChange={onStatus} disabled={ocupado} />
      </div>
    </motion.article>
  )
}

export default function Pedidos() {
  const { data: vendas = [], isLoading, error } = usePedidos()

  const atualizar = useAtualizarStatus()
  const pagamento = useAtualizarPagamento()
  const notificar = useToast()
  const [params, setParams] = useSearchParams()
  const aba = (ABAS.find((a) => a.id === params.get('aba'))?.id ?? 'fazer') as AbaId
  const [busca, setBusca] = useState('')
  const [soAReceber, setSoAReceber] = useState(false)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [novaVenda, setNovaVenda] = useState(false)
  const fecharNova = useCallback(() => setNovaVenda(false), [])

  const contagem = useMemo(() => {
    const c: Record<AbaId, number> = { fazer: 0, concluidos: 0, entregues: 0 }
    vendas.forEach((v) => {
      const a = ABAS.find((x) => x.status.includes(v.status_entrega))
      if (a) c[a.id]++
    })
    return c
  }, [vendas])

  const lista = useMemo(() => {
    const def = ABAS.find((a) => a.id === aba)!
    const q = busca.trim().toLowerCase()
    return vendas
      .filter((v) => def.status.includes(v.status_entrega))
      .filter((v) => !soAReceber || !v.pago)
      .filter((v) => {
        if (!q) return true
        return [v.cliente_nome, v.codigo, ...v.itens.map((i) => i.produtos?.nome ?? i.produto_nome ?? '')].some((s) => s.toLowerCase().includes(q))
      })
      .sort((a, b) =>
        // fila de produção: mais antigos primeiro; entregues: mais recentes primeiro
        // fila: prazo mais próximo primeiro (sem prazo vai pelo mais antigo); entregues: mais recentes primeiro
        aba === 'entregues'
          ? b.data_pedido.localeCompare(a.data_pedido)
          : (a.prazo_entrega ?? '9999').localeCompare(b.prazo_entrega ?? '9999') || a.data_pedido.localeCompare(b.data_pedido) || a.codigo.localeCompare(b.codigo),
      )
  }, [vendas, aba, busca, soAReceber])

  const aReceber = useMemo(
    () => lista.filter((v) => !v.pago).reduce((t, v) => t + totaisDoPedido(v).total, 0),
    [lista],
  )

  const mudarStatus = (v: PedidoCompleto, status: StatusEntrega) => {
    setOcupado(v.id)
    atualizar.mutate(
      { id: v.id, status },
      {
        onSuccess: () => {
          const destino = ABAS.find((a) => a.status.includes(status))
          if (destino && destino.id !== aba) notificar('sucesso', `${v.codigo} movido para "${destino.label}".`)
        },
        onError: (e) => notificar('erro', mensagemErro(e)),
        onSettled: () => setOcupado(null),
      },
    )
  }

  const alternarPago = (v: PedidoCompleto) => {
    setOcupado(v.id)
    pagamento.mutate(
      { id: v.id, pago: !v.pago },
      { onError: (e) => notificar('erro', mensagemErro(e)), onSettled: () => setOcupado(null) },
    )
  }

  const abaAtual = ABAS.find((a) => a.id === aba)!

  return (
    <Page>
      <PageHeader
        title="Pedidos"
        description="Acompanhe a produção: do pedido recebido até a entrega."
        action={
          <Button onClick={() => setNovaVenda(true)} className="!px-5">
            <Plus size={18} /> Novo pedido
          </Button>
        }
      />

      {/* Abas */}
      <div role="tablist" aria-label="Etapas do pedido" className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/60 p-1">
        {ABAS.map((a) => {
          const ativa = a.id === aba
          return (
            <button
              key={a.id}
              role="tab"
              aria-selected={ativa}
              onClick={() => setParams(a.id === 'fazer' ? {} : { aba: a.id }, { replace: true })}
              className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                ativa ? 'text-brand-fg' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {ativa && (
                <motion.span
                  layoutId="aba-pedidos"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500 to-accent-400 shadow-[0_0_24px_-8px_color-mix(in_oklab,var(--brand)_80%,transparent)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <a.icon size={16} className="relative" />
              <span className="relative">{a.label}</span>
              <span
                className={`relative min-w-6 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  ativa ? 'bg-black/15 text-brand-fg' : 'bg-white/5 text-zinc-400'
                }`}
              >
                {contagem[a.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Cliente, produto ou código" aria-label="Buscar pedidos" className={`${inputCls} pl-9`} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={soAReceber} onChange={(e) => setSoAReceber(e.target.checked)} className="h-4 w-4 accent-brand-500" />
          Só a receber
        </label>
        {aReceber > 0 && (
          <span className="ml-auto text-sm text-zinc-400">
            A receber nesta aba: <strong className="text-red-300">{formatBRL(aReceber)}</strong>
          </span>
        )}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-3xl" />)}
          </div>
        ) : error ? (
          <Card className="p-6 text-sm text-red-300">Erro ao carregar pedidos: {mensagemErro(error)}</Card>
        ) : lista.length === 0 ? (
          <Card>
            <EmptyState icon={<abaAtual.icon size={24} />} title={busca || soAReceber ? 'Nenhum pedido encontrado' : abaAtual.vazio} />
          </Card>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {lista.map((v) => (
                <CartaoPedido key={v.id} v={v} ocupado={ocupado === v.id} onStatus={(s) => mudarStatus(v, s)} onPago={() => alternarPago(v)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <NovoPedidoModal open={novaVenda} onClose={fecharNova} />
    </Page>
  )
}
