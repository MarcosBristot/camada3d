/**
 * Modo demonstração: mesma API, dados no localStorage.
 * Reproduz as regras do banco (colunas geradas, trigger de custo, view de resumo)
 * para que a experiência seja idêntica à do Supabase.
 */
import type { DespesaOperacional, Produto, Venda, VendaComProduto } from '../../types/database'
import { hojeISO } from '../dates'
import { blobParaDataUrl } from '../image'
import { calcularPreco } from '../pricing'
import type { DataApi, NovoProdutoInput, Resumo } from './types'

const KEY = 'camada3d-demo-v1'
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

interface DemoState {
  produtos: Produto[]
  vendas: Venda[]
  despesas: DespesaOperacional[]
}

const agora = () => new Date().toISOString()
const espera = () => new Promise((r) => setTimeout(r, 220))
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

function montarProduto(input: NovoProdutoInput, extra: Partial<Produto> = {}): Produto {
  const r = calcularPreco({
    pesoGramas: input.peso_gramas ?? 0,
    precoKgMaterial: input.preco_kg_material ?? 0,
    tempoMaquinaHoras: input.tempo_maquina_horas ?? 0,
    potenciaWatts: input.potencia_watts ?? 0,
    tarifaKwh: input.tarifa_kwh ?? 0,
    custoAdicional: input.custo_adicional ?? 0,
    margemLucroPct: input.margem_lucro_pct ?? 0,
  })
  const ts = agora()
  return {
    id: crypto.randomUUID(),
    user_id: DEMO_USER_ID,
    nome: input.nome,
    descricao: input.descricao ?? null,
    material: input.material ?? 'PLA',
    foto_url: null,
    foto_path: null,
    peso_gramas: input.peso_gramas ?? 0,
    preco_kg_material: input.preco_kg_material ?? 0,
    tempo_maquina_horas: input.tempo_maquina_horas ?? 0,
    potencia_watts: input.potencia_watts ?? 0,
    tarifa_kwh: input.tarifa_kwh ?? 0,
    custo_adicional: input.custo_adicional ?? 0,
    margem_lucro_pct: input.margem_lucro_pct ?? 0,
    custo_material: r.custoMaterial,
    custo_energia: r.custoEnergia,
    custo_base: r.custoBase,
    preco_sugerido: r.precoSugerido,
    ativo: input.ativo ?? true,
    created_at: ts,
    updated_at: ts,
    ...extra,
  }
}

function montarVenda(p: Produto, v: Omit<Venda, 'id' | 'user_id' | 'produto_nome' | 'custo_total' | 'lucro' | 'created_at' | 'updated_at' | 'observacoes'> & { observacoes?: string | null }): Venda {
  const custo = round2(p.custo_base * v.quantidade)
  const ts = agora()
  return {
    id: crypto.randomUUID(),
    user_id: DEMO_USER_ID,
    produto_nome: p.nome,
    custo_total: custo,
    lucro: round2(v.preco_final - custo),
    created_at: ts,
    updated_at: ts,
    ...v,
    observacoes: v.observacoes ?? null,
  }
}

function seed(): DemoState {
  const base = { preco_kg_material: 120, potencia_watts: 150, tarifa_kwh: 0.85 }
  const vaso = montarProduto({ ...base, nome: 'Vaso espiral', material: 'PLA Silk', peso_gramas: 85, tempo_maquina_horas: 4.5, custo_adicional: 2, margem_lucro_pct: 150 })
  const headset = montarProduto({ ...base, nome: 'Suporte de headset', material: 'PETG', preco_kg_material: 110, peso_gramas: 140, tempo_maquina_horas: 7, custo_adicional: 1.5, margem_lucro_pct: 120 })
  const dragao = montarProduto({ ...base, nome: 'Miniatura dragão', material: 'Resina', preco_kg_material: 180, potencia_watts: 60, peso_gramas: 40, tempo_maquina_horas: 6, custo_adicional: 5, margem_lucro_pct: 200 })
  const organizador = montarProduto({ ...base, nome: 'Organizador de mesa', material: 'PLA', preco_kg_material: 100, potencia_watts: 130, peso_gramas: 210, tempo_maquina_horas: 9.5, margem_lucro_pct: 100 })

  const vendas: Venda[] = [
    montarVenda(vaso, { produto_id: vaso.id, cliente_nome: 'Ana Ribeiro', data_venda: hojeISO(-1), quantidade: 2, preco_final: 65, status_entrega: 'em_producao' }),
    montarVenda(dragao, { produto_id: dragao.id, cliente_nome: 'Loja Geek Mania', data_venda: hojeISO(-3), quantidade: 3, preco_final: 120, status_entrega: 'enviado' }),
    montarVenda(headset, { produto_id: headset.id, cliente_nome: 'Carlos Mendes', data_venda: hojeISO(-6), quantidade: 1, preco_final: 55, status_entrega: 'entregue' }),
    montarVenda(organizador, { produto_id: organizador.id, cliente_nome: 'Juliana Costa', data_venda: hojeISO(-12), quantidade: 1, preco_final: 52, status_entrega: 'entregue' }),
    montarVenda(vaso, { produto_id: vaso.id, cliente_nome: 'Pedro Alves', data_venda: hojeISO(-20), quantidade: 1, preco_final: 30, status_entrega: 'cancelado' }),
  ]

  const ts = agora()
  const despesas: DespesaOperacional[] = [
    { id: crypto.randomUUID(), user_id: DEMO_USER_ID, descricao: 'Troca de bico 0.4 mm', categoria: 'manutencao', valor: 35, data_despesa: hojeISO(-8), created_at: ts, updated_at: ts },
    { id: crypto.randomUUID(), user_id: DEMO_USER_ID, descricao: 'Caixas e plástico bolha', categoria: 'embalagem', valor: 48.9, data_despesa: hojeISO(-15), created_at: ts, updated_at: ts },
  ]

  return { produtos: [organizador, dragao, headset, vaso], vendas, despesas }
}

function ler(): DemoState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DemoState
  } catch {
    /* estado corrompido: recria */
  }
  const s = seed()
  salvar(s)
  return s
}

function salvar(s: DemoState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    throw new Error('Armazenamento do navegador cheio. Remova produtos com foto ou reinicie a demonstração.')
  }
}

export function reiniciarDemo(vazio = false) {
  salvar(vazio ? { produtos: [], vendas: [], despesas: [] } : seed())
}

const porDataDesc = <T extends { created_at: string }>(campo: keyof T) => (a: T, b: T) =>
  String(b[campo]).localeCompare(String(a[campo])) || b.created_at.localeCompare(a.created_at)

export const demoApi: DataApi = {
  async listarProdutos() {
    await espera()
    return [...ler().produtos].sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async criarProduto(input, foto) {
    await espera()
    const s = ler()
    const foto_url = foto ? await blobParaDataUrl(foto) : null
    const p = montarProduto(input, { foto_url, foto_path: foto ? 'demo' : null })
    s.produtos.push(p)
    salvar(s)
    return p
  },

  async excluirProduto(produto) {
    await espera()
    const s = ler()
    s.produtos = s.produtos.filter((p) => p.id !== produto.id)
    // on delete set null — o histórico mantém produto_nome
    s.vendas = s.vendas.map((v) => (v.produto_id === produto.id ? { ...v, produto_id: null } : v))
    salvar(s)
  },

  async listarVendas() {
    await espera()
    const s = ler()
    const mapa = new Map(s.produtos.map((p) => [p.id, p]))
    return [...s.vendas].sort(porDataDesc<Venda>('data_venda')).map<VendaComProduto>((v) => {
      const p = v.produto_id ? mapa.get(v.produto_id) : undefined
      return { ...v, produtos: p ? { nome: p.nome, foto_url: p.foto_url } : null }
    })
  },

  async criarVenda(input) {
    await espera()
    const s = ler()
    const p = s.produtos.find((x) => x.id === input.produto_id)
    if (!p) throw new Error('Produto não encontrado.')
    const v = montarVenda(p, { ...input, cliente_nome: input.cliente_nome.trim() })
    s.vendas.push(v)
    salvar(s)
    return v
  },

  async atualizarStatusVenda(id, status) {
    await espera()
    const s = ler()
    s.vendas = s.vendas.map((v) => (v.id === id ? { ...v, status_entrega: status, updated_at: agora() } : v))
    salvar(s)
  },

  async excluirVenda(id) {
    await espera()
    const s = ler()
    s.vendas = s.vendas.filter((v) => v.id !== id)
    salvar(s)
  },

  async listarDespesas() {
    await espera()
    return [...ler().despesas].sort(porDataDesc<DespesaOperacional>('data_despesa'))
  },

  async criarDespesa(input) {
    await espera()
    const s = ler()
    const ts = agora()
    s.despesas.push({ id: crypto.randomUUID(), user_id: DEMO_USER_ID, ...input, valor: round2(input.valor), created_at: ts, updated_at: ts })
    salvar(s)
  },

  async excluirDespesa(id) {
    await espera()
    const s = ler()
    s.despesas = s.despesas.filter((d) => d.id !== id)
    salvar(s)
  },

  // Mesma lógica da view resumo_financeiro
  async resumo(): Promise<Resumo> {
    await espera()
    const s = ler()
    const validas = s.vendas.filter((v) => v.status_entrega !== 'cancelado')
    const faturamentoTotal = round2(validas.reduce((t, v) => t + v.preco_final, 0))
    const custoProdutos = round2(validas.reduce((t, v) => t + v.custo_total, 0))
    const despesasOperacionais = round2(s.despesas.reduce((t, d) => t + d.valor, 0))
    const gastosTotal = round2(custoProdutos + despesasOperacionais)
    return {
      totalVendas: validas.length,
      faturamentoTotal,
      custoProdutos,
      despesasOperacionais,
      gastosTotal,
      lucroLiquido: round2(faturamentoTotal - gastosTotal),
    }
  },
}
