import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlus, Monitor, Moon, Palette, Save, Sparkles, Sun, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTema } from '../../contexts/ThemeContext'
import { usePerfil, useSalvarPerfil } from '../../hooks/useData'
import { comprimirImagem } from '../../lib/image'
import { corDeTextoSobre, extrairPaleta } from '../../lib/palette'
import type { TemaPreferido } from '../../types/database'
import { Card } from '../dashboard/bits'
import { Button, Field, inputCls } from '../ui/form'
import { mensagemErro, useToast } from '../ui/Toast'

const MODOS: { id: TemaPreferido; label: string; icon: typeof Sun }[] = [
  { id: 'claro', label: 'Claro', icon: Sun },
  { id: 'escuro', label: 'Escuro', icon: Moon },
  { id: 'sistema', label: 'Sistema', icon: Monitor },
]

type Slot = 'primaria' | 'secundaria'

export function IdentidadeVisual() {
  const { data: perfil, isLoading } = usePerfil()
  const salvar = useSalvarPerfil()
  const { definirTema } = useTema()
  const notificar = useToast()

  const [nome, setNome] = useState('')
  const [primaria, setPrimaria] = useState('#f97316')
  const [secundaria, setSecundaria] = useState('#fbbf24')
  const [modo, setModo] = useState<TemaPreferido>('escuro')
  const [logo, setLogo] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removerLogo, setRemoverLogo] = useState(false)
  const [candidatas, setCandidatas] = useState<string[]>([])
  const [slot, setSlot] = useState<Slot>('primaria')
  const [analisando, setAnalisando] = useState(false)
  const [tentou, setTentou] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const carregado = useRef(false)

  // Preenche o formulário com o perfil salvo (uma vez)
  useEffect(() => {
    if (isLoading || carregado.current) return
    carregado.current = true
    if (perfil) {
      setNome(perfil.nome)
      setPrimaria(perfil.cor_primaria)
      setSecundaria(perfil.cor_secundaria)
      setModo(perfil.tema)
    }
  }, [perfil, isLoading])

  // Prévia ao vivo: o site inteiro muda enquanto você edita
  useEffect(() => {
    if (carregado.current) definirTema({ primaria, secundaria, modo })
  }, [primaria, secundaria, modo, definirTema])

  // Saiu sem salvar? volta para o tema salvo
  const salvoRef = useRef(perfil)
  salvoRef.current = perfil
  useEffect(
    () => () => {
      const p = salvoRef.current
      if (p) definirTema({ primaria: p.cor_primaria, secundaria: p.cor_secundaria, modo: p.tema })
    },
    [definirTema],
  )

  useEffect(() => {
    if (!logo) return setPreview(null)
    const url = URL.createObjectURL(logo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logo])

  const escolherLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return notificar('erro', 'Use PNG, JPG ou WebP (SVG não é aceito).')
    setAnalisando(true)
    try {
      const reduzida = await comprimirImagem(f, 512, 0.9)
      const pal = await extrairPaleta(reduzida)
      setLogo(reduzida)
      setRemoverLogo(false)
      setCandidatas(pal.candidatas)
      if (pal.monocromatica) {
        notificar('sucesso', 'Logo sem cores fortes: mantive as cores atuais. Escolha manualmente se quiser.')
      } else {
        setPrimaria(pal.primaria)
        setSecundaria(pal.secundaria)
        notificar('sucesso', 'Cores extraídas da logo e aplicadas no site. Salve para manter.')
      }
    } catch (err) {
      notificar('erro', mensagemErro(err))
    } finally {
      setAnalisando(false)
    }
  }

  const aplicarCor = (hex: string) => (slot === 'primaria' ? setPrimaria(hex) : setSecundaria(hex))

  const logoAtual = removerLogo ? null : preview ?? perfil?.logo_url ?? null

  const submit = async () => {
    setTentou(true)
    if (!nome.trim()) return
    try {
      await salvar.mutateAsync({
        input: { nome, cor_primaria: primaria, cor_secundaria: secundaria, tema: modo },
        logo: logo ? { nova: logo } : removerLogo ? { remover: true } : undefined,
      })
      setLogo(null)
      setRemoverLogo(false)
      notificar('sucesso', `Perfil de ${nome.trim()} salvo.`)
    } catch (err) {
      notificar('erro', mensagemErro(err))
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/5 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Palette size={18} className="text-brand-400" /> Identidade visual
        </h2>
        <p className="mt-1 text-sm text-zinc-400">A logo define as cores do site inteiro. Você pode ajustar depois.</p>
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start gap-5">
            {/* Logo */}
            <div className="relative">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={analisando}
                aria-label="Enviar logo"
                className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-white/15 bg-zinc-950/50 transition hover:border-brand-400/60"
              >
                <AnimatePresence mode="wait">
                  {logoAtual ? (
                    <motion.img key={logoAtual} src={logoAtual} alt="Logo da empresa" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full w-full object-contain p-2" />
                  ) : (
                    <motion.span key="vazio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1 text-xs text-zinc-500">
                      <ImagePlus size={24} className="transition group-hover:scale-110 group-hover:text-brand-300" /> Logo
                    </motion.span>
                  )}
                </AnimatePresence>
                {analisando && (
                  <span className="absolute inset-0 flex items-center justify-center bg-zinc-950/70 text-xs text-zinc-300">
                    <Sparkles size={16} className="mr-1 animate-pulse text-brand-300" /> Lendo cores…
                  </span>
                )}
              </button>
              {logoAtual && (
                <button
                  type="button"
                  aria-label="Remover logo"
                  onClick={() => { setLogo(null); setRemoverLogo(true) }}
                  className="absolute -right-2 -top-2 rounded-full bg-zinc-900 p-1.5 text-zinc-400 ring-1 ring-white/10 hover:text-red-300"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={escolherLogo} />
            </div>

            <div className="min-w-56 flex-1">
              <Field label="Nome da empresa" htmlFor="empresa-nome" error={tentou && !nome.trim() ? 'Informe o nome.' : undefined}>
                <input id="empresa-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder="Ex.: tess3D" className={inputCls} />
              </Field>
              <p className="mt-2 text-xs text-zinc-500">PNG com fundo transparente funciona melhor. As cores são extraídas automaticamente.</p>
            </div>
          </div>

          {/* Cores */}
          <div>
            <span className="mb-2 block text-sm font-medium text-zinc-300">Cores</span>
            <div className="grid grid-cols-2 gap-3">
              {(['primaria', 'secundaria'] as Slot[]).map((s) => {
                const valor = s === 'primaria' ? primaria : secundaria
                const set = s === 'primaria' ? setPrimaria : setSecundaria
                const ativo = slot === s
                return (
                  <div
                    key={s}
                    onClick={() => setSlot(s)}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1 transition ${ativo ? 'bg-white/[0.05] ring-brand-400/50' : 'ring-white/10 hover:ring-white/20'}`}
                  >
                    <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-white/15" style={{ background: valor }}>
                      <input type="color" value={valor} onChange={(e) => set(e.target.value)} aria-label={`Cor ${s === 'primaria' ? 'principal' : 'secundária'}`} className="absolute inset-0 cursor-pointer opacity-0" />
                    </label>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s === 'primaria' ? 'Principal' : 'Secundária'}</p>
                      <p className="font-mono text-xs uppercase text-zinc-500">{valor}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {candidatas.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs text-zinc-500">
                  Cores da logo, clique para usar como <strong className="text-zinc-300">{slot === 'primaria' ? 'principal' : 'secundária'}</strong>:
                </p>
                <div className="flex flex-wrap gap-2">
                  {candidatas.map((c, i) => (
                    <motion.button
                      key={c}
                      type="button"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.05 } }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => aplicarCor(c)}
                      title={c}
                      aria-label={`Usar ${c}`}
                      className={`h-9 w-9 rounded-xl ring-2 transition ${c === primaria || c === secundaria ? 'ring-zinc-100' : 'ring-transparent'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tema */}
          <div>
            <span className="mb-2 block text-sm font-medium text-zinc-300">Tema</span>
            <div className="inline-flex rounded-2xl bg-zinc-950/60 p-1 ring-1 ring-white/10">
              {MODOS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModo(m.id)}
                  aria-pressed={modo === m.id}
                  className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${modo === m.id ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {modo === m.id && <motion.span layoutId="modo-tema" className="absolute inset-0 rounded-xl bg-white/[0.08] ring-1 ring-white/10" />}
                  <m.icon size={15} className="relative" />
                  <span className="relative">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prévia */}
        <div className="space-y-3">
          <span className="block text-sm font-medium text-zinc-300">Prévia</span>
          <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-5">
            <div className="flex items-center gap-3">
              {logoAtual ? (
                <img src={logoAtual} alt="" className="h-10 w-10 rounded-xl object-contain ring-1 ring-white/10" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-display font-bold text-brand-fg">
                  {(nome || 'T').slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="font-display text-lg font-bold">{nome || 'Sua empresa'}</span>
            </div>
            <p className="text-gradient font-display text-3xl font-bold">R$ 28,00</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl bg-gradient-to-r from-brand-500 to-accent-400 px-4 py-2 text-sm font-semibold text-brand-fg">Botão</span>
              <span className="rounded-xl border border-brand-400/40 px-4 py-2 text-sm font-medium text-brand-300">Destaque</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-brand-500 to-accent-400" />
            </div>
            <p className="text-xs text-zinc-500">
              Texto do botão: <span className="font-mono">{corDeTextoSobre(primaria) === '#ffffff' ? 'branco' : 'escuro'}</span> (ajustado para contraste)
            </p>
          </div>
          <Button onClick={submit} loading={salvar.isPending} className="w-full !py-3">
            <Save size={16} /> Salvar perfil
          </Button>
        </div>
      </div>
    </Card>
  )
}
