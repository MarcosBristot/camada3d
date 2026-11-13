/**
 * Tipagens do banco no formato do `supabase gen types typescript`.
 * Escritas à mão a partir de supabase/migrations/20261113000000_schema_inicial.sql.
 * Para regenerar a partir do banco:
 *   npx supabase gen types typescript --project-id SEU_ID > src/types/database.ts
 *
 * Colunas geradas pelo banco (custos, preço sugerido, lucro) aparecem só em `Row`.
 *
 * Conferido contra `supabase gen types` do banco local. Diferenças intencionais:
 *  - colunas geradas são `number` (o gerador diz `number | null`, mas nunca são nulas aqui);
 *  - `pedido_itens.Insert.custo_total` é opcional: o trigger de snapshot o preenche.
 * Se regenerar com o CLI, reaplique esses dois ajustes.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type StatusEntrega = 'pendente' | 'em_producao' | 'pronto' | 'enviado' | 'entregue' | 'cancelado'

export type CategoriaDespesa =
  | 'manutencao'
  | 'embalagem'
  | 'frete'
  | 'marketing'
  | 'software'
  | 'equipamento'
  | 'taxas'
  | 'outros'

export type TemaPreferido = 'claro' | 'escuro' | 'sistema'

export type Database = {
  public: {
    Tables: {
      produtos: {
        Row: {
          id: string
          user_id: string
          nome: string
          descricao: string | null
          material: string
          foto_url: string | null
          foto_path: string | null
          peso_gramas: number
          preco_kg_material: number
          tempo_maquina_horas: number
          potencia_watts: number
          tarifa_kwh: number
          custo_adicional: number
          margem_lucro_pct: number
          custo_material: number
          custo_energia: number
          custo_base: number
          preco_sugerido: number
          ativo: boolean
          categoria: string | null
          cor: string | null
          preco_venda: number | null
          filamento_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          nome: string
          descricao?: string | null
          material?: string
          foto_url?: string | null
          foto_path?: string | null
          peso_gramas?: number
          preco_kg_material?: number
          tempo_maquina_horas?: number
          potencia_watts?: number
          tarifa_kwh?: number
          custo_adicional?: number
          margem_lucro_pct?: number
          ativo?: boolean
          categoria?: string | null
          cor?: string | null
          preco_venda?: number | null
          filamento_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          descricao?: string | null
          material?: string
          foto_url?: string | null
          foto_path?: string | null
          peso_gramas?: number
          preco_kg_material?: number
          tempo_maquina_horas?: number
          potencia_watts?: number
          tarifa_kwh?: number
          custo_adicional?: number
          margem_lucro_pct?: number
          ativo?: boolean
          categoria?: string | null
          cor?: string | null
          preco_venda?: number | null
          filamento_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'produtos_filamento_id_fkey'
            columns: ['filamento_id']
            isOneToOne: false
            referencedRelation: 'filamentos'
            referencedColumns: ['id']
          },
        ]
      }
      pedidos: {
        Row: {
          id: string
          user_id: string
          codigo: string
          cliente_nome: string
          cliente_contato: string | null
          data_pedido: string
          prazo_entrega: string | null
          status_entrega: StatusEntrega
          pago: boolean
          forma_pagamento: string | null
          frete: number
          desconto: number
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          codigo: string
          cliente_nome: string
          cliente_contato?: string | null
          data_pedido?: string
          prazo_entrega?: string | null
          status_entrega?: StatusEntrega
          pago?: boolean
          forma_pagamento?: string | null
          frete?: number
          desconto?: number
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          codigo?: string
          cliente_nome?: string
          cliente_contato?: string | null
          data_pedido?: string
          prazo_entrega?: string | null
          status_entrega?: StatusEntrega
          pago?: boolean
          forma_pagamento?: string | null
          frete?: number
          desconto?: number
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pedido_itens: {
        Row: {
          id: string
          user_id: string
          pedido_id: string
          produto_id: string | null
          produto_nome: string | null
          quantidade: number
          /** total do item (quantidade x preço unitário) */
          preco_final: number
          custo_total: number
          lucro: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          pedido_id: string
          produto_id?: string | null
          produto_nome?: string | null
          quantidade?: number
          preco_final: number
          /** Omitido => banco usa produtos.custo_base * quantidade */
          custo_total?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pedido_id?: string
          produto_id?: string | null
          produto_nome?: string | null
          quantidade?: number
          preco_final?: number
          custo_total?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vendas_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'produtos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pedido_itens_pedido_id_fkey'
            columns: ['pedido_id']
            isOneToOne: false
            referencedRelation: 'pedidos'
            referencedColumns: ['id']
          },
        ]
      }
      assinaturas: {
        Row: {
          user_id: string
          teste_ate: string | null
          pro_ate: string | null
          periodo: 'mensal' | 'anual' | 'cortesia' | null
          observacao: string | null
          created_at: string
          updated_at: string
        }
        Insert: { user_id: string; teste_ate?: string | null; pro_ate?: string | null; periodo?: 'mensal' | 'anual' | 'cortesia' | null; observacao?: string | null }
        Update: { teste_ate?: string | null; pro_ate?: string | null; periodo?: 'mensal' | 'anual' | 'cortesia' | null; observacao?: string | null }
        Relationships: []
      }
      perfil_empresa: {
        Row: {
          user_id: string
          nome: string
          logo_url: string | null
          logo_path: string | null
          cor_primaria: string
          cor_secundaria: string
          tema: TemaPreferido
          contato: string | null
          cidade: string | null
          rodape_os: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string
          nome: string
          logo_url?: string | null
          logo_path?: string | null
          cor_primaria?: string
          cor_secundaria?: string
          tema?: TemaPreferido
          contato?: string | null
          cidade?: string | null
          rodape_os?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          nome?: string
          logo_url?: string | null
          logo_path?: string | null
          cor_primaria?: string
          cor_secundaria?: string
          tema?: TemaPreferido
          contato?: string | null
          cidade?: string | null
          rodape_os?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      filamentos: {
        Row: {
          id: string
          user_id: string
          cor: string
          material: string
          marca: string | null
          preco_kg: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          cor: string
          material?: string
          marca?: string | null
          preco_kg: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cor?: string
          material?: string
          marca?: string | null
          preco_kg?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      despesas_operacionais: {
        Row: {
          id: string
          user_id: string
          descricao: string
          categoria: CategoriaDespesa
          valor: number
          data_despesa: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          descricao: string
          categoria?: CategoriaDespesa
          valor: number
          data_despesa?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          descricao?: string
          categoria?: CategoriaDespesa
          valor?: number
          data_despesa?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      resumo_financeiro: {
        Row: {
          user_id: string | null
          total_vendas: number | null
          faturamento_total: number | null
          custo_produtos: number | null
          despesas_operacionais: number | null
          gastos_total: number | null
          lucro_liquido: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      excluir_minha_conta: { Args: Record<PropertyKey, never>; Returns: undefined }
      criar_pedido: { Args: { pedido: Json; itens: Json }; Returns: string }
      plano_efetivo: { Args: { uid?: string }; Returns: string }
      eh_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      admin_listar_assinaturas: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          empresa: string | null
          origem: string | null
          criado_em: string
          ultimo_acesso: string | null
          plano: string
          teste_ate: string | null
          pro_ate: string | null
          periodo: string | null
          observacao: string | null
          produtos: number
          pedidos_mes: number
        }[]
      }
      admin_estender_pro: { Args: { alvo: string; dias: number; novo_periodo?: string; nota?: string }; Returns: string }
    }
    Enums: {
      status_entrega: StatusEntrega
      categoria_despesa: CategoriaDespesa
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
export type Views<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row']

// Atalhos de domínio
export type Produto = Tables<'produtos'>
export type NovoProduto = TablesInsert<'produtos'>
export type Pedido = Tables<'pedidos'>
export type PedidoItem = Tables<'pedido_itens'>
export type Assinatura = Tables<'assinaturas'>
export type AssinaturaAdmin = Database['public']['Functions']['admin_listar_assinaturas']['Returns'][number]
export type DespesaOperacional = Tables<'despesas_operacionais'>
export type ResumoFinanceiro = Views<'resumo_financeiro'>
export type PerfilEmpresa = Tables<'perfil_empresa'>
export type Filamento = Tables<'filamentos'>
export type NovoFilamento = TablesInsert<'filamentos'>

/** Item com dados do produto (para a ordem de serviço e as listas) */
export type ItemComProduto = PedidoItem & {
  produtos: Pick<Produto, 'nome' | 'foto_url' | 'material' | 'cor' | 'peso_gramas' | 'tempo_maquina_horas' | 'categoria'> | null
}

/** Pedido com todos os itens: supabase.from('pedidos').select('*, itens:pedido_itens(*, produtos(...))') */
export type PedidoCompleto = Pedido & { itens: ItemComProduto[] }
