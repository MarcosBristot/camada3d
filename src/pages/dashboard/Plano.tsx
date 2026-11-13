import { motion } from 'framer-motion'
import { Check, Copy, Crown, Mail, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Page, PageHeader, Skeleton } from '../../components/dashboard/bits'
import { useToast } from '../../components/ui/Toast'
import { COBRANCA, PLANOS, formatarPreco } from '../../config/planos'
import { LEGAL } from '../../config/legal'
import { useAuth } from '../../contexts/AuthContext'
import { usePlano } from '../../hooks/useData'

const dias = (iso: string | null) => (iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)) : 0)
const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')

function Barra({ usado, limite, rotulo }: { usado: number; limite: number; rotulo: string }) {
  const pct = Math.min(100, (usado / limite) * 100)
  const cor = pct >= 100 ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-brand-500'
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-zinc-300">{rotulo}</span>
        <span className="font-mono text-zinc-400">{usado} / {limite}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div className={`h-full rounded-full ${cor}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  )
}

export default function Plano() {
  const { data: info, isLoading } = usePlano()
  const { user, demo } = useAuth()
  const notificar = useToast()
  const [anual, setAnual] = useState(false)

  const pro = info?.plano === 'pro'
  const assunto = `Assinatura Pro ${anual ? 'anual' : 'mensal'} — ${user?.email ?? ''}`
  const corpo = `Olá! Quero assinar o farmOps 3D Pro (${anual ? 'anual' : 'mensal'}).\nE-mail da minha conta: ${user?.email ?? ''}\n\n(Se já pagou, anexe o comprovante.)`
  const mailto = `mailto:${LEGAL.contato.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
  const link = anual ? COBRANCA.linkAnual : COBRANCA.linkMensal
  const vendasAbertas = LEGAL.cobranca.planosPagos

  return (
    <Page>
      <PageHeader title="Seu plano" description="Comece grátis e assine o Pro quando o negócio pedir." />

      {/* Situação atual */}
      <Card className="overflow-hidden">
        {isLoading || !info ? (
          <div className="space-y-3 p-6"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-72" /></div>
        ) : (
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_320px]">
            <div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${pro ? 'bg-brand-500/15 text-brand-200 ring-brand-400/30' : 'bg-white/5 text-zinc-300 ring-white/10'}`}>
                {pro ? <Crown size={13} /> : null} {pro ? 'Pro' : 'Free'}
                {info.emTeste && ' · teste grátis'}
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold">
                {demo
                  ? 'Modo demonstração: tudo liberado'
                  : info.emTeste
                    ? `Seu teste do Pro termina em ${dias(info.testeAte)} dia(s)`
                    : pro
                      ? `Pro ativo até ${data(info.proAte)}`
                      : 'Você está no plano Free'}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {info.emTeste
                  ? `Até ${data(info.testeAte)} você usa tudo do Pro. Depois, a conta volta para o Free automaticamente, sem nenhuma cobrança. Seus dados continuam todos aqui.`
                  : pro
                    ? `Período: ${info.periodo ?? '—'}. Para renovar, pague antes do vencimento e envie o comprovante.`
                    : `Você pode continuar no Free pelo tempo que quiser. Produtos e pedidos já cadastrados nunca são apagados.`}
              </p>
            </div>
            <div className="space-y-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/5">
              {pro ? (
                <p className="flex items-center gap-2 text-sm text-zinc-300"><Sparkles size={16} className="text-brand-300" /> Produtos e pedidos ilimitados</p>
              ) : (
                <>
                  <Barra usado={info.uso.produtos} limite={PLANOS.free.limites.produtos} rotulo="Produtos" />
                  <Barra usado={info.uso.pedidosMes} limite={PLANOS.free.limites.pedidosMes} rotulo="Pedidos este mês" />
                </>
              )}
              <p className="text-xs text-zinc-500">Uso atual: {info.uso.produtos} produto(s) e {info.uso.pedidosMes} pedido(s) este mês.</p>
            </div>
          </div>
        )}
      </Card>

      {/* Comparativo */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold">Planos</h2>
        <div className="inline-flex rounded-xl bg-zinc-900/60 p-1 text-sm ring-1 ring-white/10">
          {[false, true].map((a) => (
            <button key={String(a)} onClick={() => setAnual(a)} className={`relative rounded-lg px-3 py-1.5 font-medium ${anual === a ? 'text-zinc-50' : 'text-zinc-400'}`}>
              {anual === a && <motion.span layoutId="periodo" className="absolute inset-0 rounded-lg bg-white/[0.08]" />}
              <span className="relative">{a ? 'Anual (2 meses grátis)' : 'Mensal'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <Card className="p-6">
          <p className="font-display text-lg font-semibold">Free</p>
          <p className="mt-1 font-display text-3xl font-bold">R$ 0</p>
          <ul className="mt-5 space-y-2 text-sm text-zinc-300">
            {PLANOS.free.recursos.map((r) => <li key={r} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-zinc-500" /> {r}</li>)}
          </ul>
        </Card>

        <Card className="relative overflow-hidden border-brand-400/30 p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
          <p className="relative flex items-center gap-2 font-display text-lg font-semibold"><Crown size={18} className="text-brand-300" /> Pro</p>
          <p className="relative mt-1 font-display text-3xl font-bold">
            <span className="text-gradient">{formatarPreco(anual ? PLANOS.pro.precoAnual : PLANOS.pro.precoMensal)}</span>
            <span className="text-base font-medium text-zinc-400">/{anual ? 'ano' : 'mês'}</span>
          </p>
          {anual && <p className="relative text-xs text-zinc-500">equivale a {formatarPreco(PLANOS.pro.precoAnual / 12)}/mês</p>}
          <ul className="relative mt-5 space-y-2 text-sm text-zinc-300">
            {PLANOS.pro.recursos.map((r) => <li key={r} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-300" /> {r}</li>)}
          </ul>

          <div className="relative mt-6 space-y-3">
            {vendasAbertas && link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-400 px-4 py-3 text-sm font-semibold text-brand-fg">
                <Crown size={16} /> Assinar {anual ? 'anual' : 'mensal'}
              </a>
            ) : (
              <a href={mailto} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-400 px-4 py-3 text-sm font-semibold text-brand-fg">
                <Mail size={16} /> Quero assinar o Pro
              </a>
            )}
            {vendasAbertas && COBRANCA.chavePix && (
              <button
                onClick={async () => { await navigator.clipboard.writeText(COBRANCA.chavePix); notificar('sucesso', 'Chave Pix copiada.') }}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
              >
                <Copy size={15} /> Copiar chave Pix ({anual ? formatarPreco(PLANOS.pro.precoAnual) : formatarPreco(PLANOS.pro.precoMensal)})
              </button>
            )}
            <p className="text-xs leading-relaxed text-zinc-500">
              {vendasAbertas
                ? <>Depois de pagar, envie o comprovante para <a href={mailto} className="text-brand-300 hover:underline">{LEGAL.contato.email}</a> informando o e-mail da conta. O Pro é ativado em até 1 dia útil.</>
                : <>As assinaturas abrem em breve. Mande um e-mail que avisamos você primeiro, com condição de fundador.</>}{' '}
              Arrependimento em até {LEGAL.cobranca.diasArrependimento} dias com reembolso integral (<Link to="/reembolso" className="hover:underline">política</Link>).
            </p>
          </div>
        </Card>
      </div>
    </Page>
  )
}
