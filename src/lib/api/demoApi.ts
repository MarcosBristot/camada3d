/**
 * Modo demonstração: mesma API, dados no localStorage.
 * Reproduz as regras do banco (colunas geradas, trigger de custo, view de resumo,
 * unicidade de código de pedido e filamento) para que a experiência seja igual à do Supabase.
 */
import type { DespesaOperacional, Filamento, Pedido, PedidoCompleto, PedidoItem, PerfilEmpresa, Produto, StatusEntrega } from '../../types/database'
import { hojeISO } from '../dates'
import { blobParaDataUrl } from '../image'
import { executarImportacao } from '../importacao/executar'
import { chave } from '../importacao/planilha'
import { calcularPreco } from '../pricing'
import type { DataApi, NovoFilamentoInput, NovoPedidoInput, NovoProdutoInput, PrimitivasImportacao, Resumo } from './types'

const KEY = 'camada3d-demo-v3'
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

interface DemoState {
  produtos: Produto[]
  pedidos: Pedido[]
  itens: PedidoItem[]
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

  const pedidos: Pedido[] = []
  const itens: PedidoItem[] = []
  const estado = { produtos: [organizador, dragao, headset, vaso], pedidos, itens } as unknown as DemoState
  const pedido = (codigo: string, cliente: string, dias: number, status: StatusEntrega, pago: boolean, linhas: [Produto, number, number][], extra: Partial<NovoPedidoInput> = {}) =>
    inserirPedidoNoEstado(estado, {
      codigo, cliente_nome: cliente, data_pedido: hojeISO(dias), status_entrega: status, pago, forma_pagamento: 'PIX', frete: 0, desconto: 0,
      itens: linhas.map(([p, quantidade, preco_final]) => ({ produto_id: p.id, quantidade, preco_final })),
      ...extra,
    })
  pedido('PED-006', 'Bruno Lima', 0, 'pendente', false, [[organizador, 1, 50], [vaso, 2, 60], [headset, 1, 55]], { frete: 18, desconto: 5, prazo_entrega: hojeISO(5), cliente_contato: '(51) 99999-0000' })
  pedido('PED-005', 'Ana Ribeiro', -1, 'em_producao', true, [[vaso, 2, 65]])
  pedido('PED-004', 'Loja Geek Mania', -3, 'pronto', true, [[dragao, 3, 120]])
  pedido('PED-003', 'Carlos Mendes', -6, 'entregue', true, [[headset, 1, 55]])
  pedido('PED-002', 'Juliana Costa', -12, 'entregue', true, [[organizador, 1, 52]])
  pedido('PED-001', 'Pedro Alves', -20, 'cancelado', false, [[vaso, 1, 30]])

  const ts = agora()
  const despesas: DespesaOperacional[] = [
    { id: crypto.randomUUID(), user_id: DEMO_USER_ID, descricao: 'Troca de bico 0.4 mm', categoria: 'manutencao', valor: 35, data_despesa: hojeISO(-8), created_at: ts, updated_at: ts },
    { id: crypto.randomUUID(), user_id: DEMO_USER_ID, descricao: 'Caixas e plástico bolha', categoria: 'embalagem', valor: 48.9, data_despesa: hojeISO(-15), created_at: ts, updated_at: ts },
  ]

  return { produtos: [organizador, dragao, headset, vaso], pedidos, itens, despesas, filamentos: [branco, preto], perfil: null }
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
  salvar(vazio ? { produtos: [], pedidos: [], itens: [], despesas: [], filamentos: [], perfil } : { ...seed(), perfil })
}

const porDataDesc = <T extends { created_at: string }>(campo: keyof T) => (a: T, b: T) =>
  String(b[campo]).localeCompare(String(a[campo])) || b.created_at.localeCompare(a.created_at)

function inserirPedidoNoEstado(s: DemoState, input: NovoPedidoInput): string {
  if (!input.itens.length) throw new Error('O pedido precisa de pelo menos um item.')
  if (s.pedidos.some((v) => chave(v.codigo) === chave(input.codigo))) throw new Error('Já existe um pedido com esse código.')
  const ts = agora()
  const id = crypto.randomUUID()
  const novosItens = input.itens.map<PedidoItem>((it) => {
    const p = s.produtos.find((x) => x.id === it.produto_id)
    if (!p) throw new Error('Produto não encontrado.')
    if (it.quantidade < 1) throw new Error('Quantidade inválida.')
    const custo = round2(p.custo_base * it.quantidade)
    return {
      id: crypto.randomUUID(), user_id: DEMO_USER_ID, pedido_id: id, produto_id: p.id, produto_nome: p.nome,
      quantidade: it.quantidade, preco_final: round2(it.preco_final), custo_total: custo, lucro: round2(it.preco_final - custo),
      created_at: ts, updated_at: ts,
    }
  })
  s.pedidos.push({
    id, user_id: DEMO_USER_ID, codigo: input.codigo.trim(), cliente_nome: input.cliente_nome.trim(),
    cliente_contato: input.cliente_contato?.trim() || null, data_pedido: input.data_pedido, prazo_entrega: input.prazo_entrega || null,
    status_entrega: input.status_entrega, pago: input.pago, forma_pagamento: input.forma_pagamento ?? null,
    frete: round2(input.frete), desconto: round2(input.desconto), observacoes: input.observacoes?.trim() || null,
    created_at: ts, updated_at: ts,
  })
  s.itens.push(...novosItens)
  return id
}

function completar(s: DemoState, p: Pedido): PedidoCompleto {
  const mapa = new Map(s.produtos.map((x) => [x.id, x]))
  return {
    ...p,
    itens: s.itens
      .filter((i) => i.pedido_id === p.id)
      .map((i) => {
        const prod = i.produto_id ? mapa.get(i.produto_id) : undefined
        return {
          ...i,
          produtos: prod
            ? { nome: prod.nome, foto_url: prod.foto_url, material: prod.material, cor: prod.cor, peso_gramas: prod.peso_gramas, tempo_maquina_horas: prod.tempo_maquina_horas, categoria: prod.categoria }
            : null,
        }
      }),
  }
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
  listarCodigosPedido: async () => ler().pedidos.map((v) => v.codigo),
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
  async inserirPedidos(rows) {
    const s = ler()
    rows.forEach((r) => inserirPedidoNoEstado(s, r))
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
    s.itens = s.itens.map((v) => (v.produto_id === produto.id ? { ...v, produto_id: null } : v))
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

  async listarPedidos() {
    await espera()
    const s = ler()
    return [...s.pedidos].sort(porDataDesc<Pedido>('data_pedido')).map((p) => completar(s, p))
  },

  async obterPedido(id) {
    await espera()
    const s = ler()
    const p = s.pedidos.find((x) => x.id === id)
    return p ? completar(s, p) : null
  },

  async criarPedido(input) {
    await espera()
    const s = ler()
    const id = inserirPedidoNoEstado(s, input)
    salvar(s)
    return id
  },

  async atualizarStatusPedido(id, status) {
    await espera()
    const s = ler()
    s.pedidos = s.pedidos.map((v) => (v.id === id ? { ...v, status_entrega: status, updated_at: agora() } : v))
    salvar(s)
  },

  async atualizarPagamentoPedido(id, pago) {
    await espera()
    const s = ler()
    s.pedidos = s.pedidos.map((v) => (v.id === id ? { ...v, pago, updated_at: agora() } : v))
    salvar(s)
  },

  async excluirPedido(id) {
    await espera()
    const s = ler()
    s.pedidos = s.pedidos.filter((v) => v.id !== id)
    s.itens = s.itens.filter((v) => v.pedido_id !== id)
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
      contato: input.contato?.trim() || null,
      cidade: input.cidade?.trim() || null,
      rodape_os: input.rodape_os?.trim() || null,
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
    const validos = s.pedidos.filter((p) => p.status_entrega !== 'cancelado')
    const ids = new Set(validos.map((p) => p.id))
    const itens = s.itens.filter((i) => ids.has(i.pedido_id))
    const faturamentoTotal = round2(itens.reduce((t, v) => t + v.preco_final, 0) - validos.reduce((t, p) => t + p.desconto, 0))
    const custoProdutos = round2(itens.reduce((t, v) => t + v.custo_total, 0))
    const despesasOperacionais = round2(s.despesas.reduce((t, d) => t + d.valor, 0))
    const gastosTotal = round2(custoProdutos + despesasOperacionais)
    return {
      totalVendas: validos.length,
      faturamentoTotal,
      custoProdutos,
      despesasOperacionais,
      gastosTotal,
      lucroLiquido: round2(faturamentoTotal - gastosTotal),
    }
  },

  // No modo demonstração tudo fica liberado (Pro) para a pessoa conhecer o sistema
  async obterPlano() {
    const s = ler()
    return { plano: 'pro', emTeste: false, testeAte: null, proAte: null, periodo: 'demonstração', uso: { produtos: s.produtos.length, pedidosMes: s.pedidos.length } }
  },
  ehAdmin: async () => false,
  adminListarAssinaturas: async () => [],
  async adminEstenderPro() {
    throw new Error('Indisponível no modo demonstração.')
  },
}
