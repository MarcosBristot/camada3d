import type { PedidoCompleto } from '../types/database'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export interface TotaisPedido {
  /** soma dos itens */
  subtotal: number
  /** subtotal - desconto + frete: o que o cliente paga */
  total: number
  /** custo de produção congelado nos itens */
  custo: number
  /** subtotal - desconto - custo (frete é repassado, não é lucro) */
  lucro: number
  /** lucro / (subtotal - desconto) */
  margem: number
  pecas: number
  /** gramas de material somando todas as peças */
  gramas: number
  /** horas de impressão somando todas as peças */
  horas: number
}

export function totaisDoPedido(p: Pick<PedidoCompleto, 'itens' | 'frete' | 'desconto'>): TotaisPedido {
  const subtotal = round2(p.itens.reduce((t, i) => t + i.preco_final, 0))
  const custo = round2(p.itens.reduce((t, i) => t + i.custo_total, 0))
  const receita = round2(subtotal - p.desconto)
  const lucro = round2(receita - custo)
  return {
    subtotal,
    total: round2(receita + p.frete),
    custo,
    lucro,
    margem: receita > 0 ? (lucro / receita) * 100 : 0,
    pecas: p.itens.reduce((t, i) => t + i.quantidade, 0),
    gramas: round2(p.itens.reduce((t, i) => t + (i.produtos?.peso_gramas ?? 0) * i.quantidade, 0)),
    horas: round2(p.itens.reduce((t, i) => t + (i.produtos?.tempo_maquina_horas ?? 0) * i.quantidade, 0)),
  }
}

/** Próximo código no padrão PED-001, PED-002… */
export function proximoCodigo(codigos: string[]) {
  const nums = codigos.map((c) => /^PED-(\d+)$/i.exec(c)?.[1]).filter(Boolean).map(Number)
  const n = (nums.length ? Math.max(...nums) : 0) + 1
  return `PED-${String(n).padStart(3, '0')}`
}

/** "2 x Vaso, 1 x Suporte" (para listas compactas) */
export const resumoItens = (p: Pick<PedidoCompleto, 'itens'>, max = 2) => {
  const partes = p.itens.map((i) => `${i.quantidade}× ${i.produtos?.nome ?? i.produto_nome ?? 'Produto removido'}`)
  return partes.length > max ? `${partes.slice(0, max).join(', ')} +${partes.length - max}` : partes.join(', ')
}

/** Horas decimais em "4h 30min" */
export function formatarHoras(h: number) {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return hh && mm ? `${hh}h ${mm}min` : hh ? `${hh}h` : `${mm}min`
}

/** Erro vindo do limite do plano Free (o banco envia "LIMITE_PLANO: ...") */
export const ehErroDeLimite = (e: unknown) => e instanceof Error && e.name === 'LimitePlano'
