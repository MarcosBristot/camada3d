import { motion, useSpring } from 'framer-motion'
import { useRef, type ReactNode, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  to?: string
  href?: string
  variant?: 'primary' | 'ghost'
  className?: string
  strength?: number
}

const base =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400'

const variants = {
  primary:
    'bg-gradient-to-r from-orange-500 to-amber-400 text-zinc-950 shadow-[0_0_40px_-8px_rgba(251,146,60,0.7)] hover:shadow-[0_0_60px_-6px_rgba(251,146,60,0.9)]',
  ghost: 'border border-white/15 bg-white/[0.03] text-zinc-100 backdrop-blur hover:border-white/30 hover:bg-white/[0.07]',
}

/**
 * Botão com efeito "magnético" (segue levemente o cursor) + brilho que varre no hover
 * + compressão ao clicar.
 */
export function MagneticButton({ children, to, href, variant = 'primary', className = '', strength = 0.25 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 220, damping: 15, mass: 0.3 })
  const y = useSpring(0, { stiffness: 220, damping: 15, mass: 0.3 })

  const handleMove = (e: MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const content = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/40 opacity-0 blur-md transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100"
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  )
  const cls = `${base} ${variants[variant]} ${className}`

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x, y }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      className="inline-block"
    >
      {to ? (
        <Link to={to} className={cls}>
          {content}
        </Link>
      ) : (
        <a href={href} className={cls}>
          {content}
        </a>
      )}
    </motion.div>
  )
}
