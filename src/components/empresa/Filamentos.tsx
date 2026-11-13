import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Spool, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useCriarFilamento, useExcluirFilamento, useFilamentos } from '../../hooks/useData'
import { formatBRL } from '../../lib/format'
import { MATERIAIS } from '../../lib/labels'
import { Card, EmptyState, Skeleton } from '../dashboard/bits'
import { Button, ConfirmButton, NumberInput, inputCls, parseNum } from '../ui/form'
import { mensagemErro, useToast } from '../ui/Toast'

export function Filamentos() {
  const { data: filamentos = [], isLoading } = useFilamentos()
  const criar = useCriarFilamento()
  const excluir = useExcluirFilamento()
  const notificar = useToast()

  const [cor, setCor] = useState('')
  const [material, setMaterial] = useState('PLA')
  const [marca, setMarca] = useState('')
  const [preco, setPreco] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!cor.trim() || parseNum(preco) <= 0) return notificar('erro', 'Informe a cor e o preço por kg.')
    try {
      await criar.mutateAsync({ cor: cor.trim(), material, marca: marca.trim() || null, preco_kg: parseNum(preco) })
      setCor('')
      setMarca('')
      setPreco('')
    } catch (err) {
      notificar('erro', mensagemErro(err))
    }
  }

  return (
    <Card>
      <div className="border-b border-white/5 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Spool size={18} className="text-brand-400" /> Filamentos
        </h2>
        <p className="mt-1 text-sm text-zinc-400">Preço por kg de cada cor. Usado pela calculadora para preencher o custo do material.</p>
      </div>

      <form onSubmit={submit} className="grid gap-2 border-b border-white/5 p-5 sm:grid-cols-[1fr_110px_1fr_130px_auto]">
        <input value={cor} onChange={(e) => setCor(e.target.value)} placeholder="Cor (ex.: Preto)" aria-label="Cor" className={inputCls} />
        <select value={material} onChange={(e) => setMaterial(e.target.value)} aria-label="Material" className={inputCls}>
          {MATERIAIS.map((m) => <option key={m} className="bg-zinc-900">{m}</option>)}
        </select>
        <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Marca (opcional)" aria-label="Marca" className={inputCls} />
        <NumberInput value={preco} onChange={setPreco} prefix="R$" suffix="/kg" />
        <Button type="submit" loading={criar.isPending} variant="secondary" aria-label="Adicionar filamento">
          <Plus size={16} />
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : filamentos.length === 0 ? (
        <EmptyState icon={<Spool size={24} />} title="Nenhum filamento cadastrado">
          Adicione acima ou importe da sua planilha.
        </EmptyState>
      ) : (
        <ul className="max-h-96 overflow-y-auto">
          <AnimatePresence initial={false}>
            {filamentos.map((f) => (
              <motion.li
                key={f.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-white/5 first:border-t-0"
              >
                <div className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{f.cor}</span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {f.material}
                      {f.marca && ` · ${f.marca}`}
                    </span>
                  </span>
                  <span className="font-semibold text-zinc-200">{formatBRL(f.preco_kg)}<span className="text-xs font-normal text-zinc-500">/kg</span></span>
                  <ConfirmButton label={`Excluir ${f.cor}`} onConfirm={() => excluir.mutate(f.id, { onError: (e) => notificar('erro', mensagemErro(e)) })}>
                    <Trash2 size={15} />
                  </ConfirmButton>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  )
}
