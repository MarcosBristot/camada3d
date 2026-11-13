import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Eye, EyeOff, Loader2, MessageCircle, PenLine, Printer } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import { usePedido, usePerfil, usePlano } from '../../hooks/useData'
import { formatarData } from '../../lib/dates'
import { formatBRL } from '../../lib/format'
import { STATUS } from '../../lib/labels'
import { formatarHoras, totaisDoPedido } from '../../lib/pedidos'
import type { PedidoCompleto, PerfilEmpresa } from '../../types/database'

/*
 * A "folha" usa cores fixas (hex) de propósito: a OS sai sempre como papel branco,
 * independente do tema claro/escuro do painel.
 */

const g = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} g`

function textoResumo(p: PedidoCompleto, perfil: PerfilEmpresa | null | undefined, comValores: boolean) {
  const t = totaisDoPedido(p)
  const linhas = [
    `*Ordem de serviço ${p.codigo}*${perfil?.nome ? ` — ${perfil.nome}` : ''}`,
    `Cliente: ${p.cliente_nome}`,
    `Pedido em ${formatarData(p.data_pedido)}${p.prazo_entrega ? ` · entrega até ${formatarData(p.prazo_entrega)}` : ''}`,
    '',
    ...p.itens.map(
      (i) =>
        `• ${i.quantidade}× ${i.produtos?.nome ?? i.produto_nome ?? 'Produto'}${
          i.produtos ? ` (${[i.produtos.material, i.produtos.cor].filter(Boolean).join(' · ')})` : ''
        }${comValores ? ` — ${formatBRL(i.preco_final)}` : ''}`,
    ),
  ]
  if (comValores) {
    linhas.push('')
    if (p.desconto > 0) linhas.push(`Desconto: -${formatBRL(p.desconto)}`)
    if (p.frete > 0) linhas.push(`Frete: ${formatBRL(p.frete)}`)
    linhas.push(`*Total: ${formatBRL(t.total)}*${p.pago ? ' (pago)' : ''}`)
  }
  if (p.observacoes) linhas.push('', `Obs.: ${p.observacoes}`)
  return linhas.join('\n')
}

export default function OrdemServico() {
  const { id } = useParams()
  const { data: pedido, isLoading } = usePedido(id)
  const { data: perfil } = usePerfil()
  const { data: plano } = usePlano()
  const notificar = useToast()
  const [comValores, setComValores] = useState(true)
  const [assinaturas, setAssinaturas] = useState(true)

  // Nome sugerido do PDF ao "Salvar como PDF"
  useEffect(() => {
    if (!pedido) return
    const anterior = document.title
    document.title = `OS ${pedido.codigo} - ${pedido.cliente_nome}`
    return () => {
      document.title = anterior
    }
  }, [pedido])

  const t = useMemo(() => (pedido ? totaisDoPedido(pedido) : null), [pedido])

  // Material total agrupado por material + cor (para separar filamento antes de imprimir)
  const materiais = useMemo(() => {
    const m = new Map<string, number>()
    pedido?.itens.forEach((i) => {
      if (!i.produtos?.peso_gramas) return
      const k = [i.produtos.material, i.produtos.cor].filter(Boolean).join(' · ') || 'Material'
      m.set(k, (m.get(k) ?? 0) + i.produtos.peso_gramas * i.quantidade)
    })
    return [...m.entries()]
  }, [pedido])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        <Loader2 className="animate-spin" />
      </div>
    )
  }
  if (!pedido || !t) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-zinc-400">
        <p>Pedido não encontrado.</p>
        <Link to="/dashboard/pedidos" className="text-brand-300 hover:underline">Voltar para pedidos</Link>
      </div>
    )
  }

  const free = plano?.plano === 'free'
  const whats = (pedido.cliente_contato ?? '').replace(/\D/g, '')
  const linkWhats = whats.length >= 10 ? `https://wa.me/${whats.length <= 11 ? '55' + whats : whats}?text=${encodeURIComponent(textoResumo(pedido, perfil, comValores))}` : null

  const copiar = async () => {
    await navigator.clipboard.writeText(textoResumo(pedido, perfil, comValores))
    notificar('sucesso', 'Resumo copiado. Cole no WhatsApp, Instagram ou e-mail.')
  }

  const status = STATUS[pedido.status_entrega]

  return (
    <div className="min-h-screen bg-zinc-950 pb-16 print:bg-[#fff] print:pb-0">
      {/* Barra de ações (não sai na impressão) */}
      <div className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/85 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-2 px-4 py-3">
          <Link to="/dashboard/pedidos" className="mr-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100">
            <ArrowLeft size={16} /> Pedidos
          </Link>
          <button onClick={() => setComValores((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-zinc-300 ring-1 ring-white/10 hover:bg-white/5">
            {comValores ? <Eye size={15} /> : <EyeOff size={15} />} {comValores ? 'Com valores' : 'Via de produção'}
          </button>
          <button onClick={() => setAssinaturas((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-zinc-300 ring-1 ring-white/10 hover:bg-white/5">
            <PenLine size={15} /> {assinaturas ? 'Com assinaturas' : 'Sem assinaturas'}
          </button>
          <button onClick={copiar} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-zinc-300 ring-1 ring-white/10 hover:bg-white/5">
            <Copy size={15} /> Copiar resumo
          </button>
          {linkWhats && (
            <a href={linkWhats} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-400/10">
              <MessageCircle size={15} /> WhatsApp
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-400 px-4 py-2 text-sm font-semibold text-brand-fg"
          >
            <Printer size={15} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Folha A4 */}
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="os-folha mx-auto mt-6 w-full max-w-[210mm] bg-[#fff] px-[12mm] py-[12mm] text-[13px] leading-snug text-[#18181b] shadow-2xl print:mt-0 print:max-w-none print:px-0 print:py-0 print:shadow-none"
      >
        {/* Cabeçalho */}
        <header className="flex items-start justify-between gap-6 border-b-2 border-[#18181b] pb-4">
          <div className="flex min-w-0 items-center gap-3">
            {perfil?.logo_url ? (
              <img src={perfil.logo_url} alt="" className="h-14 w-14 rounded-lg bg-[#18181b] object-contain p-1" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#18181b] text-lg font-bold text-[#fff]">
                {(perfil?.nome ?? 'OS').slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{perfil?.nome ?? 'Minha empresa'}</p>
              {perfil?.contato && <p className="text-[12px] text-[#52525b]">{perfil.contato}</p>}
              {perfil?.cidade && <p className="text-[12px] text-[#52525b]">{perfil.cidade}</p>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#71717a]">Ordem de serviço</p>
            <p className="font-mono text-2xl font-bold">{pedido.codigo}</p>
            <p className="mt-1 inline-block rounded-full border border-[#d4d4d8] px-2 py-0.5 text-[11px] font-medium">{status.label}</p>
          </div>
        </header>

        {/* Cliente e datas */}
        <section className="mt-4 grid grid-cols-3 gap-4 text-[12px]">
          <div>
            <p className="font-semibold uppercase tracking-wider text-[#71717a]">Cliente</p>
            <p className="mt-1 text-[14px] font-semibold">{pedido.cliente_nome}</p>
            {pedido.cliente_contato && <p className="text-[#52525b]">{pedido.cliente_contato}</p>}
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider text-[#71717a]">Datas</p>
            <p className="mt-1">Pedido: <strong>{formatarData(pedido.data_pedido)}</strong></p>
            <p>Entrega: <strong>{pedido.prazo_entrega ? formatarData(pedido.prazo_entrega) : 'a combinar'}</strong></p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wider text-[#71717a]">Pagamento</p>
            <p className="mt-1">{pedido.forma_pagamento ?? '—'}</p>
            <p className={`font-semibold ${pedido.pago ? 'text-[#047857]' : 'text-[#b91c1c]'}`}>{pedido.pago ? 'Pago' : 'A receber'}</p>
          </div>
        </section>

        {/* Itens */}
        <table className="mt-5 w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-y border-[#d4d4d8] bg-[#f4f4f5] text-[10px] uppercase tracking-wider text-[#52525b]">
              <th className="py-2 pl-2 font-semibold">Produto</th>
              <th className="py-2 font-semibold">Especificações</th>
              <th className="py-2 text-center font-semibold">Qtd</th>
              {comValores && <th className="py-2 text-right font-semibold">Unit.</th>}
              {comValores && <th className="py-2 pr-2 text-right font-semibold">Total</th>}
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map((i) => {
              const prod = i.produtos
              const nome = prod?.nome ?? i.produto_nome ?? 'Produto removido'
              return (
                <tr key={i.id} className="break-inside-avoid border-b border-[#e4e4e7] align-top">
                  <td className="py-2 pl-2">
                    <div className="flex items-center gap-2">
                      {prod?.foto_url ? (
                        <img src={prod.foto_url} alt="" className="h-11 w-11 shrink-0 rounded object-cover" />
                      ) : (
                        <span className="h-11 w-11 shrink-0 rounded bg-[#f4f4f5]" />
                      )}
                      <div>
                        <p className="font-semibold">{nome}</p>
                        {prod?.categoria && <p className="text-[11px] text-[#71717a]">{prod.categoria}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-[11px] text-[#3f3f46]">
                    {prod ? (
                      <>
                        <p>{[prod.material, prod.cor].filter(Boolean).join(' · ')}</p>
                        <p>
                          {prod.peso_gramas > 0 && `${g(prod.peso_gramas)}/peça`}
                          {prod.tempo_maquina_horas > 0 && ` · ${formatarHoras(prod.tempo_maquina_horas)}/peça`}
                        </p>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 text-center text-[14px] font-bold">{i.quantidade}</td>
                  {comValores && <td className="py-2 text-right">{formatBRL(i.preco_final / i.quantidade)}</td>}
                  {comValores && <td className="py-2 pr-2 text-right font-semibold">{formatBRL(i.preco_final)}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Produção + totais */}
        <section className="mt-4 grid grid-cols-2 gap-6 text-[12px]">
          <div className="rounded-lg border border-[#e4e4e7] p-3">
            <p className="font-semibold uppercase tracking-wider text-[#71717a]">Produção</p>
            <p className="mt-1">{t.pecas} peça(s) no total</p>
            {materiais.map(([mat, gramas]) => (
              <p key={mat}>
                {mat}: <strong>{g(gramas)}</strong>
              </p>
            ))}
            {t.horas > 0 && <p>Tempo de máquina estimado: <strong>{formatarHoras(t.horas)}</strong></p>}
          </div>
          {comValores && (
            <div className="space-y-1 self-start">
              <p className="flex justify-between"><span>Subtotal</span><span>{formatBRL(t.subtotal)}</span></p>
              {pedido.desconto > 0 && <p className="flex justify-between"><span>Desconto</span><span>- {formatBRL(pedido.desconto)}</span></p>}
              {pedido.frete > 0 && <p className="flex justify-between"><span>Frete</span><span>{formatBRL(pedido.frete)}</span></p>}
              <p className="flex justify-between border-t-2 border-[#18181b] pt-1 text-[16px] font-bold"><span>Total</span><span>{formatBRL(t.total)}</span></p>
            </div>
          )}
        </section>

        {pedido.observacoes && (
          <section className="mt-4 break-inside-avoid rounded-lg bg-[#f4f4f5] p-3 text-[12px]">
            <p className="font-semibold uppercase tracking-wider text-[#71717a]">Observações</p>
            <p className="mt-1 whitespace-pre-line">{pedido.observacoes}</p>
          </section>
        )}

        {perfil?.rodape_os && <p className="mt-4 whitespace-pre-line text-[11px] text-[#52525b]">{perfil.rodape_os}</p>}

        {assinaturas && (
          <section className="mt-10 grid grid-cols-2 gap-10 text-center text-[11px] text-[#52525b] break-inside-avoid">
            <div className="border-t border-[#71717a] pt-1">{perfil?.nome ?? 'Responsável'}</div>
            <div className="border-t border-[#71717a] pt-1">{pedido.cliente_nome}</div>
          </section>
        )}

        <footer className="mt-8 flex justify-between text-[10px] text-[#a1a1aa]">
          <span>Emitida em {new Date().toLocaleDateString('pt-BR')}</span>
          {free && <span>Gerado com farmOps 3D · farmops3d.vercel.app</span>}
        </footer>
      </motion.article>

      {free && (
        <p className="mx-auto mt-4 max-w-[210mm] px-4 text-center text-xs text-zinc-500 print:hidden">
          No plano Free a OS leva o selo “Gerado com farmOps 3D”. <Link to="/dashboard/plano" className="text-brand-300 hover:underline">Assine o Pro</Link> para tirar.
        </p>
      )}
    </div>
  )
}
