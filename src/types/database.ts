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
 *  - `vendas.Insert.custo_total` é opcional: o trigger `vendas_preencher_snapshot` o preenche.
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
      vendas: {
        Row: {
          id: string
          user_id: string
          produto_id: string | null
          produto_nome: string | null
          cliente_nome: string
          data_venda: string
          quantidade: number
          preco_final: number
          custo_total: number
          lucro: number
          status_entrega: StatusEntrega
          observacoes: string | null
          codigo: string | null
          pago: boolean
          forma_pagamento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          produto_id?: string | null
          produto_nome?: string | null
          cliente_nome: string
          data_venda?: string
          quantidade?: number
          preco_final: number
          /** Omitido => banco usa produtos.custo_base * quantidade */
          custo_total?: number | null
          status_entrega?: StatusEntrega
          observacoes?: string | null
          codigo?: string | null
          pago?: boolean
          forma_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          produto_id?: string | null
          produto_nome?: string | null
          cliente_nome?: string
          data_venda?: string
          quantidade?: number
          preco_final?: number
          custo_total?: number
          status_entrega?: StatusEntrega
          observacoes?: string | null
          codigo?: string | null
          pago?: boolean
          forma_pagamento?: string | null
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
        ]
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
export type Venda = Tables<'vendas'>
export type NovaVenda = TablesInsert<'vendas'>
export type DespesaOperacional = Tables<'despesas_operacionais'>
export type ResumoFinanceiro = Views<'resumo_financeiro'>
export type PerfilEmpresa = Tables<'perfil_empresa'>
export type Filamento = Tables<'filamentos'>
export type NovoFilamento = TablesInsert<'filamentos'>

/** Venda com o produto embutido: supabase.from('vendas').select('*, produtos(nome, foto_url)') */
export type VendaComProduto = Venda & {
  produtos: Pick<Produto, 'nome' | 'foto_url'> | null
}
