import { motion, useScroll, useTransform } from 'framer-motion'
import { BarChart3, Calculator, ShoppingBag } from 'lucide-react'
import { useRef } from 'react'
import { Reveal } from '../ui/Reveal'

const steps = [
  {
    icon: Calculator,
    title: 'Calcule e cadastre',
    desc: 'Informe peso, material, horas de máquina e energia. Ajuste a margem, adicione uma foto e salve o produto no catálogo.',
  },
  {
    icon: ShoppingBag,
    title: 'Registre a venda',
    desc: 'Escolha o produto, o cliente e o valor cobrado. O sistema congela o custo daquele momento e calcula o lucro da venda.',
  },
  {
    icon: BarChart3,
    title: 'Acompanhe os números',
    desc: 'Veja faturamento, gastos e lucro líquido atualizados, com o histórico completo de vendas e o status de cada entrega.',
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] })
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  // parallax das camadas decorativas
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress: sp } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const yDeco = useTransform(sp, [0, 1], [120, -120])

  return (
    <section id="como-funciona" ref={sectionRef} className="relative scroll-mt-24 overflow-hidden py-28 md:py-36">
      <motion.div
        aria-hidden
        style={{ y: yDeco }}
        className="bg-layers pointer-events-none absolute -right-40 top-10 h-[480px] w-[480px] rotate-12 rounded-[4rem] opacity-60 [mask-image:radial-gradient(circle,black,transparent_70%)]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-16 px-6 md:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="md:sticky md:top-32 md:self-start">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">Como funciona</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Três passos. <br />
            <span className="text-gradient">Zero achismo.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-zinc-400">
            Pare de cobrar &quot;mais ou menos&quot; e descobrir no fim do mês que pagou para trabalhar.
          </p>
        </Reveal>

        <div ref={ref} className="relative">
          {/* linha de progresso que "imprime" conforme o scroll */}
          <div className="absolute bottom-6 left-6 top-6 w-px bg-white/10" />
          <motion.div
            style={{ scaleY: lineScale }}
            className="absolute bottom-6 left-6 top-6 w-px origin-top bg-gradient-to-b from-orange-500 to-amber-300"
          />

          <ol className="space-y-10">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1} x={30} y={0}>
                <li className="relative flex gap-6">
                  <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-orange-300 shadow-lg shadow-black/40">
                    <s.icon size={20} />
                  </span>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition-colors hover:border-white/20">
                    <span className="font-mono text-xs text-zinc-500">PASSO 0{i + 1}</span>
                    <h3 className="mt-1 font-display text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-zinc-400">{s.desc}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
