import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Download, FileText, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Page, PageHeader } from '../../components/dashboard/bits'
import { Modal } from '../../components/ui/Modal'
import { mensagemErro, useToast } from '../../components/ui/Toast'
import { Button, inputCls } from '../../components/ui/form'
import { LEGAL } from '../../config/legal'
import { useAuth } from '../../contexts/AuthContext'
import { TEMA_CACHE, TEMA_PADRAO, useTema } from '../../contexts/ThemeContext'
import { api } from '../../lib/api'

const CONFIRMACAO = 'EXCLUIR'

const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

/** Monta um JSON com tudo o que o usuário tem no sistema (portabilidade, LGPD art. 18, V). */
async function montarExportacao(conta: ReturnType<typeof useAuth>['user']) {
  const [perfil, filamentos, produtos, vendas, despesas] = await Promise.all([
    api.obterPerfil(),
    api.listarFilamentos(),
    api.listarProdutos(),
    api.listarVendas(),
    api.listarDespesas(),
  ])
  return {
    servico: LEGAL.servico,
    exportado_em: new Date().toISOString(),
    formato: 'JSON — cada lista contém os registros como estão no banco de dados',
    conta: conta && {
      id: conta.id,
      email: conta.email,
      criada_em: conta.criadoEm,
      termos_versao_aceita: conta.termosVersao,
      termos_aceitos_em: conta.termosAceitosEm,
    },
    perfil_empresa: perfil,
    filamentos,
    produtos,
    pedidos: vendas.map(({ produtos: _rel, ...v }) => v),
    despesas_operacionais: despesas,
  }
}

export default function Conta() {
  const { user, demo, sair } = useAuth()
  const notificar = useToast()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { definirTema } = useTema()
  const [exportando, setExportando] = useState(false)
  const [modal, setModal] = useState(false)
  const [texto, setTexto] = useState('')
  const [excluindo, setExcluindo] = useState(false)

  const exportar = async () => {
    setExportando(true)
    try {
      const dados = await montarExportacao(user)
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${LEGAL.servico.toLowerCase().replace(/[^a-z0-9]+/g, '')}-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      notificar('sucesso', 'Arquivo com seus dados baixado.')
    } catch (err) {
      notificar('erro', mensagemErro(err))
    } finally {
      setExportando(false)
    }
  }

  const excluir = async () => {
    if (texto.trim().toUpperCase() !== CONFIRMACAO) return
    setExcluindo(true)
    try {
      await api.excluirConta()
      definirTema(TEMA_PADRAO)
      localStorage.removeItem(TEMA_CACHE)
      localStorage.removeItem('camada3d-calc-prefs')
      qc.clear()
      await sair().catch(() => undefined)
      notificar('sucesso', demo ? 'Dados de demonstração apagados.' : 'Sua conta e todos os seus dados foram excluídos.')
      navigate('/', { replace: true })
      if (demo) window.location.reload()
    } catch (err) {
      notificar('erro', mensagemErro(err))
      setExcluindo(false)
    }
  }

  const termosDesatualizados = !demo && user?.termosVersao && user.termosVersao !== LEGAL.versao

  return (
    <Page>
      <PageHeader title="Conta e privacidade" description="Seus dados, seus documentos e seus direitos (LGPD)." />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <UserRound size={18} className="text-brand-400" /> Sua conta
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">E-mail</dt>
              <dd className="truncate text-right font-medium">{demo ? 'Modo demonstração' : user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Conta criada em</dt>
              <dd className="text-right">{dataHora(user?.criadoEm ?? null)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Termos aceitos</dt>
              <dd className="text-right">
                {user?.termosVersao ? `versão ${user.termosVersao} em ${dataHora(user.termosAceitosEm)}` : '—'}
              </dd>
            </div>
          </dl>
          {termosDesatualizados && (
            <p className="mt-4 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-400/20">
              Os documentos foram atualizados para a versão {LEGAL.versao}. Leia as mudanças nos links ao lado.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <FileText size={18} className="text-brand-400" /> Documentos
          </h2>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['/termos', 'Termos de Uso'],
              ['/privacidade', 'Política de Privacidade'],
              ['/cookies', 'Cookies e armazenamento'],
              ['/reembolso', 'Cancelamento e Reembolso'],
              ['/contato', 'Contato e encarregado (DPO)'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} target="_blank" className="block rounded-xl px-3 py-2 text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-zinc-50">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ShieldCheck size={18} className="text-brand-400" /> Seus dados
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Baixe uma cópia completa do que está no sistema (perfil, filamentos, produtos, pedidos e despesas) em formato JSON, que pode ser
            aberto em qualquer editor ou importado em outra ferramenta. As fotos ficam como links.
          </p>
          <Button variant="secondary" onClick={exportar} loading={exportando} className="mt-4">
            <Download size={16} /> Baixar meus dados
          </Button>
        </Card>

        <Card className="border-red-400/20 p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-red-300">
            <AlertTriangle size={18} /> Excluir conta
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Apaga definitivamente sua conta, todos os produtos, fotos, pedidos, despesas, filamentos e o perfil da empresa. Não é possível
            desfazer. Cópias de segurança do provedor são sobrescritas em até {LEGAL.retencao.backupsDias} dias. Registros de acesso são mantidos
            pelo prazo legal de {LEGAL.retencao.logsAcessoMeses} meses (Marco Civil da Internet).
          </p>
          <Button variant="danger" onClick={() => { setTexto(''); setModal(true) }} className="mt-4">
            <Trash2 size={16} /> Excluir minha conta
          </Button>
        </Card>
      </div>

      <Modal open={modal} onClose={() => !excluindo && setModal(false)} title="Excluir conta definitivamente?" description="Esta ação não pode ser desfeita.">
        <div className="space-y-4 text-sm">
          <p className="text-zinc-300">
            Tudo será apagado: produtos, fotos, pedidos, despesas, filamentos, logo e perfil. Se quiser guardar uma cópia,{' '}
            <button onClick={exportar} className="font-medium text-brand-300 hover:underline">baixe seus dados</button> antes.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-zinc-400">
              Digite <strong className="font-mono text-zinc-100">{CONFIRMACAO}</strong> para confirmar
            </span>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" className={`${inputCls} font-mono`} aria-label="Confirmação de exclusão" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModal(false)} disabled={excluindo}>Cancelar</Button>
            <Button variant="danger" onClick={excluir} loading={excluindo} disabled={texto.trim().toUpperCase() !== CONFIRMACAO}>
              <Trash2 size={16} /> Excluir tudo
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  )
}
