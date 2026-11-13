import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Logo } from '../ui/Logo'
import { Button, Field, inputCls } from '../ui/form'

export function AuthScreen() {
  const { entrar, cadastrar, recuperarSenha } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'cadastrar' | 'recuperar'>('entrar')
  const [aviso, setAviso] = useState<'confirmar' | 'recuperar'>('confirmar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [aceite, setAceite] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (modo === 'cadastrar' && !aceite) {
      setErro('Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.')
      return
    }
    setEnviando(true)
    try {
      if (modo === 'entrar') {
        await entrar(email.trim(), senha)
      } else if (modo === 'recuperar') {
        await recuperarSenha(email.trim())
        setAviso('recuperar')
        setConfirmar(true)
      } else {
        const r = await cadastrar(email.trim(), senha)
        if (r.precisaConfirmar) {
          setAviso('confirmar')
          setConfirmar(true)
        }
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
              {aviso === 'confirmar' ? (
                <p className="mt-2 text-sm text-zinc-400">
                  Enviamos um link de confirmação para <strong className="text-zinc-200">{email}</strong>. Depois de
                  confirmar, volte aqui e entre.
                </p>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">
                  Se existir uma conta com <strong className="text-zinc-200">{email}</strong>, você vai receber um link para criar uma
                  nova senha. Confira também a caixa de spam.
                </p>
              )}
              <Button variant="secondary" className="mt-6 w-full" onClick={() => { setConfirmar(false); setModo('entrar') }}>
                Ir para o login
              </Button>
            </motion.div>
          ) : (
            <motion.form key={modo} onSubmit={submit} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="mt-8 space-y-4">
              <div>
                <h1 className="font-display text-2xl font-semibold">
                  {modo === 'entrar' ? 'Entrar no painel' : modo === 'cadastrar' ? 'Criar conta' : 'Recuperar senha'}
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  {modo === 'entrar'
                    ? 'Acesse seus produtos, vendas e finanças.'
                    : modo === 'cadastrar'
                      ? 'Leva menos de um minuto.'
                      : 'Informe o e-mail da conta e enviaremos um link para criar uma nova senha.'}
                </p>
              </div>

              <Field label="E-mail" htmlFor="email">
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="voce@exemplo.com" />
              </Field>
              {modo !== 'recuperar' && (
              <Field label="Senha" htmlFor="senha" hint={modo === 'cadastrar' ? 'Mínimo de 8 caracteres.' : undefined}>
                <input
                  id="senha"
                  type="password"
                  required
                  minLength={modo === 'cadastrar' ? 8 : 6}
                  autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={inputCls}
                />
              </Field>
              )}
              {modo === 'entrar' && (
                <button type="button" onClick={() => { setModo('recuperar'); setErro(null) }} className="-mt-2 text-xs text-zinc-500 hover:text-brand-300">
                  Esqueci minha senha
                </button>
              )}

              {modo === 'cadastrar' && (
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-400">
                  <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500" />
                  <span>
                    Tenho 18 anos ou mais e li e aceito os{' '}
                    <Link to="/termos" target="_blank" className="text-brand-300 underline-offset-2 hover:underline">Termos de Uso</Link> e a{' '}
                    <Link to="/privacidade" target="_blank" className="text-brand-300 underline-offset-2 hover:underline">Política de Privacidade</Link>.
                  </span>
                </label>
              )}

              {erro && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/25">{erro}</p>}

              <Button type="submit" loading={enviando} className="w-full !py-3">
                {modo === 'entrar' ? 'Entrar' : modo === 'cadastrar' ? 'Criar conta' : 'Enviar link'}
              </Button>

              <p className="text-center text-sm text-zinc-400">
                {modo === 'entrar' ? 'Ainda não tem conta? ' : modo === 'cadastrar' ? 'Já tem conta? ' : 'Lembrou a senha? '}
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
        <p className="mt-3 flex justify-center gap-3 text-[11px] text-zinc-600">
          <Link to="/termos" className="hover:text-zinc-400">Termos</Link>
          <Link to="/privacidade" className="hover:text-zinc-400">Privacidade</Link>
          <Link to="/contato" className="hover:text-zinc-400">Contato</Link>
        </p>
      </motion.div>
    </div>
  )
}
