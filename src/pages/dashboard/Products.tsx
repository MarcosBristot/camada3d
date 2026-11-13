import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Package, Plus, Search, ShoppingCart, Trash2, Weight } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FotoProduto } from '../../components/dashboard/FotoProduto'
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
  const [categoria, setCategoria] = useState<string | null>(null)
  const [vender, setVender] = useState<string | null>(null)
  const fechar = useCallback(() => setVender(null), [])

  const categorias = useMemo(
    () => [...new Set(produtos.map((p) => p.categoria).filter((c): c is string => !!c))].sort(),
    [produtos],
  )

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return produtos
      .filter((p) => !categoria || p.categoria === categoria)
      .filter((p) => !q || [p.nome, p.material, p.cor ?? '', p.categoria ?? ''].some((s) => s.toLowerCase().includes(q)))
  }, [produtos, busca, categoria])

  const remover = (p: Produto) =>
    excluir.mutate(p, {
      onSuccess: () => notificar('sucesso', `"${p.nome}" removido. As vendas antigas continuam no histórico.`),
      onError: (e) => notificar('erro', mensagemErro(e)),
    })

  return (
    <Page>
      <PageHeader
        title="Produtos"
        description="Seu catálogo com custo e preço de cada peça."
        action={
          <Link
            to="/dashboard/calculadora"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-400 px-5 py-2.5 text-sm font-semibold text-brand-fg transition hover:brightness-110"
          >
            <Plus size={18} /> Novo produto
          </Link>
        }
      />

      {produtos.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, cor ou material" aria-label="Buscar produtos" className={`${inputCls} pl-9`} />
          </div>
          {categorias.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por categoria">
              {[null, ...categorias].map((c) => (
                <motion.button
                  key={c ?? 'todas'}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setCategoria(c)}
                  aria-pressed={categoria === c}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                    categoria === c ? 'bg-brand-500/15 text-brand-200 ring-brand-400/40' : 'text-zinc-400 ring-white/10 hover:text-zinc-200'
                  }`}
                >
                  {c ?? 'Todas'}
                </motion.button>
              ))}
            </div>
          )}
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
                Use a <Link to="/dashboard/calculadora" className="text-brand-300 hover:underline">calculadora</Link> para precificar sua
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
                className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 transition-colors hover:border-brand-400/25"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
                  <FotoProduto produto={p} />
                  <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-zinc-950/75 px-2.5 py-1 text-[11px] font-medium text-zinc-100 backdrop-blur">
                    {p.material}
                    {p.cor && ` · ${p.cor}`}
                  </span>
                  {p.categoria && (
                    <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-brand-500/85 px-2.5 py-1 text-[11px] font-semibold text-brand-fg">{p.categoria}</span>
                  )}
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
                    {p.tempo_maquina_horas > 0 ? (
                      <span className="flex items-center gap-1"><Clock size={13} /> {formatNumber(p.tempo_maquina_horas)} h</span>
                    ) : (
                      <span title="Custo considera só o material (sem tempo de máquina/energia)">só material</span>
                    )}
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Custo {formatBRL(p.custo_base)} · lucro {formatBRL((p.preco_venda ?? p.preco_sugerido) - p.custo_base)}
                      </p>
                      <p className="text-gradient font-display text-2xl font-bold">{formatBRL(p.preco_venda ?? p.preco_sugerido)}</p>
                      {p.preco_venda !== null && Math.abs(p.preco_venda - p.preco_sugerido) > 0.01 && (
                        <p className="text-[11px] text-zinc-500">sugerido {formatBRL(p.preco_sugerido)}</p>
                      )}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setVender(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium transition hover:border-brand-400/40 hover:text-brand-200"
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
