/**
 * Lê a planilha "Controle 3D" (abas Filamentos, Produtos, Vendas, Marketing) e monta
 * um plano de importação revisável. Módulo puro: não importa nada de runtime, para
 * poder ser testado no Node com o arquivo real.
 *
 * Regras que espelham a planilha:
 *  - Custo do produto = gramas/1000 x preço do kg do PRIMEIRO filamento com a mesma cor
 *    (como o PROCV). Algumas linhas da planilha usam SOMASE, que soma todos os filamentos
 *    da mesma cor; quando isso dá diferença, o produto recebe um aviso.
 *  - Linhas isoladas depois de um bloco de linhas vazias (ex.: linha 101 em diante)
 *    são tratadas como exemplo/rascunho e vêm desmarcadas.
 */

export type StatusDestino = 'pendente' | 'em_producao' | 'pronto' | 'enviado' | 'entregue' | 'cancelado'

type Celula = string | number | boolean | Date | null | undefined
interface Aba {
  sheet: string
  data: Celula[][]
}

export interface LinhaFilamento {
  linha: number
  cor: string
  material: string
  marca: string | null
  precoKg: number | null
  incluir: boolean
  aviso?: string
}

export interface LinhaProduto {
  linha: number
  nome: string
  categoria: string | null
  cor: string | null
  gramas: number
  material: string
  precoKg: number | null
  custoPlanilha: number | null
  custoCalculado: number | null
  precoVenda: number | null
  incluir: boolean
  aviso?: string
}

export interface LinhaVenda {
  linha: number
  codigo: string | null
  cliente: string
  data: string // YYYY-MM-DD
  produto: string
  quantidade: number
  precoUnitario: number | null
  total: number
  formaPagamento: string | null
  statusPlanilha: string
  pago: boolean
  incluir: boolean
  aviso?: string
}

export interface LinhaDespesa {
  linha: number
  descricao: string
  valor: number
  incluir: boolean
}

export interface PlanoImportacao {
  filamentos: LinhaFilamento[]
  produtos: LinhaProduto[]
  vendas: LinhaVenda[]
  despesas: LinhaDespesa[]
  /** Status de pagamento/entrega encontrados na planilha -> status sugerido no sistema */
  mapaStatus: Record<string, StatusDestino>
  avisos: string[]
}

export const STATUS_VAZIO = '(sem status)'

// ---------------------------------------------------------------------------

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const texto = (v: Celula): string => (v === null || v === undefined ? '' : v instanceof Date ? '' : String(v).trim())

function numero(v: Celula): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(/[R$\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'))
    return v.trim() !== '' && Number.isFinite(n) ? n : null
  }
  return null
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

function dataISO(v: Celula): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    // datas do Excel não têm fuso: a biblioteca entrega meia-noite UTC
    return v.toISOString().slice(0, 10)
  }
  if (typeof v === 'number') {
    // número serial do Excel (dias desde 1899-12-30)
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000)
    return d.toISOString().slice(0, 10)
  }
  const s = texto(v)
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return null
}

function acharAba(abas: Aba[], nome: string): Aba | undefined {
  return abas.find((a) => normalizar(a.sheet) === normalizar(nome))
}

/** Mapeia títulos de coluna (normalizados, por prefixo) para índices. */
function colunas(cabecalho: Celula[], mapa: Record<string, string[]>) {
  const titulos = cabecalho.map((c) => normalizar(texto(c)))
  const out: Record<string, number> = {}
  for (const [chave, opcoes] of Object.entries(mapa)) {
    out[chave] = titulos.findIndex((t) => opcoes.some((o) => t.startsWith(o)))
  }
  return out
}

/**
 * Percorre as linhas de dados (a partir da 2ª) e marca as que vêm depois de um
 * buraco de linhas vazias como "isoladas".
 */
function linhasComDados(aba: Aba, colunaChave: number) {
  const out: { linha: number; cel: Celula[]; isolada: boolean }[] = []
  let vistoVazio = false
  let algumDado = false
  for (let i = 1; i < aba.data.length; i++) {
    const cel = aba.data[i] ?? []
    const vazia = texto(cel[colunaChave]) === ''
    if (vazia) {
      if (algumDado) vistoVazio = true
      continue
    }
    algumDado = true
    out.push({ linha: i + 1, cel, isolada: vistoVazio })
  }
  return out
}

const v = (cel: Celula[], idx: number): Celula => (idx >= 0 ? cel[idx] : null)

function sugerirStatus(s: string): StatusDestino {
  const n = normalizar(s)
  if (n.includes('cancel')) return 'cancelado'
  if (n.includes('falta') || n.includes('pendente') || n.includes('produz')) return 'pendente'
  if (n.includes('enviad')) return 'enviado'
  if (n.includes('entregue')) return 'entregue'
  if (n.includes('pronto') || n.includes('conclu')) return 'pronto'
  return 'pendente'
}

// ---------------------------------------------------------------------------

export function montarPlano(abas: Aba[]): PlanoImportacao {
  const avisos: string[] = []

  // ----- Filamentos -----
  const filamentos: LinhaFilamento[] = []
  const abaF = acharAba(abas, 'Filamentos')
  if (abaF && abaF.data.length) {
    const c = colunas(abaF.data[0], { cor: ['cor'], material: ['material'], preco: ['preco'], obs: ['observ', 'marca'] })
    for (const { linha, cel, isolada } of linhasComDados(abaF, c.cor)) {
      const obs = texto(v(cel, c.obs))
      const precoKg = numero(v(cel, c.preco))
      const exemplo = /exemplo|preencha/i.test(obs) || /preencha/i.test(texto(v(cel, c.preco)))
      const item: LinhaFilamento = {
        linha,
        cor: texto(v(cel, c.cor)),
        material: texto(v(cel, c.material)) || 'PLA',
        marca: obs && !exemplo ? obs : null,
        precoKg,
        incluir: !isolada && !exemplo && precoKg !== null,
      }
      if (precoKg === null) item.aviso = 'Sem preço por kg.'
      else if (exemplo) item.aviso = 'Parece linha de exemplo.'
      else if (isolada) item.aviso = 'Linha isolada no fim da aba (fora da tabela principal).'
      filamentos.push(item)
    }
    // cores repetidas
    const porCor = new Map<string, LinhaFilamento[]>()
    filamentos.forEach((f) => {
      const k = normalizar(f.cor) + '|' + normalizar(f.material)
      porCor.set(k, [...(porCor.get(k) ?? []), f])
    })
    porCor.forEach((lista) => {
      const comPreco = lista.filter((f) => f.precoKg !== null)
      if (comPreco.length > 1) {
        const precos = comPreco.map((f) => `R$ ${f.precoKg} (linha ${f.linha})`).join(' e ')
        avisos.push(`A cor "${lista[0].cor}" aparece ${comPreco.length}x em Filamentos: ${precos}. Fórmulas com SOMASE somam os preços.`)
      }
    })
  } else {
    avisos.push('Aba "Filamentos" não encontrada.')
  }

  // preço do kg por cor = primeiro filamento com preço (como o PROCV)
  const precoPorCor = new Map<string, LinhaFilamento>()
  filamentos.forEach((f) => {
    const k = normalizar(f.cor)
    if (f.precoKg !== null && !precoPorCor.has(k)) precoPorCor.set(k, f)
  })

  // ----- Produtos -----
  const produtos: LinhaProduto[] = []
  const abaP = acharAba(abas, 'Produtos')
  if (abaP && abaP.data.length) {
    const c = colunas(abaP.data[0], {
      nome: ['produto', 'nome'],
      categoria: ['categoria'],
      cor: ['cor'],
      gramas: ['gramas', 'peso'],
      custo: ['custo'],
      preco: ['preco de venda', 'preco'],
    })
    for (const { linha, cel, isolada } of linhasComDados(abaP, c.nome)) {
      const cor = texto(v(cel, c.cor)) || null
      const gramas = numero(v(cel, c.gramas)) ?? 0
      const fil = cor ? precoPorCor.get(normalizar(cor)) : undefined
      const custoCalculado = fil?.precoKg != null ? round2((gramas / 1000) * fil.precoKg) : null
      const custoPlanilha = numero(v(cel, c.custo))
      const precoVenda = numero(v(cel, c.preco))
      const item: LinhaProduto = {
        linha,
        nome: texto(v(cel, c.nome)),
        categoria: texto(v(cel, c.categoria)) || null,
        cor,
        gramas,
        material: fil?.material ?? 'PLA',
        precoKg: fil?.precoKg ?? null,
        custoPlanilha: custoPlanilha === null ? null : round2(custoPlanilha),
        custoCalculado,
        precoVenda,
        incluir: !isolada && precoVenda !== null && gramas > 0,
      }
      const avisosLinha: string[] = []
      if (isolada) avisosLinha.push('Linha isolada no fim da aba (parece exemplo).')
      if (precoVenda === null) avisosLinha.push('Sem preço de venda.')
      if (!fil) avisosLinha.push(`Cor "${cor ?? '—'}" sem filamento com preço: custo de material fica R$ 0.`)
      if (custoCalculado !== null && custoPlanilha !== null && Math.abs(custoCalculado - custoPlanilha) > 0.02) {
        avisosLinha.push(
          `Custo na planilha R$ ${custoPlanilha.toFixed(2)} ≠ calculado R$ ${custoCalculado.toFixed(2)} (a planilha somou filamentos repetidos da mesma cor).`,
        )
      }
      if (avisosLinha.length) item.aviso = avisosLinha.join(' ')
      produtos.push(item)
    }
  } else {
    avisos.push('Aba "Produtos" não encontrada.')
  }

  // ----- Vendas -----
  const vendas: LinhaVenda[] = []
  const mapaStatus: Record<string, StatusDestino> = {}
  const nomesProduto = new Set(produtos.map((p) => normalizar(p.nome)))
  const abaV = acharAba(abas, 'Vendas')
  if (abaV && abaV.data.length) {
    const c = colunas(abaV.data[0], {
      codigo: ['id', 'pedido', 'codigo'],
      cliente: ['cliente'],
      data: ['data'],
      produto: ['produto'],
      qtd: ['quantidade', 'qtd'],
      unit: ['custo unit', 'preco unit', 'valor unit'],
      total: ['total'],
      pagamento: ['pagamento', 'forma'],
      status: ['status'],
    })
    for (const { linha, cel } of linhasComDados(abaV, c.produto)) {
      const quantidade = Math.max(1, Math.round(numero(v(cel, c.qtd)) ?? 1))
      const unit = numero(v(cel, c.unit))
      const total = numero(v(cel, c.total)) ?? (unit !== null ? unit * quantidade : 0)
      const statusPlanilha = texto(v(cel, c.status)) || STATUS_VAZIO
      const produto = texto(v(cel, c.produto))
      const data = dataISO(v(cel, c.data))
      if (!(statusPlanilha in mapaStatus)) mapaStatus[statusPlanilha] = sugerirStatus(statusPlanilha === STATUS_VAZIO ? '' : statusPlanilha)
      const item: LinhaVenda = {
        linha,
        codigo: texto(v(cel, c.codigo)) || null,
        cliente: texto(v(cel, c.cliente)).replace(/\s+/g, ' '),
        data: data ?? new Date().toISOString().slice(0, 10),
        produto,
        quantidade,
        precoUnitario: unit,
        total: round2(total),
        formaPagamento: texto(v(cel, c.pagamento)) || null,
        statusPlanilha,
        pago: /^pago/i.test(statusPlanilha),
        incluir: true,
      }
      const av: string[] = []
      if (!nomesProduto.has(normalizar(produto))) {
        av.push(`Produto "${produto}" não está na aba Produtos.`)
      }
      if (!item.cliente) av.push('Sem cliente.')
      if (!data) av.push('Data inválida: usando hoje.')
      if (av.length) {
        item.aviso = av.join(' ')
        item.incluir = nomesProduto.has(normalizar(produto)) && !!item.cliente
      }
      vendas.push(item)
    }
  } else {
    avisos.push('Aba "Vendas" não encontrada.')
  }

  // ----- Marketing -> despesas -----
  const despesas: LinhaDespesa[] = []
  const abaM = acharAba(abas, 'Marketing')
  if (abaM && abaM.data.length) {
    let anotacoes = 0
    for (let i = 1; i < abaM.data.length; i++) {
      const cel = abaM.data[i] ?? []
      const descricao = texto(cel[0])
      const valor = numero(cel[1])
      if (descricao && valor !== null && valor > 0) despesas.push({ linha: i + 1, descricao, valor: round2(valor), incluir: true })
      else if (cel.slice(2).some((x) => texto(x) !== '')) anotacoes++
    }
    if (anotacoes) avisos.push(`Marketing: ${anotacoes} anotação(ões) soltas nas colunas ao lado não são importadas.`)
  }

  return { filamentos, produtos, vendas, despesas, mapaStatus, avisos }
}

/** Margem (sobre o custo) que reproduz o preço praticado como preço sugerido. */
export function margemParaPreco(custo: number, preco: number): number {
  if (custo <= 0 || preco <= 0) return 0
  return Math.max(0, round2((preco / custo - 1) * 100))
}

export const chave = normalizar
