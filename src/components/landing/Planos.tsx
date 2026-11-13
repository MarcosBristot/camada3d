import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Crown } from 'lucide-react'
import { useState } from 'react'
import { LEGAL } from '../../config/legal'
import { PLANOS, formatarPreco } from '../../config/planos'
import { MagneticButton } from '../ui/MagneticButton'
import { Reveal } from '../ui/Reveal'

const PERGUNTAS = [
  {
    p: 'Preciso de cartão para começar?',
    r: `Não. Crie a conta e use o Pro completo por ${PLANOS.diasTeste} dias. Depois, se não assinar, a conta continua no Free, sem nenhuma cobrança automática.`,
  },
  {
    p: 'O que acontece com meus dados se eu voltar para o Free?',
    r: 'Nada é apagado. Produtos e pedidos continuam acessíveis; o limite só vale para cadastrar coisas novas.',
  },
  {
    p: 'Como funciona o pagamento?',
    r: `Pix ou cartão pelo Mercado Pago, mensal ou anual. Você pode cancelar quando quiser e tem ${LEGAL.cobranca.diasArrependimento} dias para desistir com reembolso integral.`,
  },
  {
    p: 'Consigo trazer minha planilha?',
    r: 'Sim, no Pro. O sistema lê abas de filamentos, produtos, vendas e gastos, mostra uma prévia para você revisar e importa sem duplicar.',
  },
  {
    p: 'Serve para quem vende na Shopee, Mercado Livre ou Instagram?',
    r: 'Sim. Você calcula o preço com margem, registra cada pedido (com vários itens, frete e desconto) e gera a ordem de serviço em PDF para produção e para o cliente.',
  },
]

function Pergunta({ p, r }: { p: string; r: string }) {
  const [aberta, setAberta] = useState(false)
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setAberta((a) => !a)} aria-expanded={aberta} className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium">
        {p}
        <ChevronDown size={18} className={`shrink-0 text-zinc-500 transition-transform ${aberta ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {aberta && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-4 text-zinc-400">
            {r}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Planos() {
  const [anual, setAnual] = useState(false)
  return (
    <section id="planos" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Planos</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Comece grátis. <span className="text-gradient">Cresça no Pro.</span>
          </h2>
          <p className="mt-5 text-lg text-zinc-400">{PLANOS.diasTeste} dias de Pro liberado no cadastro. Sem cartão, sem fidelidade.</p>
          <div className="mt-8 inline-flex rounded-xl bg-zinc-900/60 p-1 text-sm ring-1 ring-white/10">
            {[false, true].map((a) => (
              <button key={String(a)} onClick={() => setAnual(a)} className={`relative rounded-lg px-4 py-2 font-medium ${anual === a ? 'text-zinc-50' : 'text-zinc-400'}`}>
                {anual === a && <motion.span layoutId="periodo-landing" className="absolute inset-0 rounded-lg bg-white/[0.08]" />}
                <span className="relative">{a ? 'Anual · 2 meses grátis' : 'Mensal'}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-white/10 bg-white/[0.025] p-8">
              <p className="font-display text-xl font-semibold">Free</p>
              <p className="mt-2 font-display text-4xl font-bold">R$ 0</p>
              <p className="mt-1 text-sm text-zinc-500">para começar a se organizar</p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                {PLANOS.free.recursos.map((r) => <li key={r} className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-zinc-500" /> {r}</li>)}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative h-full overflow-hidden rounded-3xl border border-brand-400/40 bg-gradient-to-b from-brand-500/10 to-transparent p-8 shadow-[0_0_60px_-20px_color-mix(in_oklab,var(--brand)_70%,transparent)]">
              <span className="absolute right-6 top-6 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-fg">Mais escolhido</span>
              <p className="flex items-center gap-2 font-display text-xl font-semibold"><Crown size={20} className="text-brand-300" /> Pro</p>
              <p className="mt-2 font-display text-4xl font-bold">
                <span className="text-gradient">{formatarPreco(anual ? PLANOS.pro.precoAnual : PLANOS.pro.precoMensal)}</span>
                <span className="text-lg font-medium text-zinc-400">/{anual ? 'ano' : 'mês'}</span>
              </p>
              <p className="mt-1 text-sm text-zinc-500">{anual ? `equivale a ${formatarPreco(PLANOS.pro.precoAnual / 12)}/mês` : 'menos que 1 rolo de filamento por mês'}</p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-200">
                {PLANOS.pro.recursos.map((r) => <li key={r} className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-brand-300" /> {r}</li>)}
              </ul>
              <div className="mt-8">
                <MagneticButton to="/dashboard" className="w-full">
                  Começar {PLANOS.diasTeste} dias grátis
                </MagneticButton>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mx-auto mt-20 max-w-2xl">
          <h3 className="mb-4 font-display text-2xl font-semibold">Perguntas frequentes</h3>
          {PERGUNTAS.map((q) => <Pergunta key={q.p} {...q} />)}
        </Reveal>
      </div>
    </section>
  )
}
