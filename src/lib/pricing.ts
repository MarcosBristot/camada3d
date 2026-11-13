/**
 * Regras de precificação — espelham EXATAMENTE as colunas geradas
 * da tabela `produtos` (supabase/migrations/20261113000000_schema_inicial.sql).
 * Se alterar uma fórmula aqui, altere também no SQL.
 */
export interface PricingInput {
  /** Peso da peça em gramas (inclua suportes/purga) */
  pesoGramas: number
  /** Preço do material em R$ por kg */
  precoKgMaterial: number
  /** Tempo de impressão em horas */
  tempoMaquinaHoras: number
  /** Potência média da impressora em watts */
  potenciaWatts: number
  /** Tarifa de energia em R$ por kWh */
  tarifaKwh: number
  /** Custos extras por peça: pintura, embalagem, insumos (R$) */
  custoAdicional?: number
  /** Margem de lucro aplicada sobre o custo (%) — 100 = preço é o dobro do custo */
  margemLucroPct: number
}

export interface PricingResult {
  custoMaterial: number
  custoEnergia: number
  custoBase: number
  precoSugerido: number
  lucroEstimado: number
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const safe = (n: number | undefined) => (Number.isFinite(n) && (n as number) > 0 ? (n as number) : 0)

export function calcularPreco(input: PricingInput): PricingResult {
  const material = (safe(input.pesoGramas) / 1000) * safe(input.precoKgMaterial)
  const energia = (safe(input.potenciaWatts) / 1000) * safe(input.tempoMaquinaHoras) * safe(input.tarifaKwh)
  const base = material + energia + safe(input.custoAdicional)
  const preco = base * (1 + safe(input.margemLucroPct) / 100)

  const custoBase = round2(base)
  const precoSugerido = round2(preco)

  return {
    custoMaterial: round2(material),
    custoEnergia: round2(energia),
    custoBase,
    precoSugerido,
    lucroEstimado: round2(precoSugerido - custoBase),
  }
}
