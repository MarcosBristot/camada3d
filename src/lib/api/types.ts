import type {
  AssinaturaAdmin,
  DespesaOperacional,
  Filamento,
  NovoFilamento,
  NovoProduto,
  PedidoCompleto,
  PerfilEmpresa,
  Produto,
  StatusEntrega,
  TablesInsert,
  TemaPreferido,
} from '../../types/database'
import type { LinhaDespesa, LinhaFilamento, LinhaProduto, LinhaVenda } from '../importacao/planilha'

export type NovoProdutoInput = Omit<NovoProduto, 'id' | 'user_id' | 'foto_url' | 'foto_path' | 'created_at' | 'updated_at'>

export interface NovoItemInput {
  produto_id: string
  quantidade: number
  /** total do item (quantidade x preço unitário) */
  preco_final: number
}

export interface NovoPedidoInput {
  codigo: string
  cliente_nome: string
  cliente_contato?: string | null
  data_pedido: string
  prazo_entrega?: string | null
  status_entrega: StatusEntrega
  pago: boolean
  forma_pagamento?: string | null
  frete: number
  desconto: number
  observacoes?: string | null
  itens: NovoItemInput[]
}

export type PlanoId = 'free' | 'pro'

export interface InfoPlano {
  plano: PlanoId
  /** Pro vindo do teste grátis (e não de pagamento) */
  emTeste: boolean
  testeAte: string | null
  proAte: string | null
  periodo: string | null
  uso: { produtos: number; pedidosMes: number }
}

export type NovaDespesaInput = Required<
  Pick<TablesInsert<'despesas_operacionais'>, 'descricao' | 'categoria' | 'valor' | 'data_despesa'>
>

export type NovoFilamentoInput = Required<Pick<NovoFilamento, 'cor' | 'material' | 'preco_kg'>> & Pick<NovoFilamento, 'marca'>

export interface PerfilInput {
  nome: string
  cor_primaria: string
  cor_secundaria: string
  tema: TemaPreferido
  contato?: string | null
  cidade?: string | null
  rodape_os?: string | null
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

  listarPedidos(): Promise<PedidoCompleto[]>
  obterPedido(id: string): Promise<PedidoCompleto | null>
  /** Cria pedido + itens de uma vez (atômico). Retorna o id. */
  criarPedido(input: NovoPedidoInput): Promise<string>
  atualizarStatusPedido(id: string, status: StatusEntrega): Promise<void>
  atualizarPagamentoPedido(id: string, pago: boolean): Promise<void>
  excluirPedido(id: string): Promise<void>

  listarDespesas(): Promise<DespesaOperacional[]>
  criarDespesa(input: NovaDespesaInput): Promise<void>
  excluirDespesa(id: string): Promise<void>

  listarFilamentos(): Promise<Filamento[]>
  criarFilamento(input: NovoFilamentoInput): Promise<Filamento>
  excluirFilamento(id: string): Promise<void>

  obterPerfil(): Promise<PerfilEmpresa | null>
  salvarPerfil(input: PerfilInput, logo?: LogoAlteracao): Promise<PerfilEmpresa>

  importar(entrada: EntradaImportacao): Promise<ResultadoImportacao>

  /** Apaga fotos/logo do Storage e depois a conta (com todos os dados, em cascata). Irreversível. */
  excluirConta(): Promise<void>

  resumo(): Promise<Resumo>

  obterPlano(): Promise<InfoPlano>
  ehAdmin(): Promise<boolean>
  adminListarAssinaturas(): Promise<AssinaturaAdmin[]>
  /** dias = 0 encerra o Pro agora */
  adminEstenderPro(userId: string, dias: number, periodo?: string | null, nota?: string | null): Promise<string>
}

/** Operações em lote que a importação precisa (implementadas por cada backend). */
export interface PrimitivasImportacao {
  listarFilamentos(): Promise<Filamento[]>
  listarProdutos(): Promise<Produto[]>
  listarCodigosPedido(): Promise<string[]>
  listarDespesas(): Promise<DespesaOperacional[]>
  inserirFilamentos(rows: NovoFilamentoInput[]): Promise<Filamento[]>
  inserirProdutos(rows: NovoProdutoInput[]): Promise<Produto[]>
  inserirPedidos(rows: NovoPedidoInput[]): Promise<number>
  inserirDespesas(rows: NovaDespesaInput[]): Promise<number>
}
