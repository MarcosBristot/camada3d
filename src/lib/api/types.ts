import type {
  DespesaOperacional,
  Filamento,
  NovaVenda,
  NovoFilamento,
  NovoProduto,
  PerfilEmpresa,
  Produto,
  StatusEntrega,
  TablesInsert,
  TemaPreferido,
  Venda,
  VendaComProduto,
} from '../../types/database'
import type { LinhaDespesa, LinhaFilamento, LinhaProduto, LinhaVenda } from '../importacao/planilha'

export type NovoProdutoInput = Omit<NovoProduto, 'id' | 'user_id' | 'foto_url' | 'foto_path' | 'created_at' | 'updated_at'>

export type NovaVendaInput = Required<
  Pick<NovaVenda, 'produto_id' | 'cliente_nome' | 'data_venda' | 'quantidade' | 'preco_final' | 'status_entrega'>
> &
  Pick<NovaVenda, 'observacoes' | 'codigo' | 'pago' | 'forma_pagamento'>

export type NovaDespesaInput = Required<
  Pick<TablesInsert<'despesas_operacionais'>, 'descricao' | 'categoria' | 'valor' | 'data_despesa'>
>

export type NovoFilamentoInput = Required<Pick<NovoFilamento, 'cor' | 'material' | 'preco_kg'>> & Pick<NovoFilamento, 'marca'>

export interface PerfilInput {
  nome: string
  cor_primaria: string
  cor_secundaria: string
  tema: TemaPreferido
}

/** nova: Blob da logo a enviar; remover: apagar a logo atual. */
export interface LogoAlteracao {
  nova?: Blob | null
  remover?: boolean
}

export interface Resumo {
  totalVendas: number
  faturamentoTotal: number
  custoProdutos: number
  despesasOperacionais: number
  gastosTotal: number
  lucroLiquido: number
}

export interface EntradaImportacao {
  filamentos: LinhaFilamento[]
  produtos: LinhaProduto[]
  vendas: (LinhaVenda & { status: StatusEntrega })[]
  despesas: LinhaDespesa[]
}

export interface ContagemImportacao {
  criados: number
  ignorados: number
}

export interface ResultadoImportacao {
  filamentos: ContagemImportacao
  produtos: ContagemImportacao
  vendas: ContagemImportacao
  despesas: ContagemImportacao
}

/** Contrato único: a UI não sabe se fala com o Supabase ou com o modo demonstração. */
export interface DataApi {
  listarProdutos(): Promise<Produto[]>
  criarProduto(input: NovoProdutoInput, foto?: Blob | null): Promise<Produto>
  excluirProduto(produto: Produto): Promise<void>
  /** foto = nova imagem; null = remover a foto atual. */
  atualizarFotoProduto(produto: Produto, foto: Blob | null): Promise<Produto>

  listarVendas(): Promise<VendaComProduto[]>
  criarVenda(input: NovaVendaInput): Promise<Venda>
  atualizarStatusVenda(id: string, status: StatusEntrega): Promise<void>
  atualizarPagamento(id: string, pago: boolean): Promise<void>
  excluirVenda(id: string): Promise<void>

  listarDespesas(): Promise<DespesaOperacional[]>
  criarDespesa(input: NovaDespesaInput): Promise<void>
  excluirDespesa(id: string): Promise<void>

  listarFilamentos(): Promise<Filamento[]>
  criarFilamento(input: NovoFilamentoInput): Promise<Filamento>
  excluirFilamento(id: string): Promise<void>

  obterPerfil(): Promise<PerfilEmpresa | null>
  salvarPerfil(input: PerfilInput, logo?: LogoAlteracao): Promise<PerfilEmpresa>

  importar(entrada: EntradaImportacao): Promise<ResultadoImportacao>

  resumo(): Promise<Resumo>
}

/** Operações em lote que a importação precisa (implementadas por cada backend). */
export interface PrimitivasImportacao {
  listarFilamentos(): Promise<Filamento[]>
  listarProdutos(): Promise<Produto[]>
  listarCodigosVenda(): Promise<string[]>
  listarDespesas(): Promise<DespesaOperacional[]>
  inserirFilamentos(rows: NovoFilamentoInput[]): Promise<Filamento[]>
  inserirProdutos(rows: NovoProdutoInput[]): Promise<Produto[]>
  inserirVendas(rows: NovaVendaInput[]): Promise<number>
  inserirDespesas(rows: NovaDespesaInput[]): Promise<number>
}
