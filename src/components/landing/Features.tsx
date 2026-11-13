import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { Calculator, Camera, ClipboardList, PieChart, Truck, Wallet, type LucideIcon } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Reveal } from '../ui/Reveal'

interface Feature {
  icon: LucideIcon
  title: string
  desc: string
  tag?: string
}

const features: Feature[] = [
  {
    icon: Calculator,
    title: 'Calculadora de precificação',
    desc: 'Peso da peça, valor do kg, horas de impressão, consumo de energia e margem. O preço sugerido aparece na hora.',
    tag: 'Tempo real',
  },
  {
    icon: Camera,
    title: 'Catálogo com fotos',
    desc: 'Cada produto com imagem armazenada na nuvem, custo detalhado e preço — pronto para reutilizar em novas vendas.',
  },
  {
    icon: ClipboardList,
    title: 'Registro de vendas rápido',
    desc: 'Cliente, produto, data e valor cobrado em poucos cliques. O custo efetivo e o lucro são calculados automaticamente.',
  },
  {
    icon: PieChart,
    title: 'Dashboard financeiro',
    desc: 'Faturamento total, gastos com produtos e operação e lucro líquido consolidados em um painel claro.',
    tag: 'Visão geral',
  },
  {
    icon: Truck,
    title: 'Status de entrega',
    desc: 'Acompanhe cada pedido de "em produção" até "entregue" e nunca mais esqueça uma encomenda.',
  },
  {
    icon: Wallet,
    title: 'Custos operacionais',
    desc: 'Manutenção, bicos, embalagens, frete e assinaturas entram na conta para mostrar o lucro de verdade.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}

const item = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
}

function FeatureCard({ icon: Icon, title, desc, tag }: Feature) {
  const mx = useMotionValue(-200)
  const my = useMotionValue(-200)
  const spotlight = useMotionTemplate`radial-gradient(360px circle at ${mx}px ${my}px, color-mix(in oklab, var(--brand) 16%, transparent), transparent 70%)`

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(e.clientX - r.left)
    my.set(e.clientY - r.top)
  }

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onMouseMove={onMove}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition-colors hover:border-brand-400/30"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spotlight }}
      />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <motion.span
            whileHover={{ rotate: -8, scale: 1.1 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-400/10 text-brand-300 ring-1 ring-brand-400/20"
          >
            <Icon size={22} />
          </motion.span>
          {tag && (
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wider text-zinc-400">
              {tag}
            </span>
          )}
        </div>
        <h3 className="font-display text-xl font-semibold text-zinc-100">{title}</h3>
        <p className="mt-2 leading-relaxed text-zinc-400">{desc}</p>
      </div>
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="funcionalidades" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Funcionalidades</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Do fatiador ao <span className="text-gradient">lucro no bolso</span>
          </h2>
          <p className="mt-5 text-lg text-zinc-400">
            Tudo o que um negócio de produtos físicos e impressão 3D precisa para vender com margem e saber exatamente
            quanto sobra no fim do mês.
          </p>
        </Reveal>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
