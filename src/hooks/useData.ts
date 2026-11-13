import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  api,
  type EntradaImportacao,
  type LogoAlteracao,
  type NovaDespesaInput,
  type NovoPedidoInput,
  type NovoFilamentoInput,
  type NovoProdutoInput,
  type PerfilInput,
} from '../lib/api'
import type { Produto, StatusEntrega } from '../types/database'

export const keys = {
  produtos: ['produtos'] as const,
  pedidos: ['pedidos'] as const,
  plano: ['plano'] as const,
  despesas: ['despesas'] as const,
  resumo: ['resumo'] as const,
  filamentos: ['filamentos'] as const,
  perfil: ['perfil'] as const,
}

export const useProdutos = () => useQuery({ queryKey: keys.produtos, queryFn: () => api.listarProdutos() })
export const usePedidos = () => useQuery({ queryKey: keys.pedidos, queryFn: () => api.listarPedidos() })
export const usePedido = (id: string | undefined) =>
  useQuery({ queryKey: [...keys.pedidos, id], queryFn: () => api.obterPedido(id!), enabled: !!id })
export const usePlano = () => useQuery({ queryKey: keys.plano, queryFn: () => api.obterPlano(), staleTime: 60_000 })
export const useEhAdmin = () => useQuery({ queryKey: ['admin'], queryFn: () => api.ehAdmin(), staleTime: Infinity })
export const useAssinaturasAdmin = (ativo: boolean) =>
  useQuery({ queryKey: ['admin', 'assinaturas'], queryFn: () => api.adminListarAssinaturas(), enabled: ativo })
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
    onSuccess: () => inv(keys.produtos, keys.plano),
  })
}

export function useExcluirProduto() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (p: Produto) => api.excluirProduto(p),
    onSuccess: () => inv(keys.produtos, keys.pedidos),
  })
}

export function useAtualizarFotoProduto() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: ({ produto, foto }: { produto: Produto; foto: Blob | null }) => api.atualizarFotoProduto(produto, foto),
    // a foto também aparece no histórico de vendas e nos pedidos
    onSuccess: () => inv(keys.produtos, keys.pedidos),
  })
}

export function useCriarPedido() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (input: NovoPedidoInput) => api.criarPedido(input),
    onSuccess: () => inv(keys.pedidos, keys.resumo, keys.plano),
  })
}

export function useAtualizarStatus() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusEntrega }) => api.atualizarStatusPedido(id, status),
    onSuccess: () => inv(keys.pedidos, keys.resumo),
  })
}

export function useExcluirPedido() {
  const inv = useInvalidar()
  return useMutation({
    mutationFn: (id: string) => api.excluirPedido(id),
    onSuccess: () => inv(keys.pedidos, keys.resumo),
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
    mutationFn: ({ id, pago }: { id: string; pago: boolean }) => api.atualizarPagamentoPedido(id, pago),
    onSuccess: () => inv(keys.pedidos),
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
    onSuccess: () => inv(keys.filamentos, keys.produtos, keys.pedidos, keys.despesas, keys.resumo, keys.plano),
  })
}

export function useAdminEstenderPro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, dias, periodo, nota }: { userId: string; dias: number; periodo?: string | null; nota?: string | null }) =>
      api.adminEstenderPro(userId, dias, periodo, nota),
    // atualiza a lista e o plano (caso o admin tenha mudado a própria conta)
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['admin', 'assinaturas'] }), qc.invalidateQueries({ queryKey: keys.plano })]),
  })
}
