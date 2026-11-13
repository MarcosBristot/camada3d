import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { calcularPreco } from '../../lib/pricing'
import { formatBRL } from '../../lib/format'

/** Perfil de um vaso, de baixo para cima (largura em %). */
const LAYERS = [52, 58, 64, 70, 75, 79, 81, 81, 79, 75, 69, 63, 58, 55, 54, 56, 60, 64]
const STEP = 0.16 // segundos por camada
const LAYER_PX = 12 // altura da camada (9px) + gap (3px)
const TOTAL = LAYERS.length * STEP
const CYCLE_MS = (TOTAL + 3.2) * 1000

const exemplo = calcularPreco({
  pesoGramas: 85,
  precoKgMaterial: 120,
  tempoMaquinaHoras: 4.5,
  potenciaWatts: 150,
  tarifaKwh: 0.85,
  custoAdicional: 2,
  margemLucroPct: 150,
})

const float = (delay: number) => ({
  animate: { y: [0, -10, 0] },
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const, delay },
})

export function PrintVisual() {
  // Reinicia a "impressão" em loop (a key remonta as camadas e replays as animações)
  const [cycle, setCycle] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setCycle((c) => c + 1), CYCLE_MS)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-orange-500/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, rotateX: 14 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 1000 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-black/60"
      >
        {/* cabeçalho da "impressora" */}
        <div className="mb-6 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Imprimindo<span className="hidden sm:inline"> · vaso_espiral.gcode</span>
          </span>
          <span className="font-mono">PLA · 0.2mm</span>
        </div>

        {/* área de impressão */}
        <div key={cycle} className="relative flex h-64 items-end justify-center">
          <div className="bg-grid absolute inset-0 rounded-xl opacity-60" />

          {/* camadas, de baixo para cima */}
          <div className="relative z-10 flex w-48 flex-col-reverse items-center gap-[3px] pb-1">
            {LAYERS.map((w, i) => (
              <motion.div
                key={i}
                className="h-[9px] origin-left rounded-[3px]"
                style={{
                  width: `${w}%`,
                  background: `linear-gradient(90deg, hsl(${22 + i * 1.6} 95% ${52 + i * 0.6}%), hsl(${34 + i * 1.4} 95% ${62 + i * 0.4}%))`,
                }}
                initial={{ scaleX: 0, opacity: 0.4 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: STEP, delay: i * STEP, ease: 'linear' }}
              />
            ))}
          </div>

          {/* bico extrusor: sobe camada a camada e varre da esquerda p/ direita */}
          <motion.div
            className="absolute bottom-2 left-1/2 z-20 -ml-5"
            initial={{ y: 0 }}
            animate={{ y: -(LAYERS.length * LAYER_PX) - 6, opacity: [1, 1, 0] }}
            transition={{ duration: TOTAL + 0.6, ease: 'linear', times: [0, 0.93, 1] }}
          >
            <motion.div
              animate={{ x: [-56, 56] }}
              transition={{ duration: STEP, repeat: LAYERS.length - 1, repeatType: 'reverse', ease: 'linear' }}
              className="flex flex-col items-center"
            >
              <div className="h-5 w-10 rounded-md bg-zinc-600 ring-1 ring-white/20" />
              <div className="h-0 w-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-zinc-400" />
              <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_12px_4px_rgba(251,146,60,0.8)]" />
            </motion.div>
          </motion.div>

          {/* mesa */}
          <div className="absolute inset-x-4 bottom-0 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* progresso */}
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-zinc-400">
            <span>Progresso</span>
            <span className="font-mono">{LAYERS.length} camadas</span>
          </div>
          <div key={cycle} className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-orange-500 to-amber-300"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: TOTAL, ease: 'linear' }}
            />
          </div>
        </div>
      </motion.div>

      {/* cards flutuantes com o cálculo real (mesma função da calculadora) */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute -left-3 top-16 xl:-left-14"
      >
        <motion.div {...float(0)} className="rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3 shadow-xl backdrop-blur">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Custo base</p>
          <p className="font-display text-lg font-semibold text-zinc-100">{formatBRL(exemplo.custoBase)}</p>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.25, duration: 0.6 }}
        className="absolute -right-2 bottom-24 xl:-right-12"
      >
        <motion.div
          {...float(1.2)}
          className="rounded-2xl border border-orange-400/30 bg-zinc-900/90 px-4 py-3 shadow-xl shadow-orange-500/10 backdrop-blur"
        >
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Preço sugerido</p>
          <p className="text-gradient font-display text-lg font-semibold">{formatBRL(exemplo.precoSugerido)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={12} /> +{formatBRL(exemplo.lucroEstimado)} de lucro
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
