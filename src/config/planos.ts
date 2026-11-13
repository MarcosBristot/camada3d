/**
 * Planos e preços do farmOps 3D.
 * Os LIMITES do Free também estão no banco (supabase/migrations/20261114000000_pedidos_itens_planos.sql,
 * função verificar_limite_plano). Se mudar aqui, mude lá também.
 */
export const PLANOS = {
  free: {
    nome: 'Free',
    limites: { produtos: 15, pedidosMes: 20 },
    recursos: [
      'Calculadora de precificação completa',
      'Até 15 produtos no catálogo',
      'Até 20 pedidos por mês',
      'Ordem de serviço em PDF (com selo farmOps 3D)',
      'Visão geral financeira e despesas',
      'Tema com as cores da sua logo',
    ],
  },
  pro: {
    nome: 'Pro',
    precoMensal: 19.9,
    precoAnual: 199,
    recursos: [
      'Produtos e pedidos ilimitados',
      'Importação da sua planilha (Excel)',
      'Ordem de serviço sem selo, com sua marca',
      'Pedidos com vários itens, frete e desconto',
      'Exportação completa dos dados',
      'Suporte por e-mail com prioridade',
    ],
  },
  /** Dias de Pro para todo cadastro novo (o banco aplica no cadastro). */
  diasTeste: 14,
}

/**
 * Como o cliente paga (cobrança manual no início).
 * - linkMensal / linkAnual: links de pagamento/assinatura do Mercado Pago (deixe '' até criar).
 * - chavePix: chave Pix para pagamento anual à vista (deixe '' para ocultar).
 * Depois do pagamento, o cliente envia o comprovante e o admin ativa o Pro em /dashboard/admin.
 */
export const COBRANCA = {
  linkMensal: '',
  linkAnual: '',
  chavePix: '',
}

export const formatarPreco = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
