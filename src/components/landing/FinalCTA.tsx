import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { MagneticButton } from '../ui/MagneticButton'
import { Reveal } from '../ui/Reveal'

export function FinalCTA() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const yLayers = useTransform(scrollYProgress, [0, 1], [-60, 60])
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.92, 1])

  return (
    <section ref={ref} className="px-6 pb-28 md:pb-36">
      <motion.div
        style={{ scale }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-brand-400/20 bg-gradient-to-br from-brand-600/25 via-zinc-900 to-zinc-950 px-8 py-20 text-center md:py-28"
      >
        <motion.div
          aria-hidden
          style={{ y: yLayers }}
          className="bg-layers pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]"
        />
        <div className="relative">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">
              Pare de chutar preços. <span className="text-gradient">Comece a lucrar</span> com cada impressão.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-300/80">
              Organize produtos, vendas e finanças do seu negócio de impressão 3D em um painel feito sob medida.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="mt-10">
            <MagneticButton to="/dashboard" className="!px-9 !py-4 !text-base">
              Ir para o Dashboard
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </MagneticButton>
          </Reveal>
        </div>
      </motion.div>
    </section>
  )
}
