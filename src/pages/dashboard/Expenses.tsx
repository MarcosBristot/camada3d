import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Card, EmptyState, Page, PageHeader, Skeleton } from '../../components/dashboard/bits'
import { Button, ConfirmButton, Field, NumberInput, inputCls, parseNum } from '../../components/ui/form'
import { mensagemErro, useToast } from '../../components/ui/Toast'
import { useCriarDespesa, useDespesas, useExcluirDespesa } from '../../hooks/useData'
import { formatarData, hojeISO } from '../../lib/dates'
import { formatBRL } from '../../lib/format'
import { CATEGORIAS } from '../../lib/labels'
import type { CategoriaDespesa } from '../../types/database'

export default function Expenses() {
  const { data: despesas = [], isLoading, error } = useDespesas()
  const criar = useCriarDespesa()
  const excluir = useExcluirDespesa()
  const notificar = useToast()

  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDespesa>('manutencao')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hojeISO())
  const [tentou, setTentou] = useState(false)

  const erros = {
    descricao: !descricao.trim() ? 'Descreva a despesa.' : undefined,
    valor: parseNum(valor) <= 0 ? 'Informe um valor maior que zero.' : undefined,
  }

  const total = useMemo(() => despesas.reduce((t, d) => t + d.valor, 0), [despesas])
  const porCategoria = useMemo(() => {
    const m = new Map<CategoriaDespesa, number>()
    despesas.forEach((d) => m.set(d.categoria, (m.get(d.categoria) ?? 0) + d.valor))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [despesas])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTentou(true)
    if (erros.descricao || erros.valor) return
    try {
      await criar.mutateAsync({ descricao: descricao.trim(), categoria, valor: parseNum(valor), data_despesa: data })
      notificar('sucesso', 'Despesa registrada.')
      setDescricao('')
      setValor('')
      setTentou(false)
    } catch (err) {
      notificar('erro', mensagemErro(err))
    }
  }

  return (
    <Page>
      <PageHeader
        title="Despesas operacionais"
        description="Gastos do negócio que não estão no custo de cada peça. Entram no cálculo do lucro líquido."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="p-6 xl:sticky xl:top-10">
          <h2 className="mb-5 font-display text-base font-semibold">Nova despesa</h2>
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field label="Descrição" htmlFor="desp-desc" error={tentou ? erros.descricao : undefined}>
              <input id="desp-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={200} placeholder="Ex.: Troca de bico, frete de filamento" className={inputCls} />
            </Field>
            <Field label="Categoria" htmlFor="desp-cat">
              <select id="desp-cat" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaDespesa)} className={inputCls}>
                {Object.entries(CATEGORIAS).map(([k, label]) => (
                  <option key={k} value={k} className="bg-zinc-900">{label}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor" htmlFor="desp-valor" error={tentou ? erros.valor : undefined}>
                <NumberInput id="desp-valor" value={valor} onChange={setValor} prefix="R$" invalid={tentou && !!erros.valor} />
              </Field>
              <Field label="Data" htmlFor="desp-data">
                <input id="desp-data" type="date" value={data} onChange={(e) => setData(e.target.value || hojeISO())} className={`${inputCls} [color-scheme:dark]`} />
              </Field>
            </div>
            <p className="text-xs text-zinc-500">
              Não lance aqui filamento e energia já usados nas peças vendidas: eles entram pelo custo de cada venda.
            </p>
            <Button type="submit" loading={criar.isPending} className="w-full">
              <Plus size={16} /> Adicionar despesa
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5">
            <h2 className="font-display text-lg font-semibold">Lançamentos</h2>
            <p className="text-sm text-zinc-400">
              Total <span className="ml-1 font-display text-lg font-semibold text-red-300">{formatBRL(total)}</span>
            </p>
          </div>

          {porCategoria.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-white/5 px-5 py-4">
              {porCategoria.map(([cat, v]) => (
                <span key={cat} className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-zinc-300 ring-1 ring-white/10">
                  {CATEGORIAS[cat]} · {formatBRL(v)}
                </span>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : error ? (
            <p className="p-6 text-sm text-red-300">Erro ao carregar despesas: {mensagemErro(error)}</p>
          ) : despesas.length === 0 ? (
            <EmptyState icon={<Wallet size={24} />} title="Nenhuma despesa lançada">
              Manutenção, embalagens em lote, frete e assinaturas entram aqui.
            </EmptyState>
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {despesas.map((d) => (
                  <motion.li
                    key={d.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-white/5 first:border-t-0"
                  >
                    <div className="flex items-center gap-4 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{d.descricao}</p>
                        <p className="text-xs text-zinc-500">{CATEGORIAS[d.categoria]} · {formatarData(d.data_despesa)}</p>
                      </div>
                      <span className="whitespace-nowrap font-semibold text-red-300">− {formatBRL(d.valor)}</span>
                      <ConfirmButton
                        label="Excluir despesa"
                        onConfirm={() => excluir.mutate(d.id, { onError: (e) => notificar('erro', mensagemErro(e)) })}
                      >
                        <Trash2 size={15} />
                      </ConfirmButton>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}
