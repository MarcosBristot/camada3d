import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Logo } from '../ui/Logo'
import { MagneticButton } from '../ui/MagneticButton'
import { ThemeToggle } from '../ui/ThemeToggle'

const links = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#precificacao', label: 'Precificação' },
]

export function Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-3"
    >
      <div
        className={`mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-300 md:px-6 ${
          scrolled
            ? 'border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/40 backdrop-blur-xl'
            : 'border-transparent'
        }`}
      >
        <a href="#topo" aria-label="farmOps 3D — início">
          <Logo />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <MagneticButton to="/dashboard" className="!px-5 !py-2.5">
            Abrir Dashboard
          </MagneticButton>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
        <button
          className="rounded-lg p-2 text-zinc-300"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mt-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 backdrop-blur-xl md:hidden"
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-zinc-300 hover:bg-white/5"
              >
                {l.label}
              </a>
            ))}
            <div className="p-2">
              <MagneticButton to="/dashboard">Abrir Dashboard</MagneticButton>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
