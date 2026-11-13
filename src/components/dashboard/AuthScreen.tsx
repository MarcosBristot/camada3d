import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Logo } from '../ui/Logo'
import { Button, Field, inputCls } from '../ui/form'

export function AuthScreen() {
  const { entrar, cadastrar } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      if (modo === 'entrar') {
        await entrar(email.trim(), senha)
      } else {
        const r = await cadastrar(email.trim(), senha)
        if (r.precisaConfirmar) setConfirmar(true)
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível continuar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-[600px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl"
      >
        <Logo />

        <AnimatePresence mode="wait">
          {confirmar ? (
            <motion.div key="confirmar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
              <MailCheck size={40} className="mx-auto text-emerald-400" />
              <h1 className="mt-4 font-display text-xl font-semibold">Confira seu e-mail</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Enviamos um link de confirmação para <strong className="text-zinc-200">{email}</strong>. Depois de
                confirmar, volte aqui e entre.
              </p>
              <Button variant="secondary" className="mt-6 w-full" onClick={() => { setConfirmar(false); setModo('entrar') }}>
                Ir para o login
              </Button>
            </motion.div>
          ) : (
            <motion.form key={modo} onSubmit={submit} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="mt-8 space-y-4">
              <div>
                <h1 className="font-display text-2xl font-semibold">{modo === 'entrar' ? 'Entrar no painel' : 'Criar conta'}</h1>
                <p className="mt-1 text-sm text-zinc-400">
                  {modo === 'entrar' ? 'Acesse seus produtos, vendas e finanças.' : 'Leva menos de um minuto.'}
                </p>
              </div>

              <Field label="E-mail" htmlFor="email">
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="voce@exemplo.com" />
              </Field>
              <Field label="Senha" htmlFor="senha" hint={modo === 'cadastrar' ? 'Mínimo de 6 caracteres.' : undefined}>
                <input
                  id="senha"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={inputCls}
                />
              </Field>

              {erro && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/25">{erro}</p>}

              <Button type="submit" loading={enviando} className="w-full !py-3">
                {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
              </Button>

              <p className="text-center text-sm text-zinc-400">
                {modo === 'entrar' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
                <button type="button" onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(null) }} className="font-medium text-brand-300 hover:text-brand-200">
                  {modo === 'entrar' ? 'Cadastre-se' : 'Entrar'}
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        <Link to="/" className="mt-8 flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300">
          <ArrowLeft size={14} /> Voltar para o site
        </Link>
      </motion.div>
    </div>
  )
}
