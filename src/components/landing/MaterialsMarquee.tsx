import { motion } from 'framer-motion'

const items = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon', 'Resina', 'PLA Silk', 'Fibra de carbono', 'HIPS']

/** Faixa infinita com os materiais suportados. */
export function MaterialsMarquee() {
  const row = [...items, ...items]
  return (
    <section aria-label="Materiais suportados" className="relative border-y border-white/5 bg-zinc-900/40 py-6">
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <motion.div
          className="flex w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {row.map((m, i) => (
            <span key={i} className="flex items-center gap-12 whitespace-nowrap pr-12 font-display text-lg text-zinc-500">
              {m}
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500/60" />
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
