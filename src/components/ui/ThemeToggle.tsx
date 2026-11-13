import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTema } from '../../contexts/ThemeContext'

/** Alterna claro/escuro. onChange permite persistir a escolha (ex.: no perfil da empresa). */
export function ThemeToggle({ onChange, className = '' }: { onChange?: (modo: 'claro' | 'escuro') => void; className?: string }) {
  const { modoAtual, definirTema } = useTema()
  const proximo = modoAtual === 'claro' ? 'escuro' : 'claro'

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9, rotate: -15 }}
      onClick={() => {
        definirTema({ modo: proximo })
        onChange?.(proximo)
      }}
      aria-label={`Ativar tema ${proximo}`}
      title={`Tema ${proximo}`}
      className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl text-zinc-400 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-zinc-100 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={modoAtual}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {modoAtual === 'claro' ? <Moon size={17} /> : <Sun size={17} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
