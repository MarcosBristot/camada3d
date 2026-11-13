import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { corDeTextoSobre } from '../lib/palette'
import type { TemaPreferido } from '../types/database'

/**
 * Tema do site: cores da marca (vindas da logo) + modo claro/escuro.
 * Fica em cache no localStorage para a landing e o primeiro carregamento já
 * abrirem com as cores certas (index.html aplica o cache antes do React).
 */
export interface Tema {
  primaria: string
  secundaria: string
  modo: TemaPreferido
}

export const TEMA_PADRAO: Tema = { primaria: '#f97316', secundaria: '#fbbf24', modo: 'escuro' }
export const TEMA_CACHE = 'camada3d-tema'

interface ThemeValue {
  tema: Tema
  /** modo efetivo depois de resolver "sistema" */
  modoAtual: 'claro' | 'escuro'
  definirTema: (parcial: Partial<Tema>) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

const hexValido = (s: unknown): s is string => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s)

function lerCache(): Tema {
  try {
    const t = JSON.parse(localStorage.getItem(TEMA_CACHE) ?? '{}')
    return {
      primaria: hexValido(t.primaria) ? t.primaria : TEMA_PADRAO.primaria,
      secundaria: hexValido(t.secundaria) ? t.secundaria : TEMA_PADRAO.secundaria,
      modo: ['claro', 'escuro', 'sistema'].includes(t.modo) ? t.modo : TEMA_PADRAO.modo,
    }
  } catch {
    return TEMA_PADRAO
  }
}

const prefereClaro = () => window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(lerCache)
  const [sistemaClaro, setSistemaClaro] = useState(prefereClaro)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!mq) return
    const onChange = () => setSistemaClaro(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const modoAtual: 'claro' | 'escuro' = tema.modo === 'sistema' ? (sistemaClaro ? 'claro' : 'escuro') : tema.modo

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand', tema.primaria)
    root.style.setProperty('--accent', tema.secundaria)
    root.style.setProperty('--brand-fg', corDeTextoSobre(tema.primaria))
    root.classList.toggle('light', modoAtual === 'claro')
    localStorage.setItem(TEMA_CACHE, JSON.stringify(tema))
  }, [tema, modoAtual])

  const definirTema = useCallback((parcial: Partial<Tema>) => {
    setTema((t) => {
      const novo = { ...t, ...parcial }
      return novo.primaria === t.primaria && novo.secundaria === t.secundaria && novo.modo === t.modo ? t : novo
    })
  }, [])

  const value = useMemo(() => ({ tema, modoAtual, definirTema }), [tema, modoAtual, definirTema])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTema() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTema precisa estar dentro de <ThemeProvider>')
  return ctx
}
