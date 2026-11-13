import type { Json, PedidoCompleto } from '../../types/database'
import { executarImportacao } from '../importacao/executar'
import { removerFotoProduto, uploadFotoProduto } from '../storage'
import { getSupabase } from '../supabase'
import type { DataApi, NovoPedidoInput, PrimitivasImportacao } from './types'

/** Campos do produto que a OS e as listas precisam */
const SELECT_PEDIDO = '*, itens:pedido_itens(*, produtos(nome, foto_url, material, cor, peso_gramas, tempo_maquina_horas, categoria))'

/** Erros do banco em português; "LIMITE_PLANO: ..." vem dos limites do plano Free */
function traduzirErro(error: { message: string; code?: string }): Error {
  if (error.message.startsWith('LIMITE_PLANO:')) {
    const texto = error.message.replace('LIMITE_PLANO:', '').trim()
    const e = new Error(texto.charAt(0).toUpperCase() + texto.slice(1))
    e.name = 'LimitePlano'
    return e
  }
  if (error.code === '23505' && /pedidos_codigo_unico/.test(error.message)) return new Error('Já existe um pedido com esse código.')
  return new Error(error.message)
}

async function rpcCriarPedido(input: NovoPedidoInput): Promise<string> {
  const { itens, ...pedido } = input
  const { data, error } = await getSupabase().rpc('criar_pedido', {
    pedido: pedido as unknown as Json,
    itens: itens as unknown as Json,
  })
  if (error) throw traduzirErro(error)
  return data as string
}

function falha(error: { message: string; code?: string } | null): asserts error is null {
  if (error) throw traduzirErro(error)
}

const primitivas: PrimitivasImportacao = {
  listarFilamentos: () => supabaseApi.listarFilamentos(),
  listarProdutos: () => supabaseApi.listarProdutos(),
  async listarCodigosPedido() {
    const { data, error } = await getSupabase().from('pedidos').select('codigo')
    falha(error)
    return (data ?? []).map((r) => r.codigo)
  },
  listarDespesas: () => supabaseApi.listarDespesas(),
  async inserirFilamentos(rows) {
    const { data, error } = await getSupabase().from('filamentos').insert(rows).select()
    falha(error)
    return data ?? []
  },
  async inserirProdutos(rows) {
    const { data, error } = await getSupabase().from('produtos').insert(rows).select()
    falha(error)
    return data ?? []
  },
  async inserirPedidos(rows) {
    let n = 0
    for (const r of rows) {
      await rpcCriarPedido(r)
      n++
    }
    return n
  },
  async inserirDespesas(rows) {
    const { error, count } = await getSupabase().from('despesas_operacionais').insert(rows, { count: 'exact' })
    falha(error)
    return count ?? rows.length
  },
}

export const supabaseApi: DataApi = {
  async listarProdutos() {
    const { data, error } = await getSupabase().from('produtos').select('*').order('created_at', { ascending: false })
    falha(error)
    return data ?? []
  },

  async criarProduto(input, foto) {
    let foto_url: string | null = null
    let foto_path: string | null = null
    if (foto) {
      const up = await uploadFotoProduto(foto)
      foto_url = up.publicUrl
      foto_path = up.path
    }

    const { data, error } = await getSupabase()
      .from('produtos')
      .insert({ ...input, foto_url, foto_path })
      .select()
      .single()

    if (error) {
      // não deixa foto órfã no bucket
      if (foto_path) await removerFotoProduto(foto_path).catch(() => undefined)
      throw new Error(error.message)
    }
    return data
  },

  async excluirProduto(produto) {
    const { error } = await getSupabase().from('produtos').delete().eq('id', produto.id)
    falha(error)
    if (produto.foto_path) await removerFotoProduto(produto.foto_path).catch(() => undefined)
  },

  async atualizarFotoProduto(produto, foto) {
    let foto_url: string | null = null
    let foto_path: string | null = null
    if (foto) {
      const up = await uploadFotoProduto(foto)
      foto_url = up.publicUrl
      foto_path = up.path
    }
    const { data, error } = await getSupabase()
      .from('produtos')
      .update({ foto_url, foto_path })
      .eq('id', produto.id)
      .select()
      .single()
    if (error) {
      if (foto_path) await removerFotoProduto(foto_path).catch(() => undefined)
      throw new Error(error.message)
    }
    // apaga a foto antiga do bucket
    if (produto.foto_path && produto.foto_path !== foto_path) await removerFotoProduto(produto.foto_path).catch(() => undefined)
    return data
  },

  async listarPedidos() {
    const { data, error } = await getSupabase()
      .from('pedidos')
      .select(SELECT_PEDIDO)
      .order('data_pedido', { ascending: false })
      .order('created_at', { ascending: false })
    falha(error)
    return (data ?? []) as unknown as PedidoCompleto[]
  },

  async obterPedido(id) {
    const { data, error } = await getSupabase().from('pedidos').select(SELECT_PEDIDO).eq('id', id).maybeSingle()
    falha(error)
    return (data ?? null) as unknown as PedidoCompleto | null
  },

  criarPedido: (input) => rpcCriarPedido(input),

  async atualizarStatusPedido(id, status) {
    const { error } = await getSupabase().from('pedidos').update({ status_entrega: status }).eq('id', id)
    falha(error)
  },

  async atualizarPagamentoPedido(id, pago) {
    const { error } = await getSupabase().from('pedidos').update({ pago }).eq('id', id)
    falha(error)
  },

  async excluirPedido(id) {
    const { error } = await getSupabase().from('pedidos').delete().eq('id', id)
    falha(error)
  },

  async listarDespesas() {
    const { data, error } = await getSupabase()
      .from('despesas_operacionais')
      .select('*')
      .order('data_despesa', { ascending: false })
      .order('created_at', { ascending: false })
    falha(error)
    return data ?? []
  },

  async criarDespesa(input) {
    const { error } = await getSupabase().from('despesas_operacionais').insert(input)
    falha(error)
  },

  async excluirDespesa(id) {
    const { error } = await getSupabase().from('despesas_operacionais').delete().eq('id', id)
    falha(error)
  },

  async listarFilamentos() {
    const { data, error } = await getSupabase().from('filamentos').select('*').order('cor').order('preco_kg')
    falha(error)
    return data ?? []
  },

  async criarFilamento(input) {
    const { data, error } = await getSupabase().from('filamentos').insert(input).select().single()
    if (error?.code === '23505') throw new Error('Esse filamento (cor, material e marca) já está cadastrado.')
    falha(error)
    return data!
  },

  async excluirFilamento(id) {
    const { error } = await getSupabase().from('filamentos').delete().eq('id', id)
    falha(error)
  },

  async obterPerfil() {
    const { data, error } = await getSupabase().from('perfil_empresa').select('*').maybeSingle()
    falha(error)
    return data
  },

  async salvarPerfil(input, logo) {
    const sb = getSupabase()
    const { data: auth } = await sb.auth.getUser()
    if (!auth.user) throw new Error('Faça login novamente.')
    const atual = await supabaseApi.obterPerfil()

    let logo_url = atual?.logo_url ?? null
    let logo_path = atual?.logo_path ?? null
    let novoPath: string | null = null
    if (logo?.nova) {
      const up = await uploadFotoProduto(logo.nova)
      novoPath = up.path
      logo_url = up.publicUrl
      logo_path = up.path
    } else if (logo?.remover) {
      logo_url = null
      logo_path = null
    }

    const { data, error } = await sb
      .from('perfil_empresa')
      .upsert({ user_id: auth.user.id, ...input, nome: input.nome.trim(), logo_url, logo_path }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) {
      if (novoPath) await removerFotoProduto(novoPath).catch(() => undefined)
      throw new Error(error.message)
    }
    // logo anterior substituída ou removida
    if (atual?.logo_path && atual.logo_path !== logo_path) await removerFotoProduto(atual.logo_path).catch(() => undefined)
    return data
  },

  importar: (entrada) => executarImportacao(entrada, primitivas),

  async excluirConta() {
    const sb = getSupabase()
    const { data: auth } = await sb.auth.getUser()
    const uid = auth.user?.id
    if (!uid) throw new Error('Faça login novamente.')

    // 1) arquivos da pasta do usuário (fotos e logo) — o SQL não pode apagar o Storage
    const bucket = sb.storage.from('produtos')
    for (let rodada = 0; rodada < 50; rodada++) {
      const { data: arquivos, error } = await bucket.list(uid, { limit: 100 })
      if (error) throw new Error(error.message)
      if (!arquivos?.length) break
      const { error: erroRemocao } = await bucket.remove(arquivos.map((a) => `${uid}/${a.name}`))
      if (erroRemocao) throw new Error(erroRemocao.message)
    }

    // 2) conta + dados em cascata
    const { error } = await sb.rpc('excluir_minha_conta')
    falha(error)

    // 3) a sessão já não vale mais; limpa o que ficou no navegador
    await sb.auth.signOut({ scope: 'local' }).catch(() => undefined)
  },

  async resumo() {
    const { data, error } = await getSupabase().from('resumo_financeiro').select('*').maybeSingle()
    falha(error)
    const n = (v: number | null | undefined) => Number(v ?? 0)
    return {
      totalVendas: n(data?.total_vendas),
      faturamentoTotal: n(data?.faturamento_total),
      custoProdutos: n(data?.custo_produtos),
      despesasOperacionais: n(data?.despesas_operacionais),
      gastosTotal: n(data?.gastos_total),
      lucroLiquido: n(data?.lucro_liquido),
    }
  },

  async obterPlano() {
    const sb = getSupabase()
    const inicioMes = new Date()
    inicioMes.setUTCDate(1)
    inicioMes.setUTCHours(0, 0, 0, 0)
    const [plano, assinatura, produtos, pedidos] = await Promise.all([
      sb.rpc('plano_efetivo'),
      sb.from('assinaturas').select('*').maybeSingle(),
      sb.from('produtos').select('id', { count: 'exact', head: true }),
      sb.from('pedidos').select('id', { count: 'exact', head: true }).gte('created_at', inicioMes.toISOString()),
    ])
    falha(plano.error)
    falha(assinatura.error)
    const a = assinatura.data
    const agora = Date.now()
    const pagoAtivo = !!a?.pro_ate && new Date(a.pro_ate).getTime() > agora
    return {
      plano: plano.data === 'pro' ? 'pro' : 'free',
      emTeste: plano.data === 'pro' && !pagoAtivo,
      testeAte: a?.teste_ate ?? null,
      proAte: a?.pro_ate ?? null,
      periodo: a?.periodo ?? null,
      uso: { produtos: produtos.count ?? 0, pedidosMes: pedidos.count ?? 0 },
    }
  },

  async ehAdmin() {
    const { data, error } = await getSupabase().rpc('eh_admin')
    if (error) return false
    return !!data
  },

  async adminListarAssinaturas() {
    const { data, error } = await getSupabase().rpc('admin_listar_assinaturas')
    falha(error)
    return data ?? []
  },

  async adminEstenderPro(userId, dias, periodo, nota) {
    const { data, error } = await getSupabase().rpc('admin_estender_pro', {
      alvo: userId,
      dias,
      novo_periodo: periodo ?? undefined,
      nota: nota ?? undefined,
    })
    falha(error)
    return data as string
  },
}
