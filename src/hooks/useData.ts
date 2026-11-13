import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  api,
  type EntradaImportacao,
  type LogoAlteracao,
  type NovaDespesaInput,
  type NovaVendaInput,
  type NovoFilamentoInput,
  type NovoProdutoInput,
  type PerfilInput,
} from '../lib/api'
import type { Produto, StatusEntrega } from '../types/database'

export const keys = {
  produtos: ['produtos'] as const,
  vendas: ['vendas'] as const,
  despesas: ['despesas'] as const,
  resumo: ['resumo'] as const,
  filamentos: ['filamentos'] as const,
  perfil: ['perfil'] as const,
}

export const useProdutos = () => useQuery({ queryKey: keys.produtos, queryFn: () => api.listarProdutos() })
export const useVendas = () => useQuery({ queryKey: keys.vendas, queryFn: () => api.listarVendas() })
export const useDespesas = () => useQuery({ queryKey: keys.despesas, queryFn: () => api.listarDespesas() })
export const useResumo = () => useQuery({ queryKey: keys.resumo, queryFn: () => api.resumo() })
export const useFilamentos = () => useQuery({ queryKey: keys.filamentos, queryFn: () => api.listarFilamentos() })
export const usePerfil = () => useQuery({ queryKey: keys.perfil, queryFn: () => api.obterPerfil(), staleTime: Infinity })

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

export function useAtualizarFotoProduto() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: ({ produto, foto }: { produto: Produto; foto: Blob | null }) => api.atualizarFotoProduto(produto, foto),
    // a foto também aparece no histórico de vendas e nos pedidos
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

export function useAtualizarPagamento() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: ({ id, pago }: { id: string; pago: boolean }) => api.atualizarPagamento(id, pago),
    onSuccess: () => inv(keys.vendas),
  })
}

export function useCriarFilamento() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (input: NovoFilamentoInput) => api.criarFilamento(input),
    onSuccess: () => inv(keys.filamentos),
  })
}

export function useExcluirFilamento() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (id: string) => api.excluirFilamento(id),
    onSuccess: () => inv(keys.filamentos, keys.produtos),
  })
}

export function useSalvarPerfil() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: ({ input, logo }: { input: PerfilInput; logo?: LogoAlteracao }) => api.salvarPerfil(input, logo),
    onSuccess: () => inv(keys.perfil),
  })
}

export function useImportar() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (entrada: EntradaImportacao) => api.importar(entrada),
    onSuccess: () => inv(keys.filamentos, keys.produtos, keys.vendas, keys.despesas, keys.resumo),
  })
}
