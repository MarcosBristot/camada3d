import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ChevronDown, FileSpreadsheet, Upload, X } from 'lucide-react'
import { useState, type DragEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useImportar, usePlano } from '../../hooks/useData'
import type { ResultadoImportacao } from '../../lib/api'
import { formatarData } from '../../lib/dates'
import { formatBRL, formatNumber } from '../../lib/format'
import { montarPlano, type PlanoImportacao, type StatusDestino } from '../../lib/importacao/planilha'
import { STATUS, STATUS_ORDEM } from '../../lib/labels'
import { Card } from '../dashboard/bits'
import { Button } from '../ui/form'
import { mensagemErro, useToast } from '../ui/Toast'

function Secao({ titulo, total, marcados, children }: { titulo: string; total: number; marcados: number; children: ReactNode }) {
  const [aberta, setAberta] = useState(false)
  return (
    <div className="rounded-2xl ring-1 ring-white/10">
      <button type="button" onClick={() => setAberta((a) => !a)} aria-expanded={aberta} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="font-medium">
          {titulo} <span className="ml-1 text-sm text-zinc-500">{marcados} de {total} selecionados</span>
        </span>
        <ChevronDown size={18} className={`text-zinc-500 transition-transform ${aberta ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="max-h-80 overflow-auto border-t border-white/5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Check = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} className="h-4 w-4 cursor-pointer accent-brand-500" />
)

const Aviso = ({ texto }: { texto?: string }) =>
  texto ? (
    <span className="mt-0.5 flex items-start gap-1 text-xs text-amber-300">
      <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {texto}
    </span>
  ) : null

const th = 'sticky top-0 bg-zinc-900 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500'
const td = 'px-3 py-2 align-top'

const planoInfoFree = (p: string | undefined) => p === 'free'

export function ImportarPlanilha() {
  const [arquivo, setArquivo] = useState<string | null>(null)
  const [plano, setPlano] = useState<PlanoImportacao | null>(null)
  const [lendo, setLendo] = useState(false)
  const [arrastando, setArrastando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  const importar = useImportar()
  const { data: infoPlano } = usePlano()
  const planoAtual = infoPlano?.plano
  const notificar = useToast()

  const ler = async (f: File | undefined) => {
    if (!f) return
    if (!/\.xlsx$/i.test(f.name)) return notificar('erro', 'Envie um arquivo .xlsx (Excel).')
    setLendo(true)
    setResultado(null)
    try {
      const { default: readXlsxFile } = await import('read-excel-file/browser')
      const abas = await readXlsxFile(f)
      const p = montarPlano(abas as Parameters<typeof montarPlano>[0])
      if (!p.produtos.length && !p.vendas.length && !p.filamentos.length) throw new Error('Não encontrei as abas Filamentos, Produtos ou Vendas nessa planilha.')
      setPlano(p)
      setArquivo(f.name)
    } catch (err) {
      notificar('erro', mensagemErro(err))
    } finally {
      setLendo(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    ler(e.dataTransfer.files?.[0])
  }

  type Lista = 'filamentos' | 'produtos' | 'vendas' | 'despesas'
  const marcar = (lista: Lista, i: number, v: boolean) =>
    setPlano((p) => (p ? { ...p, [lista]: p[lista].map((x, j) => (j === i ? { ...x, incluir: v } : x)) } : p))
  const mapear = (status: string, destino: StatusDestino) => setPlano((p) => (p ? { ...p, mapaStatus: { ...p.mapaStatus, [status]: destino } } : p))

  const sel = plano && {
    filamentos: plano.filamentos.filter((x) => x.incluir),
    produtos: plano.produtos.filter((x) => x.incluir),
    vendas: plano.vendas.filter((x) => x.incluir),
    despesas: plano.despesas.filter((x) => x.incluir),
  }
  const totalSel = sel ? sel.filamentos.length + sel.produtos.length + sel.vendas.length + sel.despesas.length : 0
  const contaStatus = (s: string) => plano?.vendas.filter((v) => v.statusPlanilha === s).length ?? 0

  const executar = async () => {
    if (!plano || !sel) return
    try {
      const r = await importar.mutateAsync({
        ...sel,
        vendas: sel.vendas.map((v) => ({ ...v, status: plano.mapaStatus[v.statusPlanilha] ?? 'pendente' })),
      })
      setResultado(r)
      setPlano(null)
      notificar('sucesso', `Importação concluída: ${r.produtos.criados} produtos e ${r.vendas.criados} pedidos.`)
    } catch (err) {
      notificar('erro', mensagemErro(err))
    }
  }

  return (
    <Card>
      <div className="border-b border-white/5 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <FileSpreadsheet size={18} className="text-brand-400" /> Importar planilha
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Lê as abas <strong>Filamentos</strong>, <strong>Produtos</strong>, <strong>Vendas</strong> e <strong>Marketing</strong>. Você revisa tudo antes de gravar e pode importar de novo sem duplicar.
        </p>
      </div>

      <div className="space-y-5 p-6">
        {planoInfoFree(planoAtual) && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand-500/10 px-4 py-4 text-sm ring-1 ring-brand-400/25">
            <span className="flex-1 text-zinc-200">A importação de planilhas faz parte do plano Pro. No Free, cadastre pela calculadora.</span>
            <Link to="/dashboard/plano" className="font-semibold text-brand-300 hover:underline">Ver o Pro →</Link>
          </div>
        )}

        {!plano && !planoInfoFree(planoAtual) && (
          <label
            onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
            onDragLeave={() => setArrastando(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
              arrastando ? 'border-brand-400 bg-brand-500/10' : 'border-white/10 hover:border-white/25'
            }`}
          >
            <Upload size={26} className={lendo ? 'animate-bounce text-brand-300' : 'text-zinc-500'} />
            <span className="font-medium">{lendo ? 'Lendo planilha…' : 'Clique ou arraste o arquivo .xlsx'}</span>
            <span className="text-xs text-zinc-500">O arquivo é lido no seu navegador. Nada é enviado antes de você confirmar.</span>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => { ler(e.target.files?.[0]); e.target.value = '' }} />
          </label>
        )}

        {resultado && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-emerald-400/5 p-5 ring-1 ring-emerald-400/20">
            <p className="flex items-center gap-2 font-semibold text-emerald-300">
              <CheckCircle2 size={18} /> Importação concluída
            </p>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
              {(['filamentos', 'produtos', 'vendas', 'despesas'] as const).map((k) => (
                <li key={k} className="rounded-xl bg-white/[0.03] px-3 py-2">
                  <span className="block font-display text-xl font-bold">{resultado[k].criados}</span>
                  <span className="text-zinc-400">{k === 'vendas' ? 'pedidos novos' : k === 'despesas' ? 'despesas novas' : `${k} novos`}</span>
                  {resultado[k].ignorados > 0 && <span className="block text-xs text-zinc-500">{resultado[k].ignorados} já existiam</span>}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link to="/dashboard/pedidos" className="font-medium text-brand-300 hover:underline">Ver pedidos →</Link>
              <Link to="/dashboard/produtos" className="font-medium text-brand-300 hover:underline">Ver produtos →</Link>
            </div>
          </motion.div>
        )}

        {plano && sel && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-zinc-300">
                <FileSpreadsheet size={16} className="text-emerald-400" /> {arquivo}
              </p>
              <button onClick={() => setPlano(null)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
                <X size={14} /> Trocar arquivo
              </button>
            </div>

            {plano.avisos.length > 0 && (
              <ul className="space-y-1.5 rounded-2xl bg-amber-400/5 p-4 text-sm text-amber-100/90 ring-1 ring-amber-400/20">
                {plano.avisos.map((a) => (
                  <li key={a} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-300" /> {a}</li>
                ))}
              </ul>
            )}

            {/* Mapeamento de status */}
            {Object.keys(plano.mapaStatus).length > 0 && (
              <div className="rounded-2xl p-4 ring-1 ring-white/10">
                <p className="mb-3 text-sm font-medium">Status da planilha → aba de pedidos</p>
                <div className="space-y-2">
                  {Object.entries(plano.mapaStatus).map(([s, destino]) => (
                    <div key={s} className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="min-w-48 text-zinc-300">{s} <span className="text-zinc-500">({contaStatus(s)})</span></span>
                      <span className="text-zinc-600">→</span>
                      <select value={destino} onChange={(e) => mapear(s, e.target.value as StatusDestino)} className="rounded-lg bg-zinc-950/60 px-2 py-1 text-sm ring-1 ring-white/10" aria-label={`Destino de ${s}`}>
                        {STATUS_ORDEM.map((x) => <option key={x} value={x} className="bg-zinc-900">{STATUS[x].label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-zinc-500">"Pago" no status vira a marcação de pagamento do pedido.</p>
              </div>
            )}

            <Secao titulo="Filamentos" total={plano.filamentos.length} marcados={sel.filamentos.length}>
              <table className="w-full text-sm">
                <thead><tr><th className={th} /><th className={th}>Cor</th><th className={th}>Material</th><th className={th}>Marca</th><th className={`${th} text-right`}>R$/kg</th></tr></thead>
                <tbody>
                  {plano.filamentos.map((f, i) => (
                    <tr key={f.linha} className={`border-t border-white/5 ${f.incluir ? '' : 'opacity-50'}`}>
                      <td className={td}><Check checked={f.incluir} onChange={(v) => marcar('filamentos', i, v)} label={`Importar ${f.cor}`} /></td>
                      <td className={td}>{f.cor}<Aviso texto={f.aviso} /></td>
                      <td className={td}>{f.material}</td>
                      <td className={td}>{f.marca ?? '—'}</td>
                      <td className={`${td} text-right`}>{f.precoKg !== null ? formatNumber(f.precoKg) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Secao>

            <Secao titulo="Produtos" total={plano.produtos.length} marcados={sel.produtos.length}>
              <table className="w-full text-sm">
                <thead><tr><th className={th} /><th className={th}>Produto</th><th className={th}>Cor</th><th className={`${th} text-right`}>Gramas</th><th className={`${th} text-right`}>Custo</th><th className={`${th} text-right`}>Preço</th></tr></thead>
                <tbody>
                  {plano.produtos.map((p, i) => (
                    <tr key={p.linha} className={`border-t border-white/5 ${p.incluir ? '' : 'opacity-50'}`}>
                      <td className={td}><Check checked={p.incluir} onChange={(v) => marcar('produtos', i, v)} label={`Importar ${p.nome}`} /></td>
                      <td className={td}>{p.nome}<span className="block text-xs text-zinc-500">{p.categoria}</span><Aviso texto={p.aviso} /></td>
                      <td className={td}>{p.cor ?? '—'}</td>
                      <td className={`${td} text-right`}>{formatNumber(p.gramas)}</td>
                      <td className={`${td} whitespace-nowrap text-right`}>{p.custoCalculado !== null ? formatBRL(p.custoCalculado) : '—'}</td>
                      <td className={`${td} whitespace-nowrap text-right font-medium`}>{p.precoVenda !== null ? formatBRL(p.precoVenda) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Secao>

            <Secao titulo="Pedidos (aba Vendas)" total={plano.vendas.length} marcados={sel.vendas.length}>
              <table className="w-full text-sm">
                <thead><tr><th className={th} /><th className={th}>Pedido</th><th className={th}>Cliente</th><th className={th}>Produto</th><th className={`${th} text-right`}>Total</th><th className={th}>Vai para</th></tr></thead>
                <tbody>
                  {plano.vendas.map((v, i) => (
                    <tr key={v.linha} className={`border-t border-white/5 ${v.incluir ? '' : 'opacity-50'}`}>
                      <td className={td}><Check checked={v.incluir} onChange={(x) => marcar('vendas', i, x)} label={`Importar ${v.codigo ?? v.linha}`} /></td>
                      <td className={`${td} whitespace-nowrap`}><span className="font-mono text-xs">{v.codigo ?? '—'}</span><span className="block text-xs text-zinc-500">{formatarData(v.data)}</span></td>
                      <td className={td}>{v.cliente}</td>
                      <td className={td}>{v.produto}{v.quantidade > 1 && <span className="text-zinc-500"> ×{v.quantidade}</span>}<Aviso texto={v.aviso} /></td>
                      <td className={`${td} whitespace-nowrap text-right`}>{formatBRL(v.total)}</td>
                      <td className={`${td} whitespace-nowrap text-xs`}>
                        {STATUS[plano.mapaStatus[v.statusPlanilha] ?? 'pendente'].label}
                        <span className={`block ${v.pago ? 'text-emerald-300' : 'text-red-300'}`}>{v.pago ? 'Pago' : 'A receber'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Secao>

            {plano.despesas.length > 0 && (
              <Secao titulo="Despesas (aba Marketing)" total={plano.despesas.length} marcados={sel.despesas.length}>
                <table className="w-full text-sm">
                  <tbody>
                    {plano.despesas.map((d, i) => (
                      <tr key={d.linha} className={`border-t border-white/5 first:border-t-0 ${d.incluir ? '' : 'opacity-50'}`}>
                        <td className={td}><Check checked={d.incluir} onChange={(x) => marcar('despesas', i, x)} label={`Importar ${d.descricao}`} /></td>
                        <td className={td}>{d.descricao} <span className="text-xs text-zinc-500">· Marketing</span></td>
                        <td className={`${td} text-right`}>{formatBRL(d.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Secao>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-zinc-500">Produtos e pedidos que já existem (mesmo nome / mesmo código) são ignorados.</p>
              <Button onClick={executar} loading={importar.isPending} disabled={totalSel === 0} className="!px-6">
                <Upload size={16} /> Importar {totalSel} itens
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  )
}
