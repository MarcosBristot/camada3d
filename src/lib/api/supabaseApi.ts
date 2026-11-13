import type { VendaComProduto } from '../../types/database'
import { removerFotoProduto, uploadFotoProduto } from '../storage'
import { getSupabase } from '../supabase'
import type { DataApi } from './types'

function falha(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
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
    falha(error)
    return data!
  },

  async atualizarStatusVenda(id, status) {
    const { error } = await getSupabase().from('vendas').update({ status_entrega: status }).eq('id', id)
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
