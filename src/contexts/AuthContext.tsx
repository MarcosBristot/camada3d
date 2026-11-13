import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isDemo } from '../lib/api'
import { DEMO_USER_ID } from '../lib/api/demoApi'
import { supabase } from '../lib/supabase'

interface Usuario {
  id: string
  email: string | null
}

interface AuthValue {
  user: Usuario | null
  loading: boolean
  demo: boolean
  entrar(email: string, senha: string): Promise<void>
  cadastrar(email: string, senha: string): Promise<{ precisaConfirmar: boolean }>
  sair(): Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

const DEMO_USER: Usuario = { id: DEMO_USER_ID, email: 'demonstracao@camada3d.local' }

const traduzir = (msg: string) => {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (/already registered/i.test(msg)) return 'Este e-mail já está cadastrado.'
  if (/password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.'
  return msg
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(isDemo ? DEMO_USER : null)
  const [loading, setLoading] = useState(!isDemo)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      demo: isDemo,
      async entrar(email, senha) {
        if (!supabase) return
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw new Error(traduzir(error.message))
      },
      async cadastrar(email, senha) {
        if (!supabase) return { precisaConfirmar: false }
        const { data, error } = await supabase.auth.signUp({ email, password: senha })
        if (error) throw new Error(traduzir(error.message))
        return { precisaConfirmar: !data.session }
      },
      async sair() {
        if (supabase) await supabase.auth.signOut()
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
