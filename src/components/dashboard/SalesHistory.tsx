import { AnimatePresence, motion } from 'framer-motion'
import { Receipt, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAtualizarStatus, useExcluirVenda, useVendas } from '../../hooks/useData'
import { formatarData } from '../../lib/dates'
import { formatBRL, formatNumber } from '../../lib/format'
import { STATUS, STATUS_ORDEM } from '../../lib/labels'
import type { StatusEntrega, VendaComProduto } from '../../types/database'
import { mensagemErro, useToast } from '../ui/Toast'
import { ConfirmButton, inputCls } from '../ui/form'
import { Card, EmptyState, ProductThumb, Skeleton, StatusSelect } from './bits'

function Lucro({ v }: { v: VendaComProduto }) {
  const margem = v.preco_final > 0 ? (v.lucro / v.preco_final) * 100 : 0
  const cancelada = v.status_entrega === 'cancelado'
  return (
    <span className={`font-semibold ${cancelada ? 'text-zinc-500 line-through' : v.lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {formatBRL(v.lucro)}
      {!cancelada && v.preco_final > 0 && <span className="ml-1.5 text-xs font-normal text-zinc-500">{formatNumber(margem)}%</span>}
    </span>
  )
}

export function SalesHistory() {
  const { data: vendas = [], isLoading, error } = useVendas()
  const atualizar = useAtualizarStatus()
  const excluir = useExcluirVenda()
  const notificar = useToast()

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<StatusEntrega | 'todos'>('todos')

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return vendas.filter((v) => {
      if (filtro !== 'todos' && v.status_entrega !== filtro) return false
      if (!q) return true
      const nome = v.produtos?.nome ?? v.produto_nome ?? ''
      return v.cliente_nome.toLowerCase().includes(q) || nome.toLowerCase().includes(q)
    })
  }, [vendas, busca, filtro])

  const mudarStatus = (id: string, status: StatusEntrega) =>
    atualizar.mutate({ id, status }, { onError: (e) => notificar('erro', mensagemErro(e)) })

  const remover = (v: VendaComProduto) =>
    excluir.mutate(v.id, {
      onSuccess: () => notificar('sucesso', `Venda de ${v.cliente_nome} excluída.`),
      onError: (e) => notificar('erro', mensagemErro(e)),
    })

  const nomeProduto = (v: VendaComProduto) => v.produtos?.nome ?? v.produto_nome ?? 'Produto removido'

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5">
        <h2 className="font-display text-lg font-semibold">Histórico de vendas</h2>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-56 sm:flex-none">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente ou produto" aria-label="Buscar vendas" className={`${inputCls} !py-2 pl-9`} />
          </div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value as StatusEntrega | 'todos')} aria-label="Filtrar por status" className={`${inputCls} !w-auto !py-2`}>
            <option value="todos" className="bg-zinc-900">Todos os status</option>
            {STATUS_ORDEM.map((s) => (
              <option key={s} value={s} className="bg-zinc-900">{STATUS[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : error ? (
        <p className="p-6 text-sm text-red-300">Erro ao carregar vendas: {mensagemErro(error)}</p>
      ) : lista.length === 0 ? (
        <EmptyState icon={<Receipt size={24} />} title={vendas.length ? 'Nenhuma venda encontrada' : 'Nenhuma venda ainda'}>
          {vendas.length ? 'Ajuste a busca ou o filtro.' : 'Use o botão "Nova venda" para registrar a primeira.'}
        </EmptyState>
      ) : (
        <>
          {/* Tabela (telas largas) */}
          <div className="relative hidden overflow-x-auto xl:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-3 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 text-right font-medium">Custo</th>
                  <th className="px-3 py-3 text-right font-medium">Faturado</th>
                  <th className="px-3 py-3 text-right font-medium">Lucro</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {lista.map((v, i) => (
                    <motion.tr
                      key={v.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                      exit={{ opacity: 0, x: -20 }}
                      className="border-t border-white/5 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb src={v.produtos?.foto_url} alt={nomeProduto(v)} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-100">{nomeProduto(v)}</p>
                            <p className="text-xs text-zinc-500">{v.quantidade} un.</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-zinc-300">{v.cliente_nome}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-zinc-400">{formatarData(v.data_venda)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-zinc-400">{formatBRL(v.custo_total)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-100">{formatBRL(v.preco_final)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right"><Lucro v={v} /></td>
                      <td className="px-3 py-3">
                        <StatusSelect value={v.status_entrega} onChange={(s) => mudarStatus(v.id, s)} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <ConfirmButton label="Excluir venda" onConfirm={() => remover(v)}>
                          <Trash2 size={15} />
                        </ConfirmButton>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Cards (mobile e tablets) */}
          <ul className="divide-y divide-white/5 xl:hidden">
            {lista.map((v) => (
              <li key={v.id} className="flex gap-3 p-4">
                <ProductThumb src={v.produtos?.foto_url} alt={nomeProduto(v)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{nomeProduto(v)}</p>
                      <p className="text-xs text-zinc-500">
                        {v.cliente_nome} · {formatarData(v.data_venda)} · {v.quantidade} un.
                      </p>
                    </div>
                    <ConfirmButton label="Excluir venda" onConfirm={() => remover(v)}>
                      <Trash2 size={15} />
                    </ConfirmButton>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-zinc-400">
                      {formatBRL(v.custo_total)} → <span className="font-medium text-zinc-100">{formatBRL(v.preco_final)}</span>
                    </span>
                    <Lucro v={v} />
                  </div>
                  <div className="mt-2">
                    <StatusSelect value={v.status_entrega} onChange={(s) => mudarStatus(v.id, s)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
