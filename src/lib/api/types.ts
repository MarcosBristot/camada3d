import type {
  DespesaOperacional,
  NovaVenda,
  NovoProduto,
  Produto,
  StatusEntrega,
  TablesInsert,
  Venda,
  VendaComProduto,
} from '../../types/database'

export type NovoProdutoInput = Omit<NovoProduto, 'id' | 'user_id' | 'foto_url' | 'foto_path' | 'created_at' | 'updated_at'>

export type NovaVendaInput = Required<
  Pick<NovaVenda, 'produto_id' | 'cliente_nome' | 'data_venda' | 'quantidade' | 'preco_final' | 'status_entrega'>
> &
  Pick<NovaVenda, 'observacoes'>

export type NovaDespesaInput = Required<
  Pick<TablesInsert<'despesas_operacionais'>, 'descricao' | 'categoria' | 'valor' | 'data_despesa'>
>

export interface Resumo {
  totalVendas: number
  faturamentoTotal: number
  custoProdutos: number
  despesasOperacionais: number
  gastosTotal: number
  lucroLiquido: number
}

/** Contrato único: a UI não sabe se fala com o Supabase ou com o modo demonstração. */
export interface DataApi {
  listarProdutos(): Promise<Produto[]>
  criarProduto(input: NovoProdutoInput, foto?: Blob | null): Promise<Produto>
  excluirProduto(produto: Produto): Promise<void>

  listarVendas(): Promise<VendaComProduto[]>
  criarVenda(input: NovaVendaInput): Promise<Venda>
  atualizarStatusVenda(id: string, status: StatusEntrega): Promise<void>
  excluirVenda(id: string): Promise<void>

  listarDespesas(): Promise<DespesaOperacional[]>
  criarDespesa(input: NovaDespesaInput): Promise<void>
  excluirDespesa(id: string): Promise<void>

  resumo(): Promise<Resumo>
}
