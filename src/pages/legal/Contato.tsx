import { motion } from 'framer-motion'
import { Building2, Clock, LifeBuoy, Mail, MessageCircle, ReceiptText, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Email, LegalLayout } from '../../components/legal/LegalLayout'
import { LEGAL, emailPrivacidade, identificacao } from '../../config/legal'

function Canal({ icon, titulo, children, i }: { icon: ReactNode; titulo: string; children: ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * i } }}
      className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/20">{icon}</span>
      <h2 className="mt-4 font-display text-lg font-semibold">{titulo}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-zinc-400">{children}</div>
    </motion.div>
  )
}

export default function Contato() {
  const { contato, encarregado, responsavel } = LEGAL
  const whats = contato.whatsapp.replace(/\D/g, '')

  return (
    <LegalLayout titulo="Contato" resumo="Fale com a gente para tirar dúvidas, pedir ajuda, cancelar ou exercer seus direitos sobre dados pessoais.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Canal i={0} icon={<LifeBuoy size={20} />} titulo="Suporte e dúvidas">
          <p>Problemas de acesso, dúvidas de uso, sugestões.</p>
          <p><Email endereco={contato.email} assunto="Suporte" /></p>
          {whats && (
            <p>
              <a href={`https://wa.me/${whats}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-300 hover:underline">
                <MessageCircle size={14} /> WhatsApp
              </a>
            </p>
          )}
        </Canal>

        <Canal i={1} icon={<ShieldCheck size={20} />} titulo="Privacidade e dados pessoais">
          <p>Acesso, correção, portabilidade ou exclusão de dados (LGPD, art. 18).</p>
          <p>Encarregado: <strong className="text-zinc-200">{encarregado.nome}</strong></p>
          <p><Email endereco={emailPrivacidade()} assunto="Direitos do titular — LGPD" /></p>
          <p className="text-xs">Resposta em até 15 dias. Com a conta ativa, você mesmo exporta ou exclui seus dados em Painel → Conta.</p>
        </Canal>

        <Canal i={2} icon={<ReceiptText size={20} />} titulo="Cancelamento e reembolso">
          <p>
            Pedidos de cancelamento, arrependimento ou cobrança indevida. Regras na{' '}
            <Link to="/reembolso" className="text-brand-300 hover:underline">política de reembolso</Link>.
          </p>
          <p><Email endereco={contato.email} assunto="Cancelamento / reembolso" /></p>
        </Canal>

        <Canal i={3} icon={<Clock size={20} />} titulo="Atendimento">
          <p>Horário: {contato.horario}.</p>
          <p>Primeira resposta em até {contato.prazoRespostaDiasUteis} dias úteis.</p>
        </Canal>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.25 } }}
        className="mt-6 flex gap-4 rounded-3xl border border-white/10 p-6 text-sm text-zinc-400"
      >
        <Building2 size={20} className="mt-0.5 shrink-0 text-brand-300" />
        <div className="space-y-1">
          <p className="font-medium text-zinc-200">Responsável pelo serviço</p>
          <p>{identificacao()}</p>
          {responsavel.endereco && <p>{responsavel.endereco}</p>}
          <p className="flex items-center gap-1.5"><Mail size={13} /> <Email endereco={contato.email} /></p>
        </div>
      </motion.div>

      <p className="mt-6 text-xs text-zinc-500">
        Se não conseguir resolver conosco, você também pode registrar sua reclamação em{' '}
        <a href="https://www.consumidor.gov.br" target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:underline">consumidor.gov.br</a>{' '}
        ou, sobre dados pessoais, na <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:underline">ANPD</a>.
      </p>
    </LegalLayout>
  )
}
