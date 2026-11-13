import { Link } from 'react-router-dom'
import { LEGAL, identificacao } from '../../config/legal'
import { Logo } from '../ui/Logo'

const links = [
  { to: '/termos', label: 'Termos de Uso' },
  { to: '/privacidade', label: 'Privacidade' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/reembolso', label: 'Cancelamento e reembolso' },
  { to: '/contato', label: 'Contato' },
]

/**
 * Rodapé com identificação do fornecedor e links legais
 * (Decreto 7.962/2013: nome, CNPJ/CPF, endereço e contato visíveis).
 */
export function RodapeLegal() {
  return (
    <footer className="border-t border-white/5 py-10 print:hidden">
      <div className="mx-auto max-w-6xl space-y-6 px-6 text-sm text-zinc-500">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="space-y-2">
            <Logo />
            <p className="max-w-sm">Precificação, vendas e finanças para negócios de impressão 3D.</p>
          </div>
          <nav aria-label="Informações legais" className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-zinc-200">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col justify-between gap-2 border-t border-white/5 pt-6 text-xs md:flex-row">
          <p>
            {identificacao()}
            {LEGAL.responsavel.endereco && ` · ${LEGAL.responsavel.endereco}`} · {LEGAL.contato.email}
          </p>
          <p>
            © {new Date().getFullYear()} {LEGAL.servico}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
