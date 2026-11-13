const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export const formatBRL = (value: number) => brl.format(Number.isFinite(value) ? value : 0)
export const formatNumber = (value: number) => num.format(Number.isFinite(value) ? value : 0)
