import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Receipt, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAtualizarStatus, useExcluirPedido, usePedidos } from '../../hooks/useData'
import { formatarData } from '../../lib/dates'
import { formatBRL, formatNumber } from '../../lib/format'
import { STATUS, STATUS_ORDEM } from '../../lib/labels'
import { resumoItens, totaisDoPedido } from '../../lib/pedidos'
import type { PedidoCompleto, StatusEntrega } from '../../types/database'
import { mensagemErro, useToast } from '../ui/Toast'
import { ConfirmButton, inputCls } from '../ui/form'
import { Card, EmptyState, ProductThumb, Skeleton, StatusSelect } from './bits'

function Miniaturas({ p }: { p: PedidoCompleto }) {
  return (
    <span className="flex -space-x-2">
      {p.itens.slice(0, 3).map((i) => (
        <span key={i.id} className="rounded-lg ring-2 ring-zinc-900">
          <ProductThumb src={i.produtos?.foto_url} alt={i.produtos?.nome ?? i.produto_nome ?? ''} size="sm" />
        </span>
      ))}
    </span>
  )
}

function Lucro({ p }: { p: PedidoCompleto }) {
  const t = totaisDoPedido(p)
  const cancelado = p.status_entrega === 'cancelado'
  return (
    <span className={`font-semibold ${cancelado ? 'text-zinc-500 line-through' : t.lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {formatBRL(t.lucro)}
      {!cancelado && t.subtotal > 0 && <span className="ml-1.5 text-xs font-normal text-zinc-500">{formatNumber(t.margem)}%</span>}
    </span>
  )
}

/** Histórico de pedidos da Visão geral */
export function SalesHistory() {
  const { data: pedidos = [], isLoading, error } = usePedidos()
  const atualizar = useAtualizarStatus()
  const excluir = useExcluirPedido()
  const notificar = useToast()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<StatusEntrega | 'todos'>('todos')

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return pedidos.filter((p) => {
      if (filtro !== 'todos' && p.status_entrega !== filtro) return false
      if (!q) return true
      return [p.cliente_nome, p.codigo, ...p.itens.map((i) => i.produtos?.nome ?? i.produto_nome ?? '')].some((s) => s.toLowerCase().includes(q))
    })
  }, [pedidos, busca, filtro])

  const mudarStatus = (id: string, status: StatusEntrega) => atualizar.mutate({ id, status }, { onError: (e) => notificar('erro', mensagemErro(e)) })
  const remover = (p: PedidoCompleto) =>
    excluir.mutate(p.id, {
      onSuccess: () => notificar('sucesso', `Pedido ${p.codigo} excluído.`),
      onError: (e) => notificar('erro', mensagemErro(e)),
    })

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5">
        <h2 className="font-display text-lg font-semibold">Histórico de pedidos</h2>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-56 sm:flex-none">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Cliente, produto ou código" aria-label="Buscar pedidos" className={`${inputCls} !py-2 pl-9`} />
          </div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value as StatusEntrega | 'todos')} aria-label="Filtrar por status" className={`${inputCls} !w-auto !py-2`}>
            <option value="todos" className="bg-zinc-900">Todos os status</option>
            {STATUS_ORDEM.map((s) => <option key={s} value={s} className="bg-zinc-900">{STATUS[s].label}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : error ? (
        <p className="p-6 text-sm text-red-300">Erro ao carregar pedidos: {mensagemErro(error)}</p>
      ) : lista.length === 0 ? (
        <EmptyState icon={<Receipt size={24} />} title={pedidos.length ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda'}>
          {pedidos.length ? 'Ajuste a busca ou o filtro.' : 'Use o botão "Novo pedido" para registrar o primeiro.'}
        </EmptyState>
      ) : (
        <>
          {/* Tabela (telas largas) */}
          <div className="relative hidden overflow-x-auto xl:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-medium">Pedido</th>
                  <th className="px-3 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 text-right font-medium">Custo</th>
                  <th className="px-3 py-3 text-right font-medium">Total</th>
                  <th className="px-3 py-3 text-right font-medium">Lucro</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {lista.map((p, i) => {
                    const t = totaisDoPedido(p)
                    return (
                      <motion.tr
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                        exit={{ opacity: 0, x: -20 }}
                        className="border-t border-white/5 transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Miniaturas p={p} />
                            <div className="min-w-0">
                              <p className="font-mono text-xs text-zinc-400">{p.codigo}</p>
                              <p className="max-w-56 truncate font-medium text-zinc-100" title={resumoItens(p, 99)}>{resumoItens(p)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-zinc-300">{p.cliente_nome}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-zinc-400">{formatarData(p.data_pedido)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right text-zinc-400">{formatBRL(t.custo)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-100">{formatBRL(t.total)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right"><Lucro p={p} /></td>
                        <td className="px-3 py-3"><StatusSelect value={p.status_entrega} onChange={(s) => mudarStatus(p.id, s)} /></td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">
                          <Link to={`/dashboard/pedidos/${p.id}/os`} title="Ordem de serviço" aria-label={`Ordem de serviço de ${p.codigo}`} className="inline-flex rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-brand-300">
                            <FileText size={15} />
                          </Link>
                          <ConfirmButton label={`Excluir pedido ${p.codigo}`} onConfirm={() => remover(p)}><Trash2 size={15} /></ConfirmButton>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Cards (mobile e tablets) */}
          <ul className="divide-y divide-white/5 xl:hidden">
            {lista.map((p) => {
              const t = totaisDoPedido(p)
              return (
                <li key={p.id} className="flex gap-3 p-4">
                  <Miniaturas p={p} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{resumoItens(p)}</p>
                        <p className="text-xs text-zinc-500">{p.codigo} · {p.cliente_nome} · {formatarData(p.data_pedido)}</p>
                      </div>
                      <div className="flex shrink-0">
                        <Link to={`/dashboard/pedidos/${p.id}/os`} aria-label={`Ordem de serviço de ${p.codigo}`} className="rounded-lg p-1.5 text-zinc-500 hover:text-brand-300"><FileText size={15} /></Link>
                        <ConfirmButton label={`Excluir pedido ${p.codigo}`} onConfirm={() => remover(p)}><Trash2 size={15} /></ConfirmButton>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-zinc-400">{formatBRL(t.custo)} → <span className="font-medium text-zinc-100">{formatBRL(t.total)}</span></span>
                      <Lucro p={p} />
                    </div>
                    <div className="mt-2"><StatusSelect value={p.status_entrega} onChange={(s) => mudarStatus(p.id, s)} /></div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Card>
  )
}
