import { AnimatePresence, motion } from 'framer-motion'
import { Clock, ImagePlus, Package, Save, Sparkles, Weight, Zap, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card, Page, PageHeader } from '../../components/dashboard/bits'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { Button, Field, NumberInput, inputCls, parseNum } from '../../components/ui/form'
import { mensagemErro, useToast } from '../../components/ui/Toast'
import { useCriarProduto, useFilamentos, useProdutos } from '../../hooks/useData'
import { formatBRL, formatNumber } from '../../lib/format'
import { comprimirImagem } from '../../lib/image'
import { MATERIAIS } from '../../lib/labels'
import { calcularPreco } from '../../lib/pricing'

const PREFS_KEY = 'camada3d-calc-prefs'
const MARGENS_RAPIDAS = [50, 100, 150, 200]
const round2 = (n: number) => Math.round(n * 100) / 100

interface Prefs {
  precoKg: string
  potencia: string
  tarifa: string
  margem: string
}

function lerPrefs(): Prefs {
  const padrao: Prefs = { precoKg: '120', potencia: '150', tarifa: '0,85', margem: '100' }
  try {
    return { ...padrao, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
  } catch {
    return padrao
  }
}

function Secao({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="mb-5 flex items-center gap-2 font-display text-base font-semibold">
        <span className="text-brand-400">{icon}</span>
        {title}
      </h2>
      {children}
    </Card>
  )
}

export default function Calculator() {
  const prefs = useMemo(lerPrefs, [])
  const notificar = useToast()
  const criar = useCriarProduto()
  const { data: filamentos = [] } = useFilamentos()

  const [nome, setNome] = useState('')
  const [material, setMaterial] = useState('PLA')
  const [filamentoId, setFilamentoId] = useState('')
  const [cor, setCor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [descricao, setDescricao] = useState('')
  const [peso, setPeso] = useState('')
  const [precoKg, setPrecoKg] = useState(prefs.precoKg)
  const [horas, setHoras] = useState('')
  const [minutos, setMinutos] = useState('')
  const [potencia, setPotencia] = useState(prefs.potencia)
  const [tarifa, setTarifa] = useState(prefs.tarifa)
  const [adicional, setAdicional] = useState('')
  const [margem, setMargem] = useState(prefs.margem)
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!foto) return setPreview(null)
    const url = URL.createObjectURL(foto)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [foto])

  // Horas arredondadas a 2 casas, igual à coluna numeric(8,2) do banco
  const tempoHoras = round2(parseNum(horas) + parseNum(minutos) / 60)
  const entrada = {
    pesoGramas: parseNum(peso),
    precoKgMaterial: parseNum(precoKg),
    tempoMaquinaHoras: tempoHoras,
    potenciaWatts: parseNum(potencia),
    tarifaKwh: parseNum(tarifa),
    custoAdicional: parseNum(adicional),
    margemLucroPct: parseNum(margem),
  }
  const r = calcularPreco(entrada)
  const margemSobrePreco = r.precoSugerido > 0 ? (r.lucroEstimado / r.precoSugerido) * 100 : 0

  const erros = {
    nome: !nome.trim() ? 'Dê um nome ao produto.' : undefined,
    peso: entrada.pesoGramas <= 0 ? 'Informe o peso da peça.' : undefined,
  }
  const valido = !erros.nome && !erros.peso

  const escolherFoto = (f: File | undefined | null) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return notificar('erro', 'Escolha um arquivo de imagem (JPG, PNG ou WebP).')
    if (f.size > 15 * 1024 * 1024) return notificar('erro', 'Imagem muito grande (máx. 15 MB).')
    setFoto(f)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    escolherFoto(e.dataTransfer.files?.[0])
  }

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setTentouSalvar(true)
    if (!valido) return

    try {
      const fotoComprimida = foto ? await comprimirImagem(foto) : null
      await criar.mutateAsync({
        input: {
          nome: nome.trim(),
          material,
          descricao: descricao.trim() || null,
          peso_gramas: entrada.pesoGramas,
          preco_kg_material: entrada.precoKgMaterial,
          tempo_maquina_horas: entrada.tempoMaquinaHoras,
          potencia_watts: entrada.potenciaWatts,
          tarifa_kwh: entrada.tarifaKwh,
          custo_adicional: entrada.custoAdicional,
          margem_lucro_pct: entrada.margemLucroPct,
          filamento_id: filamentoId || null,
          cor: cor.trim() || null,
          categoria: categoria.trim() || null,
          preco_venda: precoVenda.trim() ? parseNum(precoVenda) : null,
        },
        foto: fotoComprimida,
      })
      localStorage.setItem(PREFS_KEY, JSON.stringify({ precoKg, potencia, tarifa, margem }))
      notificar('sucesso', `"${nome.trim()}" salvo no catálogo por ${formatBRL(precoVenda.trim() ? parseNum(precoVenda) : r.precoSugerido)}.`)
      // mantém parâmetros da máquina; limpa o que é da peça
      setNome('')
      setDescricao('')
      setPeso('')
      setHoras('')
      setMinutos('')
      setAdicional('')
      setPrecoVenda('')
      setFoto(null)
      setTentouSalvar(false)
    } catch (err) {
      notificar('erro', mensagemErro(err))
    }
  }

  const { data: produtosCat = [] } = useProdutos()
  const categoriasConhecidas = useMemo(
    () => [...new Set(produtosCat.map((p) => p.categoria).filter((c): c is string => !!c))].sort(),
    [produtosCat],
  )

  const escolherFilamento = (id: string) => {
    setFilamentoId(id)
    const f = filamentos.find((x) => x.id === id)
    if (!f) return
    setCor(f.cor)
    setMaterial(MATERIAIS.includes(f.material) ? f.material : 'Outro')
    setPrecoKg(String(f.preco_kg).replace('.', ','))
  }

  const partes = [
    { label: 'Material', valor: r.custoMaterial, cor: 'bg-brand-500' },
    { label: 'Energia', valor: r.custoEnergia, cor: 'bg-cyan-400' },
    { label: 'Extras', valor: round2(r.custoBase - r.custoMaterial - r.custoEnergia), cor: 'bg-violet-400' },
    { label: 'Lucro', valor: r.lucroEstimado, cor: 'bg-emerald-400' },
  ]
  const totalBarra = partes.reduce((t, p) => t + Math.max(p.valor, 0), 0) || 1

  return (
    <Page>
      <PageHeader
        title="Calculadora de precificação"
        description="Preencha os dados da peça. O custo e o preço sugerido são calculados enquanto você digita."
      />

      <form onSubmit={salvar} noValidate className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Secao icon={<Package size={18} />} title="Produto">
            <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
              <div className="space-y-4">
                <Field label="Nome do produto" htmlFor="nome" error={tentouSalvar ? erros.nome : undefined}>
                  <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} placeholder="Ex.: Vaso espiral 15 cm" className={`${inputCls} ${tentouSalvar && erros.nome ? '!border-red-400/60' : ''}`} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Material" htmlFor="material">
                    <select id="material" value={material} onChange={(e) => setMaterial(e.target.value)} className={inputCls}>
                      {MATERIAIS.map((m) => (
                        <option key={m} className="bg-zinc-900">{m}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Categoria" htmlFor="categoria">
                    <input id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} list="categorias" placeholder="Ex.: Natal" className={inputCls} />
                    <datalist id="categorias">
                      {categoriasConhecidas.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </Field>
                </div>
                <Field label="Descrição (opcional)" htmlFor="descricao">
                  <input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Cor, tamanho, acabamento..." className={inputCls} />
                </Field>
              </div>

              {/* Foto */}
              <div>
                <span className="mb-1.5 block text-sm font-medium text-zinc-300">Foto</span>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Escolher foto do produto"
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
                  onDragLeave={() => setArrastando(false)}
                  onDrop={onDrop}
                  className={`group relative flex aspect-video cursor-pointer sm:aspect-square items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${
                    arrastando ? 'border-brand-400 bg-brand-500/10' : 'border-white/10 bg-zinc-950/40 hover:border-white/25'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {preview ? (
                      <motion.img key="img" src={preview} alt="Prévia da foto" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full w-full object-cover" />
                    ) : (
                      <motion.div key="vazio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 px-3 text-center text-xs text-zinc-500">
                        <ImagePlus size={26} className="transition group-hover:scale-110 group-hover:text-brand-300" />
                        Clique ou arraste uma imagem
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {preview && (
                    <button
                      type="button"
                      aria-label="Remover foto"
                      onClick={(e) => { e.stopPropagation(); setFoto(null); if (fileRef.current) fileRef.current.value = '' }}
                      className="absolute right-2 top-2 rounded-full bg-zinc-950/80 p-1.5 text-zinc-100 hover:bg-zinc-950"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => escolherFoto(e.target.files?.[0])} />
              </div>
            </div>
          </Secao>

          <Secao icon={<Weight size={18} />} title="Material">
            {filamentos.length > 0 && (
              <Field label="Filamento cadastrado" htmlFor="filamento" hint="Preenche cor, material e valor do kg." className="mb-4">
                <select id="filamento" value={filamentoId} onChange={(e) => escolherFilamento(e.target.value)} className={inputCls}>
                  <option value="" className="bg-zinc-900">Outro / digitar manualmente</option>
                  {filamentos.map((f) => (
                    <option key={f.id} value={f.id} className="bg-zinc-900">
                      {f.cor} · {f.material}{f.marca ? ` · ${f.marca}` : ''} — {formatBRL(f.preco_kg)}/kg
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Cor" htmlFor="cor">
                <input id="cor" value={cor} onChange={(e) => { setCor(e.target.value); setFilamentoId('') }} placeholder="Ex.: Preto" className={inputCls} />
              </Field>
              <Field label="Peso da peça" htmlFor="peso" hint="Inclua suportes, brim e purga." error={tentouSalvar ? erros.peso : undefined}>
                <NumberInput id="peso" value={peso} onChange={setPeso} suffix="g" invalid={tentouSalvar && !!erros.peso} />
              </Field>
              <Field label="Valor do kg do material" htmlFor="precoKg">
                <NumberInput id="precoKg" value={precoKg} onChange={(v) => { setPrecoKg(v); setFilamentoId('') }} prefix="R$" suffix="/kg" />
              </Field>
            </div>
          </Secao>

          <Secao icon={<Zap size={18} />} title="Máquina e energia">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tempo de impressão" htmlFor="horas">
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput id="horas" value={horas} onChange={setHoras} suffix="h" />
                  <NumberInput value={minutos} onChange={setMinutos} suffix="min" />
                </div>
              </Field>
              <Field label="Potência média da impressora" htmlFor="potencia" hint="Média durante a impressão; FDM comuns ficam entre 100 e 150 W.">
                <NumberInput id="potencia" value={potencia} onChange={setPotencia} suffix="W" />
              </Field>
              <Field label="Tarifa de energia" htmlFor="tarifa" hint="Veja na sua conta de luz (com impostos).">
                <NumberInput id="tarifa" value={tarifa} onChange={setTarifa} prefix="R$" suffix="/kWh" />
              </Field>
              <Field label="Consumo estimado" htmlFor="consumo">
                <div id="consumo" className={`${inputCls} flex items-center justify-between !bg-white/[0.02] text-zinc-400`}>
                  <span>{formatNumber((entrada.potenciaWatts / 1000) * entrada.tempoMaquinaHoras)} kWh</span>
                  <Clock size={14} />
                </div>
              </Field>
            </div>
          </Secao>

          <Secao icon={<Sparkles size={18} />} title="Extras e margem">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Custos adicionais por peça" htmlFor="adicional" hint="Tinta, ímãs, parafusos, embalagem individual.">
                <NumberInput id="adicional" value={adicional} onChange={setAdicional} prefix="R$" />
              </Field>
              <Field label="Margem de lucro sobre o custo" htmlFor="margem">
                <NumberInput id="margem" value={margem} onChange={setMargem} suffix="%" />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MARGENS_RAPIDAS.map((m) => (
                    <motion.button
                      key={m}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setMargem(String(m))}
                      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                        parseNum(margem) === m ? 'bg-brand-500/15 text-brand-200 ring-brand-400/40' : 'text-zinc-400 ring-white/10 hover:text-zinc-200'
                      }`}
                    >
                      {m}%
                    </motion.button>
                  ))}
                </div>
              </Field>
            </div>
            <input
              type="range"
              min={0}
              max={300}
              step={5}
              aria-label="Margem de lucro"
              value={Math.min(parseNum(margem), 300)}
              onChange={(e) => setMargem(e.target.value)}
              className="mt-5 w-full accent-brand-500"
            />
            <Field
              label="Preço de venda praticado (opcional)"
              htmlFor="precoVenda"
              hint="Se você já tem um preço fixo de catálogo, informe aqui. Ele é usado nos pedidos no lugar do sugerido."
              className="mt-5 sm:max-w-xs"
            >
              <NumberInput id="precoVenda" value={precoVenda} onChange={setPrecoVenda} prefix="R$" placeholder={r.precoSugerido ? r.precoSugerido.toFixed(2).replace('.', ',') : '0'} />
            </Field>
          </Secao>
        </div>

        {/* Resultado */}
        <div className="xl:sticky xl:top-10">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-500/15 via-transparent to-transparent p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-200/80">Preço sugerido</p>
              <AnimatedNumber value={r.precoSugerido} className="text-gradient mt-1 block font-display text-5xl font-bold" />
              <p className="mt-2 text-sm text-zinc-400">
                Lucro de <span className="font-semibold text-emerald-400">{formatBRL(r.lucroEstimado)}</span> por peça
                {r.precoSugerido > 0 && <> · {formatNumber(margemSobrePreco)}% do preço</>}
              </p>
              {precoVenda.trim() !== '' && (
                <p className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-zinc-300 ring-1 ring-white/10">
                  Cobrando <strong>{formatBRL(parseNum(precoVenda))}</strong>, o lucro é{' '}
                  <strong className={parseNum(precoVenda) - r.custoBase >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatBRL(parseNum(precoVenda) - r.custoBase)}
                  </strong>{' '}
                  por peça.
                </p>
              )}
            </div>

            <div className="space-y-3 border-t border-white/5 p-6 text-sm">
              <Linha label="Material" valor={r.custoMaterial} detalhe={`${formatNumber(entrada.pesoGramas)} g`} />
              <Linha label="Energia" valor={r.custoEnergia} detalhe={`${formatNumber(entrada.tempoMaquinaHoras)} h`} />
              <Linha label="Extras" valor={partes[2].valor} />
              <div className="flex items-center justify-between border-t border-white/5 pt-3 font-semibold">
                <span>Custo base</span>
                <AnimatedNumber value={r.custoBase} />
              </div>

              <div className="pt-2">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
                  {partes.map((p) => (
                    <motion.div key={p.label} className={p.cor} animate={{ width: `${(Math.max(p.valor, 0) / totalBarra) * 100}%` }} transition={{ type: 'spring', stiffness: 140, damping: 22 }} />
                  ))}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                  {partes.map((p) => (
                    <span key={p.label} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${p.cor}`} /> {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 p-6">
              <Button type="submit" loading={criar.isPending} className="w-full !py-3">
                <Save size={16} /> Salvar como produto
              </Button>
              <p className="mt-3 text-center text-xs text-zinc-500">
                Fica disponível em <Link to="/dashboard/produtos" className="text-brand-300 hover:underline">Produtos</Link> e no
                registro de vendas.
              </p>
            </div>
          </Card>
        </div>
      </form>

      {/* Resumo fixo enquanto o painel de resultado está fora da tela (mobile/tablet) */}
      <div className="h-16 xl:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-[4.25rem] z-30 border-t border-white/10 bg-zinc-900/95 px-4 py-3 backdrop-blur-xl lg:bottom-0 lg:left-64 xl:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Custo base
            <AnimatedNumber value={r.custoBase} className="block text-sm font-semibold text-zinc-200" />
          </div>
          <div className="text-right text-xs text-zinc-400">
            Preço sugerido
            <AnimatedNumber value={r.precoSugerido} className="text-gradient block font-display text-xl font-bold" />
          </div>
        </div>
      </div>
    </Page>
  )
}

function Linha({ label, valor, detalhe }: { label: string; valor: number; detalhe?: string }) {
  return (
    <div className="flex items-center justify-between text-zinc-400">
      <span>
        {label}
        {detalhe && <span className="ml-1.5 text-xs text-zinc-600">({detalhe})</span>}
      </span>
      <AnimatedNumber value={valor} className="text-zinc-200" />
    </div>
  )
}
