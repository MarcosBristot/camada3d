import type { CategoriaDespesa, StatusEntrega } from '../types/database'

export const STATUS: Record<StatusEntrega, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-amber-400/10 text-amber-300 ring-amber-400/25' },
  em_producao: { label: 'Em produção', cls: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/25' },
  pronto: { label: 'Pronto', cls: 'bg-violet-400/10 text-violet-300 ring-violet-400/25' },
  enviado: { label: 'Enviado', cls: 'bg-sky-400/10 text-sky-300 ring-sky-400/25' },
  entregue: { label: 'Entregue', cls: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25' },
  cancelado: { label: 'Cancelado', cls: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/25' },
}

export const STATUS_ORDEM = Object.keys(STATUS) as StatusEntrega[]

export const CATEGORIAS: Record<CategoriaDespesa, string> = {
  manutencao: 'Manutenção',
  embalagem: 'Embalagem',
  frete: 'Frete',
  marketing: 'Marketing',
  software: 'Software',
  equipamento: 'Equipamento',
  taxas: 'Taxas',
  outros: 'Outros',
}

export const MATERIAIS = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'Resina', 'PLA Silk', 'Fibra de carbono', 'Outro']
