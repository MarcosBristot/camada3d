import { AnimatePresence, motion } from 'framer-motion'
import { Calculator, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCriarPedido, usePedidos, useProdutos } from '../../hooks/useData'
import { hojeISO } from '../../lib/dates'
import { formatBRL, formatNumber } from '../../lib/format'
import { STATUS, STATUS_ORDEM } from '../../lib/labels'
import { ehErroDeLimite, proximoCodigo } from '../../lib/pedidos'
import type { StatusEntrega } from '../../types/database'
import { Modal } from '../ui/Modal'
import { mensagemErro, useToast } from '../ui/Toast'
import { Button, Field, NumberInput, inputCls, parseNum } from '../ui/form'
import { EmptyState, ProductThumb } from './bits'

interface Props {
  open: boolean
  onClose: () => void
  produtoInicialId?: string | null
}

interface Linha {
  chave: string
  produtoId: string
  qtd: string
  preco: string
  precoEditado: boolean
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const paraCampo = (n: number) => n.toFixed(2).replace('.', ',')
const FORMAS = ['PIX', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Transferência', 'Outro']
const novaLinha = (produtoId = ''): Linha => ({ chave: crypto.randomUUID(), produtoId, qtd: '1', preco: '', precoEditado: false })

export function NovoPedidoModal({ open, onClose, produtoInicialId }: Props) {
  const { data: produtos = [], isLoading } = useProdutos()
  const { data: pedidos = [] } = usePedidos()
  const criar = useCriarPedido()
  const notificar = useToast()

  const [linhas, setLinhas] = useState<Linha[]>([novaLinha()])
  const [cliente, setCliente] = useState('')
  const [contato, setContato] = useState('')
  const [codigo, setCodigo] = useState('')
  const [data, setData] = useState(hojeISO())
  const [prazo, setPrazo] = useState('')
  const [status, setStatus] = useState<StatusEntrega>('pendente')
  const [pago, setPago] = useState(false)
  const [forma, setForma] = useState('PIX')
  const [frete, setFrete] = useState('')
  const [desconto, setDesconto] = useState('')
  const [obs, setObs] = useState('')
  const [tentou, setTentou] = useState(false)
  const [erroLimite, setErroLimite] = useState<string | null>(null)

  // Reinicia ao abrir
  useEffect(() => {
    if (!open) return
    setLinhas([novaLinha(produtoInicialId ?? '')])
    setCliente('')
    setContato('')
    setData(hojeISO())
    setPrazo('')
    setStatus('pendente')
    setPago(false)
    setForma('PIX')
    setFrete('')
    setDesconto('')
    setObs('')
    setTentou(false)
    setErroLimite(null)
  }, [open, produtoInicialId])

  useEffect(() => {
    if (open) setCodigo(proximoCodigo(pedidos.map((p) => p.codigo)))
  }, [open, pedidos])

  const porId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos])
  const unitario = (id: string) => {
    const p = porId.get(id)
    return p ? p.preco_venda ?? p.preco_sugerido : 0
  }

  // Preço de cada linha acompanha o preço do produto até ser editado
  const linhasCalc = linhas.map((l) => {
    const p = porId.get(l.produtoId)
    const qtd = Math.max(1, Math.floor(parseNum(l.qtd)))
    const preco = l.precoEditado ? parseNum(l.preco) : round2(unitario(l.produtoId) * qtd)
    return { ...l, produto: p, qtdNum: qtd, precoNum: preco, custo: p ? round2(p.custo_base * qtd) : 0 }
  })

  const subtotal = round2(linhasCalc.reduce((t, l) => t + (l.produto ? l.precoNum : 0), 0))
  const descontoNum = parseNum(desconto)
  const freteNum = parseNum(frete)
  const custo = round2(linhasCalc.reduce((t, l) => t + l.custo, 0))
  const receita = round2(subtotal - descontoNum)
  const lucro = round2(receita - custo)
  const total = round2(receita + freteNum)

  const alterar = (chave: string, mudanca: Partial<Linha>) =>
    setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, ...mudanca } : l)))

  const validas = linhasCalc.filter((l) => l.produto)
  const erros = {
    itens: validas.length === 0 ? 'Adicione pelo menos um produto.' : undefined,
    cliente: !cliente.trim() ? 'Informe quem comprou.' : undefined,
    codigo: !codigo.trim() ? 'Informe o código.' : undefined,
    desconto: descontoNum > subtotal ? 'O desconto é maior que o subtotal.' : undefined,
  }
  const valido = !Object.values(erros).some(Boolean)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTentou(true)
    setErroLimite(null)
    if (!valido) return
    try {
      await criar.mutateAsync({
        codigo: codigo.trim(),
        cliente_nome: cliente.trim(),
        cliente_contato: contato.trim() || null,
        data_pedido: data,
        prazo_entrega: prazo || null,
        status_entrega: status,
        pago,
        forma_pagamento: forma,
        frete: round2(freteNum),
        desconto: round2(descontoNum),
        observacoes: obs.trim() || null,
        itens: validas.map((l) => ({ produto_id: l.produtoId, quantidade: l.qtdNum, preco_final: round2(l.precoNum) })),
      })
      notificar('sucesso', `${codigo.trim()} de ${cliente.trim()} registrado: ${formatBRL(total)}.`)
      onClose()
    } catch (err) {
      if (ehErroDeLimite(err)) setErroLimite(mensagemErro(err))
      else notificar('erro', mensagemErro(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} largo title="Novo pedido" description="Adicione um ou mais produtos. O custo de cada item fica congelado no registro.">
      {!isLoading && produtos.length === 0 ? (
        <EmptyState icon={<Calculator size={24} />} title="Nenhum produto cadastrado">
          Calcule o preço de uma peça e salve-a como produto para registrar pedidos.
          <div className="mt-5">
            <Link to="/dashboard/calculadora" onClick={onClose} className="font-medium text-brand-300 hover:text-brand-200">
              Abrir calculadora →
            </Link>
          </div>
        </EmptyState>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          {/* Cliente */}
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_130px]">
            <Field label="Cliente" htmlFor="ped-cliente" error={tentou ? erros.cliente : undefined}>
              <input id="ped-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} maxLength={120} placeholder="Nome de quem comprou" className={inputCls} autoComplete="off" />
            </Field>
            <Field label="Contato (opcional)" htmlFor="ped-contato">
              <input id="ped-contato" value={contato} onChange={(e) => setContato(e.target.value)} maxLength={120} placeholder="WhatsApp ou e-mail" className={inputCls} autoComplete="off" />
            </Field>
            <Field label="Código" htmlFor="ped-codigo" error={tentou ? erros.codigo : undefined}>
              <input id="ped-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} maxLength={30} className={`${inputCls} font-mono`} />
            </Field>
          </div>

          {/* Itens */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Itens</span>
              {tentou && erros.itens && <span className="text-xs text-red-400">{erros.itens}</span>}
            </div>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {linhasCalc.map((l, idx) => (
                  <motion.div
                    key={l.chave}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-[40px_1fr_auto] items-center gap-2 rounded-2xl bg-white/[0.03] p-2 ring-1 ring-white/5 sm:grid-cols-[40px_1fr_80px_120px_auto]"
                  >
                    <ProductThumb src={l.produto?.foto_url} alt={l.produto?.nome ?? ''} size="sm" />
                    <select
                      value={l.produtoId}
                      onChange={(e) => alterar(l.chave, { produtoId: e.target.value, precoEditado: false })}
                      aria-label={`Produto do item ${idx + 1}`}
                      className={`${inputCls} !py-2`}
                    >
                      <option value="" className="bg-zinc-900">Selecione o produto…</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id} className="bg-zinc-900">
                          {p.nome} — {formatBRL(p.preco_venda ?? p.preco_sugerido)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setLinhas((ls) => (ls.length > 1 ? ls.filter((x) => x.chave !== l.chave) : [novaLinha()]))}
                      aria-label={`Remover item ${idx + 1}`}
                      className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-red-300 sm:order-last"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="col-span-3 grid grid-cols-2 gap-2 sm:col-span-1 sm:contents">
                      <NumberInput value={l.qtd} onChange={(v) => alterar(l.chave, { qtd: v.replace(/[.,]/g, '') })} suffix="un" />
                      <NumberInput
                        value={l.precoEditado ? l.preco : l.produto ? paraCampo(l.precoNum) : ''}
                        onChange={(v) => alterar(l.chave, { preco: v, precoEditado: true })}
                        prefix="R$"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setLinhas((ls) => [...ls, novaLinha()])}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-300 hover:bg-brand-500/10"
            >
              <Plus size={15} /> Adicionar item
            </button>
            <p className="mt-1 text-xs text-zinc-500">O valor de cada linha é o total do item (quantidade × preço). Edite se cobrou diferente.</p>
          </div>

          {/* Datas e status */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Data do pedido" htmlFor="ped-data">
              <input id="ped-data" type="date" value={data} onChange={(e) => setData(e.target.value || hojeISO())} className={`${inputCls} [color-scheme:dark]`} />
            </Field>
            <Field label="Prazo de entrega" htmlFor="ped-prazo">
              <input id="ped-prazo" type="date" value={prazo} min={data} onChange={(e) => setPrazo(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
            </Field>
            <Field label="Status" htmlFor="ped-status">
              <select id="ped-status" value={status} onChange={(e) => setStatus(e.target.value as StatusEntrega)} className={inputCls}>
                {STATUS_ORDEM.map((s) => <option key={s} value={s} className="bg-zinc-900">{STATUS[s].label}</option>)}
              </select>
            </Field>
          </div>

          {/* Pagamento */}
          <div className="grid items-end gap-3 sm:grid-cols-4">
            <Field label="Frete (repasse)" htmlFor="ped-frete">
              <NumberInput id="ped-frete" value={frete} onChange={setFrete} prefix="R$" />
            </Field>
            <Field label="Desconto" htmlFor="ped-desconto" error={tentou ? erros.desconto : undefined}>
              <NumberInput id="ped-desconto" value={desconto} onChange={setDesconto} prefix="R$" invalid={tentou && !!erros.desconto} />
            </Field>
            <Field label="Pagamento" htmlFor="ped-forma">
              <select id="ped-forma" value={forma} onChange={(e) => setForma(e.target.value)} className={inputCls}>
                {FORMAS.map((f) => <option key={f} className="bg-zinc-900">{f}</option>)}
              </select>
            </Field>
            <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ring-1 transition ${pago ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30' : 'text-zinc-400 ring-white/10'}`}>
              <input type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} className="h-4 w-4 accent-brand-500" />
              {pago ? 'Já foi pago' : 'Não pago'}
            </label>
          </div>

          <Field label="Observações (aparecem na ordem de serviço)" htmlFor="ped-obs">
            <textarea id="ped-obs" value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Cores, acabamento, personalização, endereço de entrega…" className={`${inputCls} resize-y`} />
          </Field>

          {/* Totais */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.03] p-4 text-sm ring-1 ring-white/5 sm:grid-cols-5">
            {[
              ['Subtotal', formatBRL(subtotal)],
              ['Custo', formatBRL(custo)],
              ['Lucro', formatBRL(lucro), lucro >= 0 ? 'text-emerald-400' : 'text-red-400'],
              ['Margem', receita > 0 ? `${formatNumber((lucro / receita) * 100)}%` : '—'],
              ['Total a cobrar', formatBRL(total), 'text-gradient text-base'],
            ].map(([rotulo, valor, cls]) => (
              <div key={rotulo}>
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">{rotulo}</p>
                <p className={`mt-0.5 font-display font-semibold ${cls ?? 'text-zinc-200'}`}>{valor}</p>
              </div>
            ))}
          </div>

          {erroLimite && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand-500/10 px-4 py-3 text-sm ring-1 ring-brand-400/30">
              <Sparkles size={16} className="text-brand-300" />
              <span className="flex-1 text-zinc-200">{erroLimite}</span>
              <Link to="/dashboard/plano" onClick={onClose} className="font-semibold text-brand-300 hover:underline">Ver o Pro →</Link>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={criar.isPending}>Registrar pedido</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
