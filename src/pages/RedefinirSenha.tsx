import { motion } from 'framer-motion'
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field, inputCls } from '../components/ui/form'
import { Logo } from '../components/ui/Logo'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

function Formulario() {
  const { user, loading, recuperando, definirNovaSenha } = useAuth()
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [esperou, setEsperou] = useState(false)

  // O Supabase processa o token do link ao carregar; damos um tempo antes de dizer que é inválido
  useEffect(() => {
    const t = setTimeout(() => setEsperou(true), 2500)
    return () => clearTimeout(t)
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (senha.length < 8) return setErro('Use pelo menos 8 caracteres.')
    if (senha !== repetir) return setErro('As senhas não conferem.')
    setEnviando(true)
    try {
      await definirNovaSenha(senha)
      setPronto(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível alterar a senha.')
    } finally {
      setEnviando(false)
    }
  }

  const sessaoValida = !!user && (recuperando || esperou)

  if (pronto) {
    return (
      <div className="mt-8 text-center">
        <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
        <h1 className="mt-4 font-display text-xl font-semibold">Senha alterada</h1>
        <p className="mt-2 text-sm text-zinc-400">Abrindo o painel…</p>
      </div>
    )
  }

  if (loading || (!user && !esperou)) {
    return (
      <div className="mt-10 flex justify-center text-zinc-500">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (!sessaoValida) {
    return (
      <div className="mt-8 text-center">
        <h1 className="font-display text-xl font-semibold">Link inválido ou expirado</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Os links de redefinição valem por pouco tempo e só podem ser usados uma vez. Peça um novo na tela de login em “Esqueci minha senha”.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block text-sm font-medium text-brand-300 hover:underline">
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <KeyRound size={22} className="text-brand-400" /> Nova senha
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Para a conta {user?.email}.</p>
      </div>
      <Field label="Nova senha" htmlFor="nova" hint="Mínimo de 8 caracteres.">
        <input id="nova" type="password" autoComplete="new-password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Repita a nova senha" htmlFor="repetir">
        <input id="repetir" type="password" autoComplete="new-password" required value={repetir} onChange={(e) => setRepetir(e.target.value)} className={inputCls} />
      </Field>
      {erro && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/25">{erro}</p>}
      <Button type="submit" loading={enviando} className="w-full !py-3">Salvar nova senha</Button>
    </form>
  )
}

export default function RedefinirSenha() {
  return (
    <AuthProvider>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl"
        >
          <Logo />
          <Formulario />
        </motion.div>
      </div>
    </AuthProvider>
  )
}
