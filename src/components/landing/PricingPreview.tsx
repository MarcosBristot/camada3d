import { motion } from 'framer-motion'
import { Clock, Percent, Weight } from 'lucide-react'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { formatBRL, formatNumber } from '../../lib/format'
import { calcularPreco } from '../../lib/pricing'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { MagneticButton } from '../ui/MagneticButton'
import { Reveal } from '../ui/Reveal'

// Valores fixos da demonstração (editáveis na calculadora completa)
const FIXOS = { precoKgMaterial: 120, potenciaWatts: 150, tarifaKwh: 0.85 }

interface SliderProps {
  icon: ReactNode
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  onChange: (v: number) => void
}

function Slider({ icon, label, value, min, max, step, suffix, onChange }: SliderProps) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <label htmlFor={id} className="flex items-center gap-2 text-zinc-300">
          <span className="text-brand-300">{icon}</span>
          {label}
        </label>
        <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-zinc-100">
          {formatNumber(value)} {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-brand-500"
        style={{
          background: `linear-gradient(90deg, var(--brand) 0%, var(--accent) ${pct}%, color-mix(in oklab, var(--color-white) 8%, transparent) ${pct}%)`,
        }}
      />
    </div>
  )
}

export function PricingPreview() {
  const [peso, setPeso] = useState(120)
  const [horas, setHoras] = useState(6)
  const [margem, setMargem] = useState(120)

  const r = useMemo(
    () =>
      calcularPreco({
        ...FIXOS,
        pesoGramas: peso,
        tempoMaquinaHoras: horas,
        margemLucroPct: margem,
      }),
    [peso, horas, margem],
  )

  const total = r.precoSugerido || 1
  const parts = [
    { label: 'Material', value: r.custoMaterial, color: 'bg-brand-500' },
    { label: 'Energia', value: r.custoEnergia, color: 'bg-cyan-400' },
    { label: 'Lucro', value: r.lucroEstimado, color: 'bg-emerald-400' },
  ]

  return (
    <section id="precificacao" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-96 max-w-4xl -translate-y-1/2 rounded-full bg-brand-500/10 blur-[120px]" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 md:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Precificação</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Quanto cobrar? <br />
            <span className="text-gradient">Mexa e descubra.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-zinc-400">
            Uma prévia da calculadora: arraste os controles e veja o custo e o preço sugerido mudarem em tempo real.
          </p>
          <p className="mt-4 max-w-md text-sm text-zinc-500">
            Demonstração com filamento a {formatBRL(FIXOS.precoKgMaterial)}/kg, impressora de {FIXOS.potenciaWatts} W e
            energia a {formatBRL(FIXOS.tarifaKwh)}/kWh. Na calculadora completa tudo é editável e o resultado vira um
            produto salvo.
          </p>
          <div className="mt-8">
            <MagneticButton to="/dashboard">Usar a calculadora completa</MagneticButton>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="rounded-[2rem] border border-white/10 bg-zinc-900/70 p-7 shadow-2xl shadow-black/50 backdrop-blur md:p-8">
            <div className="space-y-7">
              <Slider icon={<Weight size={16} />} label="Peso da peça" value={peso} min={5} max={1000} step={5} suffix="g" onChange={setPeso} />
              <Slider icon={<Clock size={16} />} label="Tempo de impressão" value={horas} min={0.5} max={48} step={0.5} suffix="h" onChange={setHoras} />
              <Slider icon={<Percent size={16} />} label="Margem de lucro" value={margem} min={0} max={300} step={5} suffix="%" onChange={setMargem} />
            </div>

            <div className="my-8 h-px bg-white/10" />

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Custo base</p>
                <AnimatedNumber value={r.custoBase} className="mt-1 block font-display text-2xl font-semibold" />
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-brand-500/15 to-accent-400/5 p-4 ring-1 ring-brand-400/25">
                <p className="text-xs uppercase tracking-wider text-brand-200/80">Preço sugerido</p>
                <AnimatedNumber value={r.precoSugerido} className="text-gradient mt-1 block font-display text-2xl font-bold" />
              </div>
            </div>

            {/* composição do preço */}
            <div className="mt-6">
              <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
                {parts.map((p) => (
                  <motion.div
                    key={p.label}
                    className={p.color}
                    animate={{ width: `${(p.value / total) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-400">
                {parts.map((p) => (
                  <span key={p.label} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${p.color}`} />
                    {p.label} · {formatBRL(p.value)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
