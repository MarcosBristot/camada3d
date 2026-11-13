import { AnimatePresence, motion } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const CHAVE = 'camada3d-aviso-armazenamento'

/**
 * Aviso informativo (não é banner de consentimento): o site usa só armazenamento
 * essencial e de preferência, sem rastreamento, então não há o que aceitar ou recusar.
 */
export function AvisoArmazenamento() {
  const [visivel, setVisivel] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const t = setTimeout(() => setVisivel(!localStorage.getItem(CHAVE)), 1200)
    return () => clearTimeout(t)
  }, [])

  const fechar = () => {
    localStorage.setItem(CHAVE, new Date().toISOString())
    setVisivel(false)
  }

  if (pathname === '/cookies') return null

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          role="region"
          aria-label="Aviso sobre armazenamento local"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed inset-x-3 bottom-24 z-[80] mx-auto max-w-xl rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-5 print:hidden"
        >
          <div className="flex items-start gap-3 text-sm">
            <Cookie size={18} className="mt-0.5 shrink-0 text-brand-300" />
            <p className="flex-1 text-zinc-300">
              Usamos apenas armazenamento essencial (login e preferências). Nada de anúncios ou rastreamento.{' '}
              <Link to="/cookies" className="font-medium text-brand-300 hover:underline">Saiba mais</Link>
            </p>
            <button onClick={fechar} className="shrink-0 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-zinc-100 ring-1 ring-white/10 hover:bg-white/10">
              Entendi
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
