import { Crown, Loader2, Search, ShieldCheck, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Card, Page, PageHeader, Skeleton } from '../../components/dashboard/bits'
import { Modal } from '../../components/ui/Modal'
import { mensagemErro, useToast } from '../../components/ui/Toast'
import { Button, Field, NumberInput, inputCls, parseNum } from '../../components/ui/form'
import { PLANOS, formatarPreco } from '../../config/planos'
import { useAdminEstenderPro, useAssinaturasAdmin, useEhAdmin } from '../../hooks/useData'
import type { AssinaturaAdmin } from '../../types/database'

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')
const ativo = (iso: string | null) => !!iso && new Date(iso).getTime() > Date.now()

/** Painel do dono do serviço: ver quem usa e ativar o Pro depois de receber o pagamento. */
export default function Admin() {
  const { data: ehAdmin, isLoading: verificando } = useEhAdmin()
  const { data: lista = [], isLoading } = useAssinaturasAdmin(!!ehAdmin)
  const estender = useAdminEstenderPro()
  const notificar = useToast()
  const [busca, setBusca] = useState('')
  const [alvo, setAlvo] = useState<AssinaturaAdmin | null>(null)
  const [diasTxt, setDiasTxt] = useState('30')
  const [periodo, setPeriodo] = useState<'mensal' | 'anual' | 'cortesia'>('mensal')
  const [nota, setNota] = useState('')

  const metricas = useMemo(() => {
    const pagos = lista.filter((a) => ativo(a.pro_ate))
    const mensais = pagos.filter((a) => a.periodo === 'mensal').length
    const anuais = pagos.filter((a) => a.periodo === 'anual').length
    return {
      usuarios: lista.length,
      emTeste: lista.filter((a) => !ativo(a.pro_ate) && ativo(a.teste_ate)).length,
      pagos: pagos.length,
      // receita mensal recorrente estimada (cortesias não contam)
      mrr: mensais * PLANOS.pro.precoMensal + (anuais * PLANOS.pro.precoAnual) / 12,
      vencendo: pagos.filter((a) => new Date(a.pro_ate!).getTime() - Date.now() < 7 * 86400000).length,
    }
  }, [lista])

  // Cadastros por origem (anúncio/post), com quantos viraram Pro pago
  const porOrigem = useMemo(() => {
    const m = new Map<string, { total: number; ultimos7: number; pagos: number }>()
    const semana = Date.now() - 7 * 86400000
    lista.forEach((a) => {
      const k = a.origem ?? 'direto / sem origem'
      const v = m.get(k) ?? { total: 0, ultimos7: 0, pagos: 0 }
      v.total++
      if (new Date(a.criado_em).getTime() >= semana) v.ultimos7++
      if (ativo(a.pro_ate) && a.periodo !== 'cortesia') v.pagos++
      m.set(k, v)
    })
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total)
  }, [lista])

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? lista.filter((a) => [a.email, a.empresa ?? '', a.observacao ?? '', a.origem ?? ''].some((s) => s.toLowerCase().includes(q))) : lista
  }, [lista, busca])

  if (verificando) return <div className="flex justify-center py-20 text-zinc-500"><Loader2 className="animate-spin" /></div>
  if (!ehAdmin) return <Navigate to="/dashboard" replace />

  const abrir = (a: AssinaturaAdmin, dias: number, p: typeof periodo) => {
    setAlvo(a)
    setDiasTxt(String(dias))
    setPeriodo(p)
    setNota('')
  }

  const aplicar = async () => {
    if (!alvo) return
    const dias = Math.round(parseNum(diasTxt))
    try {
      const ate = await estender.mutateAsync({ userId: alvo.user_id, dias, periodo: dias === 0 ? null : periodo, nota: nota.trim() || null })
      notificar('sucesso', dias === 0 ? `Pro de ${alvo.email} encerrado.` : `Pro de ${alvo.email} ativo até ${data(ate)}.`)
      setAlvo(null)
    } catch (err) {
      notificar('erro', mensagemErro(err))
    }
  }

  return (
    <Page>
      <PageHeader title="Administração" description="Usuários, planos e ativação manual do Pro (depois de confirmar o pagamento)." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Usuários', metricas.usuarios, Users],
          ['Em teste', metricas.emTeste, ShieldCheck],
          ['Pro pagos', metricas.pagos, Crown],
          ['Vencem em 7 dias', metricas.vencendo, Crown],
          ['Receita mensal (MRR)', formatarPreco(metricas.mrr), Crown],
        ].map(([rotulo, valor, Icone]) => {
          const I = Icone as typeof Users
          return (
            <Card key={rotulo as string} className="p-5">
              <p className="flex items-center gap-2 text-sm text-zinc-400"><I size={15} /> {rotulo as string}</p>
              <p className="mt-2 font-display text-2xl font-bold">{valor as string | number}</p>
            </Card>
          )
        })}
      </div>

      {porOrigem.length > 0 && (
        <Card className="mt-6">
          <div className="border-b border-white/5 p-5">
            <h2 className="font-display text-lg font-semibold">Cadastros por origem</h2>
            <p className="mt-1 text-xs text-zinc-500">Use links como <code className="rounded bg-white/5 px-1">farmops3d.vercel.app/?origem=reels1</code> em cada anúncio ou post.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-2 font-medium">Origem</th>
                <th className="px-3 py-2 text-right font-medium">Cadastros</th>
                <th className="px-3 py-2 text-right font-medium">Últimos 7 dias</th>
                <th className="px-5 py-2 text-right font-medium">Pro pagos</th>
              </tr>
            </thead>
            <tbody>
              {porOrigem.map(([origem, v]) => (
                <tr key={origem} className="border-t border-white/5">
                  <td className="px-5 py-2.5 font-mono text-xs text-zinc-300">{origem}</td>
                  <td className="px-3 py-2.5 text-right">{v.total}</td>
                  <td className="px-3 py-2.5 text-right text-zinc-400">{v.ultimos7}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-brand-300">{v.pagos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5">
          <h2 className="font-display text-lg font-semibold">Assinaturas</h2>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="E-mail, empresa ou anotação" className={`${inputCls} !py-2 pl-9`} aria-label="Buscar usuários" />
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-medium">Usuário</th>
                  <th className="px-3 py-3 font-medium">Plano</th>
                  <th className="px-3 py-3 font-medium">Teste até</th>
                  <th className="px-3 py-3 font-medium">Pro até</th>
                  <th className="px-3 py-3 text-right font-medium">Uso</th>
                  <th className="px-3 py-3 font-medium">Anotação</th>
                  <th className="px-3 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {filtrada.map((a) => (
                  <tr key={a.user_id} className="border-t border-white/5 align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium text-zinc-100">{a.email}</p>
                      <p className="text-xs text-zinc-500">{a.empresa ?? 'sem perfil'} · desde {data(a.criado_em)} · último acesso {data(a.ultimo_acesso)}</p>
                      {a.origem && <p className="mt-0.5 font-mono text-[11px] text-brand-300/80">origem: {a.origem}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${a.plano === 'pro' ? 'bg-brand-500/15 text-brand-200 ring-brand-400/30' : 'bg-white/5 text-zinc-400 ring-white/10'}`}>
                        {a.plano === 'pro' ? (ativo(a.pro_ate) ? `Pro ${a.periodo ?? ''}` : 'Pro (teste)') : 'Free'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-400">{data(a.teste_ate)}</td>
                    <td className={`whitespace-nowrap px-3 py-3 ${ativo(a.pro_ate) ? 'text-zinc-200' : 'text-zinc-500'}`}>{data(a.pro_ate)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-xs text-zinc-400">{a.produtos} prod. · {a.pedidos_mes} ped./mês</td>
                    <td className="max-w-48 truncate px-3 py-3 text-xs text-zinc-500" title={a.observacao ?? ''}>{a.observacao ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <Button variant="secondary" className="!px-2.5 !py-1.5 text-xs" onClick={() => abrir(a, 30, 'mensal')}>+30 dias</Button>{' '}
                      <Button variant="secondary" className="!px-2.5 !py-1.5 text-xs" onClick={() => abrir(a, 365, 'anual')}>+1 ano</Button>{' '}
                      {ativo(a.pro_ate) && <Button variant="ghost" className="!px-2.5 !py-1.5 text-xs" onClick={() => abrir(a, 0, 'mensal')}>Encerrar</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!alvo} onClose={() => setAlvo(null)} title={Math.round(parseNum(diasTxt)) === 0 ? 'Encerrar Pro' : 'Ativar / estender Pro'} description={alvo?.email}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dias" htmlFor="adm-dias" hint="0 encerra agora">
              <NumberInput id="adm-dias" value={diasTxt} onChange={setDiasTxt} suffix="dias" />
            </Field>
            <Field label="Período" htmlFor="adm-periodo">
              <select id="adm-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value as typeof periodo)} className={inputCls}>
                <option value="mensal" className="bg-zinc-900">Mensal</option>
                <option value="anual" className="bg-zinc-900">Anual</option>
                <option value="cortesia" className="bg-zinc-900">Cortesia</option>
              </select>
            </Field>
          </div>
          <Field label="Anotação (opcional)" htmlFor="adm-nota" hint="Ex.: Pix recebido 14/11, comprovante por e-mail">
            <input id="adm-nota" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} className={inputCls} />
          </Field>
          <p className="text-xs text-zinc-500">A extensão conta a partir do vencimento atual (se ainda estiver ativo) ou de hoje.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAlvo(null)}>Cancelar</Button>
            <Button onClick={aplicar} loading={estender.isPending} variant={Math.round(parseNum(diasTxt)) === 0 ? 'danger' : 'primary'}>Confirmar</Button>
          </div>
        </div>
      </Modal>
    </Page>
  )
}
