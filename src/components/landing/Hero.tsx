import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import { MagneticButton } from '../ui/MagneticButton'
import { PrintVisual } from './PrintVisual'

const headline = [
  { text: 'Cada', accent: false },
  { text: 'camada', accent: false },
  { text: 'impressa', accent: false },
  { text: 'vira', accent: false },
  { text: 'lucro', accent: true },
  { text: 'calculado.', accent: true },
]

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  // Parallax: texto desce devagar, visual sobe, brilho do fundo em outra velocidade
  const yText = useTransform(scrollYProgress, [0, 1], [0, 140])
  const yVisual = useTransform(scrollYProgress, [0, 1], [0, -90])
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, 220])
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  return (
    <section id="topo" ref={ref} className="relative overflow-hidden pb-24 pt-32 md:pb-36 md:pt-44">
      {/* fundo */}
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <motion.div
        style={{ y: yGlow }}
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-orange-500/20 blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-cyan-500/20 blur-[100px]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-[1.1fr_1fr]">
        <motion.div style={{ y: yText, opacity }}>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200"
          >
            <Sparkles size={14} /> Feito para quem vive de impressão 3D
          </motion.span>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {headline.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
                <motion.span
                  className={`mr-[0.25em] inline-block ${w.accent ? 'text-gradient' : ''}`}
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 + i * 0.08, ease }}
                >
                  {w.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400"
          >
            Precifique cada peça considerando filamento, horas de máquina e energia. Registre vendas com a foto do
            produto e acompanhe faturamento, gastos e lucro líquido — tudo em um só lugar, sem planilhas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <MagneticButton to="/dashboard">
              Acessar o Dashboard
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </MagneticButton>
            <MagneticButton href="#precificacao" variant="ghost">
              Testar a calculadora
            </MagneticButton>
          </motion.div>

          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 1.05 } } }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400"
          >
            {['Cálculo em tempo real', 'Fotos dos produtos', 'Lucro por venda'].map((t) => (
              <motion.li
                key={t}
                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                className="flex items-center gap-2"
              >
                <Check size={16} className="text-emerald-400" /> {t}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div style={{ y: yVisual }}>
          <PrintVisual />
        </motion.div>
      </div>
    </section>
  )
}
