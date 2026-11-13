import type {
  EntradaImportacao,
  NovaDespesaInput,
  NovaVendaInput,
  NovoFilamentoInput,
  NovoProdutoInput,
  PrimitivasImportacao,
  ResultadoImportacao,
} from '../api/types'
import { hojeISO } from '../dates'
import { chave, margemParaPreco } from './planilha'

/**
 * Grava o plano revisado. É idempotente: rodar de novo com a mesma planilha não duplica
 *  - filamentos (mesma cor + material + marca),
 *  - produtos (mesmo nome),
 *  - vendas (mesmo código de pedido),
 *  - despesas (mesma descrição + valor).
 */
export async function executarImportacao(e: EntradaImportacao, p: PrimitivasImportacao): Promise<ResultadoImportacao> {
  // ----- Filamentos -----
  const kF = (cor: string, material: string, marca: string | null | undefined) => `${chave(cor)}|${chave(material)}|${chave(marca ?? '')}`
  const filExistentes = await p.listarFilamentos()
  const vistosF = new Set(filExistentes.map((f) => kF(f.cor, f.material, f.marca)))
  const novosF: NovoFilamentoInput[] = []
  for (const f of e.filamentos) {
    if (f.precoKg === null) continue
    const k = kF(f.cor, f.material, f.marca)
    if (vistosF.has(k)) continue
    vistosF.add(k)
    novosF.push({ cor: f.cor, material: f.material, marca: f.marca, preco_kg: f.precoKg })
  }
  const filCriados = novosF.length ? await p.inserirFilamentos(novosF) : []
  const filamentos = [...filExistentes, ...filCriados]

  /** Filamento da cor com o mesmo preço usado no cálculo (ou o primeiro da cor). */
  const filamentoDe = (cor: string | null, precoKg: number | null) => {
    if (!cor) return undefined
    const daCor = filamentos.filter((f) => chave(f.cor) === chave(cor))
    return daCor.find((f) => precoKg !== null && Math.abs(f.preco_kg - precoKg) < 0.01) ?? daCor[0]
  }

  // ----- Produtos -----
  const prodExistentes = await p.listarProdutos()
  const nomesP = new Set(prodExistentes.map((x) => chave(x.nome)))
  const novosP: NovoProdutoInput[] = []
  for (const x of e.produtos) {
    if (nomesP.has(chave(x.nome))) continue
    nomesP.add(chave(x.nome))
    const fil = filamentoDe(x.cor, x.precoKg)
    const precoKg = x.precoKg ?? fil?.preco_kg ?? 0
    const custo = (x.gramas / 1000) * precoKg
    novosP.push({
      nome: x.nome.trim(),
      categoria: x.categoria,
      cor: x.cor,
      material: x.material,
      peso_gramas: x.gramas,
      preco_kg_material: precoKg,
      filamento_id: fil?.id ?? null,
      preco_venda: x.precoVenda,
      margem_lucro_pct: x.precoVenda !== null ? margemParaPreco(custo, x.precoVenda) : 0,
    })
  }
  const prodCriados = novosP.length ? await p.inserirProdutos(novosP) : []
  const idPorNome = new Map([...prodExistentes, ...prodCriados].map((x) => [chave(x.nome), x.id]))

  // ----- Vendas -----
  const codigos = new Set((await p.listarCodigosVenda()).map((c) => chave(c)))
  const novasV: NovaVendaInput[] = []
  for (const v of e.vendas) {
    if (v.codigo && codigos.has(chave(v.codigo))) continue
    const produtoId = idPorNome.get(chave(v.produto))
    if (!produtoId) continue // produto desmarcado na revisão
    if (v.codigo) codigos.add(chave(v.codigo))
    novasV.push({
      produto_id: produtoId,
      cliente_nome: v.cliente,
      data_venda: v.data,
      quantidade: v.quantidade,
      preco_final: v.total,
      status_entrega: v.status,
      codigo: v.codigo,
      pago: v.pago,
      forma_pagamento: v.formaPagamento,
      observacoes: null,
    })
  }
  const vendasCriadas = novasV.length ? await p.inserirVendas(novasV) : 0

  // ----- Despesas (Marketing) -----
  const kD = (d: string, valor: number) => `${chave(d)}|${valor.toFixed(2)}`
  const despExistentes = new Set((await p.listarDespesas()).map((d) => kD(d.descricao, d.valor)))
  const novasD: NovaDespesaInput[] = e.despesas
    .filter((d) => !despExistentes.has(kD(d.descricao, d.valor)))
    .map((d) => ({ descricao: d.descricao, categoria: 'marketing', valor: d.valor, data_despesa: hojeISO() }))
  const despCriadas = novasD.length ? await p.inserirDespesas(novasD) : 0

  return {
    filamentos: { criados: filCriados.length, ignorados: e.filamentos.length - filCriados.length },
    produtos: { criados: prodCriados.length, ignorados: e.produtos.length - prodCriados.length },
    vendas: { criados: vendasCriadas, ignorados: e.vendas.length - vendasCriadas },
    despesas: { criados: despCriadas, ignorados: e.despesas.length - despCriadas },
  }
}
