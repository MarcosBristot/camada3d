import { Calculator } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCriarVenda, useProdutos } from '../../hooks/useData'
import { hojeISO } from '../../lib/dates'
import { formatBRL, formatNumber } from '../../lib/format'
import { STATUS, STATUS_ORDEM } from '../../lib/labels'
import type { StatusEntrega } from '../../types/database'
import { Modal } from '../ui/Modal'
import { mensagemErro, useToast } from '../ui/Toast'
import { Button, Field, NumberInput, inputCls, parseNum } from '../ui/form'
import { EmptyState } from './bits'

interface Props {
  open: boolean
  onClose: () => void
  produtoInicialId?: string | null
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const paraCampo = (n: number) => n.toFixed(2).replace('.', ',')

export function NovaVendaModal({ open, onClose, produtoInicialId }: Props) {
  const { data: produtos = [], isLoading } = useProdutos()
  const criar = useCriarVenda()
  const notificar = useToast()

  const [produtoId, setProdutoId] = useState('')
  const [cliente, setCliente] = useState('')
  const [data, setData] = useState(hojeISO())
  const [qtd, setQtd] = useState('1')
  const [preco, setPreco] = useState('')
  const [precoEditado, setPrecoEditado] = useState(false)
  const [status, setStatus] = useState<StatusEntrega>('pendente')
  const [obs, setObs] = useState('')
  const [tentou, setTentou] = useState(false)

  // Reinicia o formulário sempre que abre
  useEffect(() => {
    if (!open) return
    setProdutoId(produtoInicialId ?? '')
    setCliente('')
    setData(hojeISO())
    setQtd('1')
    setPreco('')
    setPrecoEditado(false)
    setStatus('pendente')
    setObs('')
    setTentou(false)
  }, [open, produtoInicialId])

  const produto = useMemo(() => produtos.find((p) => p.id === produtoId), [produtos, produtoId])
  const quantidade = Math.max(1, Math.floor(parseNum(qtd)))

  // Preço acompanha o sugerido até o usuário editar manualmente
  useEffect(() => {
    if (!precoEditado) setPreco(produto ? paraCampo(round2(produto.preco_sugerido * quantidade)) : '')
  }, [produto, quantidade, precoEditado])

  const precoFinal = parseNum(preco)
  const custo = produto ? round2(produto.custo_base * quantidade) : 0
  const lucro = round2(precoFinal - custo)
  const margem = precoFinal > 0 ? (lucro / precoFinal) * 100 : 0

  const erros = {
    produto: !produtoId ? 'Escolha o produto vendido.' : undefined,
    cliente: !cliente.trim() ? 'Informe quem comprou.' : undefined,
    preco: preco.trim() === '' ? 'Informe o valor cobrado.' : undefined,
  }
  const valido = !erros.produto && !erros.cliente && !erros.preco

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTentou(true)
    if (!valido) return
    try {
      await criar.mutateAsync({
        produto_id: produtoId,
        cliente_nome: cliente.trim(),
        data_venda: data,
        quantidade,
        preco_final: round2(precoFinal),
        status_entrega: status,
        observacoes: obs.trim() || null,
      })
      notificar('sucesso', `Venda para ${cliente.trim()} registrada: ${formatBRL(precoFinal)}.`)
      onClose()
    } catch (err) {
      notificar('erro', mensagemErro(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova venda" description="O custo é congelado com base no produto no momento do registro.">
      {!isLoading && produtos.length === 0 ? (
        <EmptyState icon={<Calculator size={24} />} title="Nenhum produto cadastrado">
          Calcule o preço de uma peça e salve-a como produto para registrar vendas.
          <div className="mt-5">
            <Link to="/dashboard/calculadora" onClick={onClose} className="font-medium text-orange-300 hover:text-orange-200">
              Abrir calculadora →
            </Link>
          </div>
        </EmptyState>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Produto" htmlFor="venda-produto" error={tentou ? erros.produto : undefined}>
            <select id="venda-produto" value={produtoId} onChange={(e) => setProdutoId(e.target.value)} className={inputCls}>
              <option value="" className="bg-zinc-900">Selecione…</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900">
                  {p.nome} — {formatBRL(p.preco_sugerido)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Cliente" htmlFor="venda-cliente" error={tentou ? erros.cliente : undefined}>
            <input id="venda-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} maxLength={120} placeholder="Nome de quem comprou" className={inputCls} autoComplete="off" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data" htmlFor="venda-data">
              <input id="venda-data" type="date" value={data} max={hojeISO(365)} onChange={(e) => setData(e.target.value || hojeISO())} className={`${inputCls} [color-scheme:dark]`} />
            </Field>
            <Field label="Quantidade" htmlFor="venda-qtd">
              <NumberInput id="venda-qtd" value={qtd} onChange={(v) => setQtd(v.replace(/[.,]/g, ''))} suffix="un" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Valor cobrado (total)"
              htmlFor="venda-preco"
              error={tentou ? erros.preco : undefined}
              hint={produto && precoEditado ? undefined : produto ? 'Preenchido com o preço sugerido.' : undefined}
            >
              <NumberInput id="venda-preco" value={preco} onChange={(v) => { setPreco(v); setPrecoEditado(true) }} prefix="R$" invalid={tentou && !!erros.preco} />
            </Field>
            <Field label="Status" htmlFor="venda-status">
              <select id="venda-status" value={status} onChange={(e) => setStatus(e.target.value as StatusEntrega)} className={inputCls}>
                {STATUS_ORDEM.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">{STATUS[s].label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Observações (opcional)" htmlFor="venda-obs">
            <input id="venda-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Cor, endereço, forma de pagamento…" className={inputCls} />
          </Field>

          {/* Prévia do resultado */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/[0.03] p-4 text-center ring-1 ring-white/5">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Custo</p>
              <p className="mt-1 font-semibold text-zinc-200">{formatBRL(custo)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Faturado</p>
              <p className="mt-1 font-semibold text-zinc-200">{formatBRL(precoFinal)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Lucro</p>
              <p className={`mt-1 font-semibold ${lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatBRL(lucro)}
                {precoFinal > 0 && <span className="block text-[11px] font-normal text-zinc-500">{formatNumber(margem)}%</span>}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={criar.isPending}>Registrar venda</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
