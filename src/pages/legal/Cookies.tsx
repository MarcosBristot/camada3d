import { Link } from 'react-router-dom'
import { Destaque, Email, LegalLayout, Secao } from '../../components/legal/LegalLayout'
import { LEGAL, emailPrivacidade } from '../../config/legal'

const S = [
  { id: 'o-que', titulo: 'O que usamos' },
  { id: 'lista', titulo: 'Itens guardados no seu navegador' },
  { id: 'terceiros', titulo: 'Terceiros' },
  { id: 'controle', titulo: 'Como apagar' },
]

const ITENS = [
  { nome: 'sb-…-auth-token', finalidade: 'Mantém você conectado (sessão de login). Sem ele não é possível usar o painel.', tipo: 'Essencial', duracao: 'Até você sair da conta' },
  { nome: 'camada3d-tema', finalidade: 'Lembra as cores da sua empresa e o tema claro/escuro, para a página abrir certa.', tipo: 'Preferência', duracao: 'Até você limpar o navegador' },
  { nome: 'camada3d-calc-prefs', finalidade: 'Lembra o preço do filamento, a potência, a tarifa e a margem usados por último na calculadora.', tipo: 'Preferência', duracao: 'Até você limpar o navegador' },
  { nome: 'camada3d-origem', finalidade: 'Guarda de qual link de divulgação você chegou (ex.: um post), para sabermos quais divulgações funcionam. Não identifica você e não é compartilhado.', tipo: 'Funcional', duracao: '30 dias' },
  { nome: 'camada3d-aviso-armazenamento', finalidade: 'Registra que você já viu o aviso sobre armazenamento local.', tipo: 'Essencial', duracao: 'Até você limpar o navegador' },
  { nome: 'camada3d-demo-v3', finalidade: 'Só no modo demonstração: guarda os dados de exemplo no seu navegador.', tipo: 'Funcional', duracao: 'Até você limpar o navegador' },
]

export default function Cookies() {
  return (
    <LegalLayout
      titulo="Cookies e armazenamento local"
      resumo={`Quais informações o ${LEGAL.servico} guarda no seu navegador e por quê.`}
      sumario={S}
    >
      <Secao id={S[0].id} n={1} titulo={S[0].titulo}>
        <Destaque>
          <strong>Não usamos cookies de publicidade, de rastreamento nem de análise de audiência</strong> (como Google Analytics ou pixels de redes sociais).
        </Destaque>
        <p>
          Usamos apenas o armazenamento local do navegador (<em>localStorage</em>), que funciona como um cookie: guarda pequenas informações
          necessárias para o login e para lembrar suas preferências. Por serem essenciais ao serviço ou simples preferências que você escolhe,
          esses itens não dependem de consentimento. Ainda assim, explicamos cada um abaixo.
        </p>
      </Secao>

      <Secao id={S[1].id} n={2} titulo={S[1].titulo}>
        <div className="overflow-x-auto rounded-2xl ring-1 ring-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Para quê</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ITENS.map((i) => (
                <tr key={i.nome}>
                  <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs">{i.nome}</td>
                  <td className="px-4 py-3 align-top text-zinc-400">{i.finalidade}</td>
                  <td className="px-4 py-3 align-top text-zinc-400">{i.tipo}</td>
                  <td className="px-4 py-3 align-top text-zinc-400">{i.duracao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao id={S[2].id} n={3} titulo={S[2].titulo}>
        <p>
          As fontes e os arquivos do site são servidos pelo nosso próprio domínio, sem carregar nada de redes de anúncios ou de serviços de
          análise. O login e o banco de dados usam a Supabase, conforme a{' '}
          <Link to="/privacidade#compartilhamento" className="text-brand-300 hover:underline">Política de Privacidade</Link>.
        </p>
      </Secao>

      <Secao id={S[3].id} n={4} titulo={S[3].titulo}>
        <p>
          Você pode apagar esses itens nas configurações do navegador (“Limpar dados de navegação” ou “Dados do site”). Ao apagar a sessão você
          será desconectado, e as preferências voltam ao padrão. Seus dados no sistema não são afetados.
        </p>
        <p>
          Dúvidas: <Email endereco={emailPrivacidade()} assunto="Cookies e armazenamento" />.
        </p>
      </Secao>
    </LegalLayout>
  )
}
