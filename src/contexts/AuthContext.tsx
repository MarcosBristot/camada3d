import type { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isDemo } from '../lib/api'
import { DEMO_USER_ID } from '../lib/api/demoApi'
import { LEGAL } from '../config/legal'
import { supabase } from '../lib/supabase'

export interface Usuario {
  id: string
  email: string | null
  criadoEm: string | null
  /** versão dos Termos/Política aceita no cadastro e quando */
  termosVersao: string | null
  termosAceitosEm: string | null
}

function paraUsuario(u: User | undefined | null): Usuario | null {
  if (!u) return null
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>
  return {
    id: u.id,
    email: u.email ?? null,
    criadoEm: u.created_at ?? null,
    termosVersao: typeof meta.termos_versao === 'string' ? meta.termos_versao : null,
    termosAceitosEm: typeof meta.termos_aceitos_em === 'string' ? meta.termos_aceitos_em : null,
  }
}

interface AuthValue {
  user: Usuario | null
  loading: boolean
  demo: boolean
  entrar(email: string, senha: string): Promise<void>
  cadastrar(email: string, senha: string): Promise<{ precisaConfirmar: boolean }>
  sair(): Promise<void>
  /** Envia o e-mail com link para redefinir a senha. */
  recuperarSenha(email: string): Promise<void>
  /** Define a nova senha (usuário chegou pelo link de recuperação). */
  definirNovaSenha(senha: string): Promise<void>
  /** true quando a sessão atual veio de um link de recuperação de senha */
  recuperando: boolean
}

const AuthContext = createContext<AuthValue | null>(null)

const DEMO_USER: Usuario = { id: DEMO_USER_ID, email: 'demonstracao@farmops3d.local', criadoEm: null, termosVersao: null, termosAceitosEm: null }

const traduzir = (msg: string) => {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (/already registered/i.test(msg)) return 'Este e-mail já está cadastrado.'
  if (/password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/should be different from the old password/i.test(msg)) return 'A nova senha precisa ser diferente da anterior.'
  if (/rate limit|too many requests|for security purposes/i.test(msg)) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'
  if (/auth session missing|expired|invalid.*(token|link)/i.test(msg)) return 'O link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".'
  return msg
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(isDemo ? DEMO_USER : null)
  const [loading, setLoading] = useState(!isDemo)
  const [recuperando, setRecuperando] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(paraUsuario(data.session?.user))
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true)
      setUser(paraUsuario(session?.user))
      setLoading(false)
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
        // Prova do aceite: versão dos documentos e data/hora ficam nos metadados da conta
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { termos_versao: LEGAL.versao, termos_aceitos_em: new Date().toISOString() },
          },
        })
        if (error) throw new Error(traduzir(error.message))
        return { precisaConfirmar: !data.session }
      },
      async sair() {
        if (supabase) await supabase.auth.signOut()
      },
      async recuperarSenha(email) {
        if (!supabase) return
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        })
        if (error) throw new Error(traduzir(error.message))
      },
      async definirNovaSenha(senha) {
        if (!supabase) return
        const { error } = await supabase.auth.updateUser({ password: senha })
        if (error) throw new Error(traduzir(error.message))
        setRecuperando(false)
      },
      recuperando,
    }),
    [user, loading, recuperando],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
