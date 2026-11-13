/**
 * Modo demonstração: mesma API, dados no localStorage.
 * Reproduz as regras do banco (colunas geradas, trigger de custo, view de resumo,
 * unicidade de código de pedido e filamento) para que a experiência seja igual à do Supabase.
 */
import type { DespesaOperacional, Filamento, PerfilEmpresa, Produto, Venda, VendaComProduto } from '../../types/database'
import { hojeISO } from '../dates'
import { blobParaDataUrl } from '../image'
import { executarImportacao } from '../importacao/executar'
import { chave } from '../importacao/planilha'
import { calcularPreco } from '../pricing'
import type { DataApi, NovaVendaInput, NovoFilamentoInput, NovoProdutoInput, PrimitivasImportacao, Resumo } from './types'

const KEY = 'camada3d-demo-v2'
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

interface DemoState {
  produtos: Produto[]
  vendas: Venda[]
  despesas: DespesaOperacional[]
  filamentos: Filamento[]
  perfil: PerfilEmpresa | null
}

const agora = () => new Date().toISOString()
const espera = () => new Promise((r) => setTimeout(r, 220))
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

function montarProduto(input: NovoProdutoInput, extra: Partial<Produto> = {}): Produto {
  // numeric(10,2) no banco
  const precoKg = round2(input.preco_kg_material ?? 0)
  const r = calcularPreco({
    pesoGramas: input.peso_gramas ?? 0,
    precoKgMaterial: precoKg,
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
    preco_kg_material: precoKg,
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
    categoria: input.categoria ?? null,
    cor: input.cor ?? null,
    preco_venda: input.preco_venda ?? null,
    filamento_id: input.filamento_id ?? null,
    created_at: ts,
    updated_at: ts,
    ...extra,
  }
}

function montarVenda(p: Produto, v: NovaVendaInput): Venda {
  const custo = round2(p.custo_base * v.quantidade)
  const ts = agora()
  return {
    id: crypto.randomUUID(),
    user_id: DEMO_USER_ID,
    produto_id: v.produto_id,
    produto_nome: p.nome,
    cliente_nome: v.cliente_nome.trim(),
    data_venda: v.data_venda,
    quantidade: v.quantidade,
    preco_final: v.preco_final,
    custo_total: custo,
    lucro: round2(v.preco_final - custo),
    status_entrega: v.status_entrega,
    observacoes: v.observacoes ?? null,
    codigo: v.codigo ?? null,
    pago: v.pago ?? false,
    forma_pagamento: v.forma_pagamento ?? null,
    created_at: ts,
    updated_at: ts,
  }
}

function montarFilamento(f: NovoFilamentoInput): Filamento {
  const ts = agora()
  return { id: crypto.randomUUID(), user_id: DEMO_USER_ID, cor: f.cor, material: f.material, marca: f.marca ?? null, preco_kg: round2(f.preco_kg), created_at: ts, updated_at: ts }
}

function seed(): DemoState {
  const branco = montarFilamento({ cor: 'Branco', material: 'PLA', marca: 'Exemplo', preco_kg: 90 })
  const preto = montarFilamento({ cor: 'Preto', material: 'PETG', marca: 'Exemplo', preco_kg: 110 })
  const base = { preco_kg_material: 120, potencia_watts: 150, tarifa_kwh: 0.85 }
  const vaso = montarProduto({ ...base, nome: 'Vaso espiral', material: 'PLA Silk', categoria: 'Decoração', peso_gramas: 85, tempo_maquina_horas: 4.5, custo_adicional: 2, margem_lucro_pct: 150 })
  const headset = montarProduto({ ...base, nome: 'Suporte de headset', material: 'PETG', cor: 'Preto', categoria: 'Setup', filamento_id: preto.id, preco_kg_material: 110, peso_gramas: 140, tempo_maquina_horas: 7, custo_adicional: 1.5, margem_lucro_pct: 120 })
  const dragao = montarProduto({ ...base, nome: 'Miniatura dragão', material: 'Resina', categoria: 'Miniatura', preco_kg_material: 180, potencia_watts: 60, peso_gramas: 40, tempo_maquina_horas: 6, custo_adicional: 5, margem_lucro_pct: 200 })
  const organizador = montarProduto({ ...base, nome: 'Organizador de mesa', material: 'PLA', cor: 'Branco', categoria: 'Setup', filamento_id: branco.id, preco_kg_material: 90, potencia_watts: 130, peso_gramas: 210, tempo_maquina_horas: 9.5, margem_lucro_pct: 100, preco_venda: 50 })

  const venda = (p: Produto, dias: number, cliente: string, qtd: number, preco: number, status: Venda['status_entrega'], pago: boolean, codigo: string) =>
    montarVenda(p, { produto_id: p.id, cliente_nome: cliente, data_venda: hojeISO(dias), quantidade: qtd, preco_final: preco, status_entrega: status, pago, codigo, forma_pagamento: 'PIX' })

  const vendas: Venda[] = [
    venda(vaso, -1, 'Ana Ribeiro', 2, 65, 'em_producao', true, 'PED-005'),
    venda(organizador, 0, 'Bruno Lima', 1, 50, 'pendente', false, 'PED-006'),
    venda(dragao, -3, 'Loja Geek Mania', 3, 120, 'pronto', true, 'PED-004'),
    venda(headset, -6, 'Carlos Mendes', 1, 55, 'entregue', true, 'PED-003'),
    venda(organizador, -12, 'Juliana Costa', 1, 52, 'entregue', true, 'PED-002'),
    venda(vaso, -20, 'Pedro Alves', 1, 30, 'cancelado', false, 'PED-001'),
  ]

  const ts = agora()
  const despesas: DespesaOperacional[] = [
    { id: crypto.randomUUID(), user_id: DEMO_USER_ID, descricao: 'Troca de bico 0.4 mm', categoria: 'manutencao', valor: 35, data_despesa: hojeISO(-8), created_at: ts, updated_at: ts },
    { id: crypto.randomUUID(), user_id: DEMO_USER_ID, descricao: 'Caixas e plástico bolha', categoria: 'embalagem', valor: 48.9, data_despesa: hojeISO(-15), created_at: ts, updated_at: ts },
  ]

  return { produtos: [organizador, dragao, headset, vaso], vendas, despesas, filamentos: [branco, preto], perfil: null }
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
  const perfil = ler().perfil // mantém a identidade visual
  salvar(vazio ? { produtos: [], vendas: [], despesas: [], filamentos: [], perfil } : { ...seed(), perfil })
}

const porDataDesc = <T extends { created_at: string }>(campo: keyof T) => (a: T, b: T) =>
  String(b[campo]).localeCompare(String(a[campo])) || b.created_at.localeCompare(a.created_at)

function inserirVendaNoEstado(s: DemoState, input: NovaVendaInput): Venda {
  const p = s.produtos.find((x) => x.id === input.produto_id)
  if (!p) throw new Error('Produto não encontrado.')
  if (input.codigo && s.vendas.some((v) => v.codigo && chave(v.codigo) === chave(input.codigo!))) {
    throw new Error(`Já existe um pedido com o código ${input.codigo}.`)
  }
  const v = montarVenda(p, input)
  s.vendas.push(v)
  return v
}

function inserirFilamentoNoEstado(s: DemoState, input: NovoFilamentoInput): Filamento {
  const k = (f: { cor: string; material: string; marca?: string | null }) => `${chave(f.cor)}|${chave(f.material)}|${chave(f.marca ?? '')}`
  if (s.filamentos.some((f) => k(f) === k(input))) throw new Error('Esse filamento (cor, material e marca) já está cadastrado.')
  const f = montarFilamento(input)
  s.filamentos.push(f)
  return f
}

const primitivas: PrimitivasImportacao = {
  listarFilamentos: async () => ler().filamentos,
  listarProdutos: async () => ler().produtos,
  listarCodigosVenda: async () => ler().vendas.flatMap((v) => (v.codigo ? [v.codigo] : [])),
  listarDespesas: async () => ler().despesas,
  async inserirFilamentos(rows) {
    const s = ler()
    const out = rows.map((r) => inserirFilamentoNoEstado(s, r))
    salvar(s)
    return out
  },
  async inserirProdutos(rows) {
    const s = ler()
    const out = rows.map((r) => montarProduto(r))
    s.produtos.push(...out)
    salvar(s)
    return out
  },
  async inserirVendas(rows) {
    const s = ler()
    rows.forEach((r) => inserirVendaNoEstado(s, r))
    salvar(s)
    return rows.length
  },
  async inserirDespesas(rows) {
    const s = ler()
    const ts = agora()
    rows.forEach((d) => s.despesas.push({ id: crypto.randomUUID(), user_id: DEMO_USER_ID, ...d, valor: round2(d.valor), created_at: ts, updated_at: ts }))
    salvar(s)
    return rows.length
  },
}

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

  async atualizarFotoProduto(produto, foto) {
    await espera()
    const s = ler()
    const foto_url = foto ? await blobParaDataUrl(foto) : null
    let atualizado: Produto | undefined
    s.produtos = s.produtos.map((p) => (p.id === produto.id ? (atualizado = { ...p, foto_url, foto_path: foto ? 'demo' : null, updated_at: agora() }) : p))
    if (!atualizado) throw new Error('Produto não encontrado.')
    salvar(s)
    return atualizado
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
    const v = inserirVendaNoEstado(s, input)
    salvar(s)
    return v
  },

  async atualizarStatusVenda(id, status) {
    await espera()
    const s = ler()
    s.vendas = s.vendas.map((v) => (v.id === id ? { ...v, status_entrega: status, updated_at: agora() } : v))
    salvar(s)
  },

  async atualizarPagamento(id, pago) {
    await espera()
    const s = ler()
    s.vendas = s.vendas.map((v) => (v.id === id ? { ...v, pago, updated_at: agora() } : v))
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
    await primitivas.inserirDespesas([input])
  },

  async excluirDespesa(id) {
    await espera()
    const s = ler()
    s.despesas = s.despesas.filter((d) => d.id !== id)
    salvar(s)
  },

  async listarFilamentos() {
    await espera()
    return [...ler().filamentos].sort((a, b) => a.cor.localeCompare(b.cor) || a.preco_kg - b.preco_kg)
  },

  async criarFilamento(input) {
    await espera()
    const s = ler()
    const f = inserirFilamentoNoEstado(s, input)
    salvar(s)
    return f
  },

  async excluirFilamento(id) {
    await espera()
    const s = ler()
    s.filamentos = s.filamentos.filter((f) => f.id !== id)
    s.produtos = s.produtos.map((p) => (p.filamento_id === id ? { ...p, filamento_id: null } : p))
    salvar(s)
  },

  async obterPerfil() {
    await espera()
    return ler().perfil
  },

  async salvarPerfil(input, logo) {
    await espera()
    const s = ler()
    const ts = agora()
    let logo_url = s.perfil?.logo_url ?? null
    if (logo?.nova) logo_url = await blobParaDataUrl(logo.nova)
    else if (logo?.remover) logo_url = null
    s.perfil = {
      user_id: DEMO_USER_ID,
      ...input,
      nome: input.nome.trim(),
      logo_url,
      logo_path: logo_url ? 'demo' : null,
      created_at: s.perfil?.created_at ?? ts,
      updated_at: ts,
    }
    salvar(s)
    return s.perfil
  },

  async excluirConta() {
    await espera()
    localStorage.removeItem(KEY)
  },

  async importar(entrada) {
    await espera()
    return executarImportacao(entrada, primitivas)
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
