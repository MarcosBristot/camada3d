import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Tipo = 'sucesso' | 'erro'
interface Toast {
  id: number
  tipo: Tipo
  mensagem: string
}

const ToastContext = createContext<(tipo: Tipo, mensagem: string) => void>(() => undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remover = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const notificar = useCallback(
    (tipo: Tipo, mensagem: string) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, tipo, mensagem }])
      setTimeout(() => remover(id), tipo === 'erro' ? 6000 : 3500)
    },
    [remover],
  )

  return (
    <ToastContext.Provider value={notificar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-24 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2 md:bottom-6">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${
                t.tipo === 'sucesso'
                  ? 'border-emerald-400/25 bg-zinc-900/95 text-emerald-100'
                  : 'border-red-400/30 bg-zinc-900/95 text-red-100'
              }`}
            >
              {t.tipo === 'sucesso' ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
              )}
              <span className="flex-1">{t.mensagem}</span>
              <button onClick={() => remover(t.id)} aria-label="Fechar aviso" className="text-zinc-500 hover:text-zinc-300">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

/** Extrai uma mensagem legível de qualquer erro. */
export const mensagemErro = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado. Tente novamente.')
