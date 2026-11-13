import type { VendaComProduto } from '../../types/database'
import { executarImportacao } from '../importacao/executar'
import { removerFotoProduto, uploadFotoProduto } from '../storage'
import { getSupabase } from '../supabase'
import type { DataApi, PrimitivasImportacao } from './types'

function falha(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
}

const primitivas: PrimitivasImportacao = {
  listarFilamentos: () => supabaseApi.listarFilamentos(),
  listarProdutos: () => supabaseApi.listarProdutos(),
  async listarCodigosVenda() {
    const { data, error } = await getSupabase().from('vendas').select('codigo').not('codigo', 'is', null)
    falha(error)
    return (data ?? []).map((r) => r.codigo as string)
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
  async inserirVendas(rows) {
    // custo_total omitido em todas: o trigger congela custo_base x quantidade
    const { error, count } = await getSupabase().from('vendas').insert(rows, { count: 'exact' })
    falha(error)
    return count ?? rows.length
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

  async listarVendas() {
    const { data, error } = await getSupabase()
      .from('vendas')
      .select('*, produtos(nome, foto_url)')
      .order('data_venda', { ascending: false })
      .order('created_at', { ascending: false })
    falha(error)
    return (data ?? []) as VendaComProduto[]
  },

  async criarVenda(input) {
    // custo_total omitido: o trigger do banco congela custo_base * quantidade
    const { data, error } = await getSupabase().from('vendas').insert(input).select().single()
    if (error?.code === '23505') throw new Error(`Já existe um pedido com o código ${input.codigo}.`)
    falha(error)
    return data!
  },

  async atualizarStatusVenda(id, status) {
    const { error } = await getSupabase().from('vendas').update({ status_entrega: status }).eq('id', id)
    falha(error)
  },

  async atualizarPagamento(id, pago) {
    const { error } = await getSupabase().from('vendas').update({ pago }).eq('id', id)
    falha(error)
  },

  async excluirVenda(id) {
    const { error } = await getSupabase().from('vendas').delete().eq('id', id)
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
}
