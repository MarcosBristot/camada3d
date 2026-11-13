import { AnimatePresence, motion } from 'framer-motion'
import { Box, Clock, Package, Plus, Search, ShoppingCart, Trash2, Weight } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NovaVendaModal } from '../../components/dashboard/NovaVendaModal'
import { Card, EmptyState, Page, PageHeader, Skeleton } from '../../components/dashboard/bits'
import { ConfirmButton, inputCls } from '../../components/ui/form'
import { mensagemErro, useToast } from '../../components/ui/Toast'
import { useExcluirProduto, useProdutos } from '../../hooks/useData'
import { formatBRL, formatNumber } from '../../lib/format'
import type { Produto } from '../../types/database'

export default function Products() {
  const { data: produtos = [], isLoading, error } = useProdutos()
  const excluir = useExcluirProduto()
  const notificar = useToast()
  const [busca, setBusca] = useState('')
  const [vender, setVender] = useState<string | null>(null)
  const fechar = useCallback(() => setVender(null), [])

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? produtos.filter((p) => p.nome.toLowerCase().includes(q) || p.material.toLowerCase().includes(q)) : produtos
  }, [produtos, busca])

  const remover = (p: Produto) =>
    excluir.mutate(p, {
      onSuccess: () => notificar('sucesso', `"${p.nome}" removido. As vendas antigas continuam no histórico.`),
      onError: (e) => notificar('erro', mensagemErro(e)),
    })

  return (
    <Page>
      <PageHeader
        title="Produtos"
        description="Seu catálogo com custo e preço sugerido de cada peça."
        action={
          <Link
            to="/dashboard/calculadora"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:brightness-110"
          >
            <Plus size={18} /> Novo produto
          </Link>
        }
      />

      {produtos.length > 0 && (
        <div className="relative mb-6 max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou material" aria-label="Buscar produtos" className={`${inputCls} pl-9`} />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-3xl" />)}
        </div>
      ) : error ? (
        <Card className="p-6 text-sm text-red-300">Erro ao carregar produtos: {mensagemErro(error)}</Card>
      ) : lista.length === 0 ? (
        <Card>
          <EmptyState icon={<Package size={24} />} title={produtos.length ? 'Nenhum produto encontrado' : 'Seu catálogo está vazio'}>
            {produtos.length ? (
              'Tente outro termo de busca.'
            ) : (
              <>
                Use a <Link to="/dashboard/calculadora" className="text-orange-300 hover:underline">calculadora</Link> para precificar sua
                primeira peça e salvá-la aqui.
              </>
            )}
          </EmptyState>
        </Card>
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {lista.map((p, i) => (
              <motion.article
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.05 } }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 transition-colors hover:border-orange-400/25"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="bg-layers flex h-full w-full items-center justify-center text-orange-300/50">
                      <Box size={44} />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-zinc-200 backdrop-blur">{p.material}</span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold leading-tight">{p.nome}</h3>
                    <ConfirmButton label={`Excluir ${p.nome}`} onConfirm={() => remover(p)}>
                      <Trash2 size={15} />
                    </ConfirmButton>
                  </div>
                  {p.descricao && <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{p.descricao}</p>}

                  <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Weight size={13} /> {formatNumber(p.peso_gramas)} g</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {formatNumber(p.tempo_maquina_horas)} h</span>
                    <span>margem {formatNumber(p.margem_lucro_pct)}%</span>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs text-zinc-500">Custo {formatBRL(p.custo_base)}</p>
                      <p className="text-gradient font-display text-2xl font-bold">{formatBRL(p.preco_sugerido)}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setVender(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium transition hover:border-orange-400/40 hover:text-orange-200"
                    >
                      <ShoppingCart size={15} /> Vender
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <NovaVendaModal open={vender !== null} onClose={fechar} produtoInicialId={vender} />
    </Page>
  )
}
