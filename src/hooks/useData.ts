import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type NovaDespesaInput, type NovaVendaInput, type NovoProdutoInput } from '../lib/api'
import type { Produto, StatusEntrega } from '../types/database'

export const keys = {
  produtos: ['produtos'] as const,
  vendas: ['vendas'] as const,
  despesas: ['despesas'] as const,
  resumo: ['resumo'] as const,
}

export const useProdutos = () => useQuery({ queryKey: keys.produtos, queryFn: () => api.listarProdutos() })
export const useVendas = () => useQuery({ queryKey: keys.vendas, queryFn: () => api.listarVendas() })
export const useDespesas = () => useQuery({ queryKey: keys.despesas, queryFn: () => api.listarDespesas() })
export const useResumo = () => useQuery({ queryKey: keys.resumo, queryFn: () => api.resumo() })

function useInvalidar() {
  const qc = useQueryClient()
  return (...ks: (readonly string[])[]) => Promise.all(ks.map((queryKey) => qc.invalidateQueries({ queryKey })))
}

export function useCriarProduto() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: ({ input, foto }: { input: NovoProdutoInput; foto?: Blob | null }) => api.criarProduto(input, foto),
    onSuccess: () => inv(keys.produtos),
  })
}

export function useExcluirProduto() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (p: Produto) => api.excluirProduto(p),
    onSuccess: () => inv(keys.produtos, keys.vendas),
  })
}

export function useCriarVenda() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (input: NovaVendaInput) => api.criarVenda(input),
    onSuccess: () => inv(keys.vendas, keys.resumo),
  })
}

export function useAtualizarStatus() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusEntrega }) => api.atualizarStatusVenda(id, status),
    onSuccess: () => inv(keys.vendas, keys.resumo),
  })
}

export function useExcluirVenda() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (id: string) => api.excluirVenda(id),
    onSuccess: () => inv(keys.vendas, keys.resumo),
  })
}

export function useCriarDespesa() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (input: NovaDespesaInput) => api.criarDespesa(input),
    onSuccess: () => inv(keys.despesas, keys.resumo),
  })
}

export function useExcluirDespesa() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (id: string) => api.excluirDespesa(id),
    onSuccess: () => inv(keys.despesas, keys.resumo),
  })
}
