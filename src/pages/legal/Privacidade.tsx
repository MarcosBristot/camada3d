import { Link } from 'react-router-dom'
import { Destaque, Email, LegalLayout, Lista, Secao } from '../../components/legal/LegalLayout'
import { LEGAL, emailPrivacidade, identificacao } from '../../config/legal'

const S = [
  { id: 'quem-somos', titulo: 'Quem somos' },
  { id: 'papeis', titulo: 'Nosso papel sobre cada dado' },
  { id: 'dados', titulo: 'Quais dados tratamos' },
  { id: 'finalidades', titulo: 'Para que usamos e com qual base legal' },
  { id: 'compartilhamento', titulo: 'Com quem compartilhamos' },
  { id: 'internacional', titulo: 'Transferência internacional' },
  { id: 'retencao', titulo: 'Por quanto tempo guardamos' },
  { id: 'seguranca', titulo: 'Como protegemos os dados' },
  { id: 'direitos', titulo: 'Seus direitos' },
  { id: 'clientes', titulo: 'Dados dos seus clientes' },
  { id: 'menores', titulo: 'Crianças e adolescentes' },
  { id: 'incidentes', titulo: 'Incidentes de segurança' },
  { id: 'alteracoes', titulo: 'Alterações desta política' },
  { id: 'encarregado', titulo: 'Encarregado e contato' },
]

export default function Privacidade() {
  const { servico, responsavel, encarregado, retencao } = LEGAL
  return (
    <LegalLayout
      titulo="Política de Privacidade"
      resumo={`Como o ${servico} coleta, usa, guarda e protege dados pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).`}
      sumario={S}
    >
      <Destaque>
        <strong>Resumo:</strong> usamos seus dados só para fazer o sistema funcionar e para manter sua conta segura. Não vendemos dados,
        não exibimos anúncios e não usamos cookies de rastreamento. Você pode baixar ou apagar seus dados a qualquer momento em{' '}
        <strong>Painel → Conta</strong>.
      </Destaque>

      <div className="mt-8">
        <Secao id={S[0].id} n={1} titulo={S[0].titulo}>
          <p>
            O {servico} é um sistema on-line de precificação, controle de pedidos e finanças para negócios de impressão 3D, operado por{' '}
            <strong>{identificacao()}</strong>{responsavel.endereco && <>, com endereço em {responsavel.endereco}</>} (“nós”).
          </p>
          <p>
            Esta política vale para o site, o painel e qualquer comunicação relacionada ao serviço. Ao criar uma conta você declara ter lido
            este documento e os <Link to="/termos" className="text-brand-300 hover:underline">Termos de Uso</Link>.
          </p>
        </Secao>

        <Secao id={S[1].id} n={2} titulo={S[1].titulo}>
          <p>A LGPD define papéis diferentes para quem decide sobre os dados e para quem apenas os processa. No {servico}:</p>
          <Lista
            itens={[
              <>
                <strong>Somos controladores</strong> dos dados da sua conta (e-mail, senha, perfil da empresa) e dos dados técnicos de uso e
                segurança. Nós decidimos como esses dados são tratados.
              </>,
              <>
                <strong>Somos operadores</strong> dos dados que você cadastra sobre terceiros, como nomes de clientes nos pedidos. Quem decide
                por que e como esses dados são usados é você (o usuário), que é o controlador deles. Nós apenas os armazenamos e processamos
                para prestar o serviço, seguindo suas instruções.
              </>,
            ]}
          />
        </Secao>

        <Secao id={S[2].id} n={3} titulo={S[2].titulo}>
          <p>Tratamos apenas o necessário para o funcionamento do sistema:</p>
          <Lista
            itens={[
              <><strong>Cadastro:</strong> e-mail e senha. A senha é guardada com hash irreversível e nunca é visível para nós.</>,
              <><strong>Perfil da empresa:</strong> nome da empresa, logo, cores e preferência de tema.</>,
              <><strong>Dados de operação que você cadastra:</strong> produtos, fotos de produtos, filamentos, preços, pedidos (incluindo nome e contato do cliente, datas, itens, valores, frete, desconto, forma e status de pagamento e observações) e despesas.</>,
              <><strong>Plano e assinatura:</strong> plano atual, datas do teste e do Pro, período contratado e anotações de pagamento (por exemplo, a data em que um Pix foi recebido). Comprovantes enviados por e-mail ficam na nossa caixa de e-mail.</>,
              <><strong>Arquivos que você importa:</strong> planilhas são lidas no seu próprio navegador. Só o que você confirmar na revisão é gravado; o arquivo em si não é enviado nem guardado.</>,
              <><strong>Dados técnicos e de segurança:</strong> endereço IP, data e hora de acesso, eventos de login e informações básicas do navegador, registrados pelos nossos provedores de infraestrutura.</>,
              <><strong>Armazenamento local:</strong> sessão de login e preferências no seu navegador, detalhados na <Link to="/cookies" className="text-brand-300 hover:underline">Política de Cookies</Link>.</>,
              <><strong>Mensagens de suporte:</strong> o conteúdo e o e-mail de quem nos escreve.</>,
            ]}
          />
          <p>
            Não coletamos dados pessoais sensíveis (art. 5º, II, da LGPD), não pedimos documentos e não usamos ferramentas de publicidade ou
            de análise de comportamento. Pedimos que você também não cadastre dados sensíveis de clientes no campo de observações.
          </p>
        </Secao>

        <Secao id={S[3].id} n={4} titulo={S[3].titulo}>
          <div className="overflow-x-auto rounded-2xl ring-1 ring-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Finalidade</th>
                  <th className="px-4 py-3 font-medium">Base legal (LGPD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Criar e manter sua conta, autenticar o acesso e prestar as funções do sistema (cálculos, pedidos, relatórios, fotos)', 'Execução de contrato — art. 7º, V'],
                  ['Enviar e-mails essenciais: confirmação de cadastro, redefinição de senha e avisos sobre mudanças importantes', 'Execução de contrato — art. 7º, V'],
                  [`Guardar registros de acesso à aplicação por ${retencao.logsAcessoMeses} meses`, 'Obrigação legal — art. 7º, II (Marco Civil da Internet, art. 15)'],
                  ['Prevenir fraudes, abusos e acessos indevidos e manter a segurança do serviço', 'Legítimo interesse — art. 7º, IX'],
                  ['Responder solicitações de suporte e de titulares', 'Execução de contrato e obrigação legal — art. 7º, V e II'],
                  ['Defender nossos direitos em processos', 'Exercício regular de direitos — art. 7º, VI'],
                ].map(([f, b]) => (
                  <tr key={f}>
                    <td className="px-4 py-3 align-top">{f}</td>
                    <td className="px-4 py-3 align-top text-zinc-400">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Para ativar assinaturas e dar suporte, o responsável pelo serviço consegue ver, de cada conta, o e-mail, o nome da empresa, as datas
            de cadastro e último acesso, o plano e a <strong>quantidade</strong> de produtos e pedidos. Ele não usa essa visão para ler o conteúdo
            dos seus pedidos ou dos seus clientes.
          </p>
          <p>Não usamos seus dados para decisões automatizadas que afetem seus interesses, nem para criar perfis de marketing.</p>
        </Secao>

        <Secao id={S[4].id} n={5} titulo={S[4].titulo}>
          <p>
            <strong>Não vendemos nem alugamos dados pessoais.</strong> Compartilhamos dados apenas com empresas que nos ajudam a operar o serviço,
            sob contrato e só para essa finalidade:
          </p>
          <div className="overflow-x-auto rounded-2xl ring-1 ring-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Fornecedor</th>
                  <th className="px-4 py-3 font-medium">Para quê</th>
                  <th className="px-4 py-3 font-medium">Onde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {LEGAL.fornecedores.map((f) => (
                  <tr key={f.nome}>
                    <td className="px-4 py-3 align-top">
                      {f.politica.startsWith('http') ? (
                        <a href={f.politica} target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:underline">{f.nome}</a>
                      ) : (
                        f.nome
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-400">{f.funcao}</td>
                    <td className="px-4 py-3 align-top text-zinc-400">{f.local}</td>
                  </tr>
                ))}
                {LEGAL.cobranca.planosPagos && LEGAL.cobranca.processadorPagamento && (
                  <tr>
                    <td className="px-4 py-3 align-top">{LEGAL.cobranca.processadorPagamento}</td>
                    <td className="px-4 py-3 align-top text-zinc-400">Processamento de pagamentos. Não recebemos nem guardamos dados completos de cartão.</td>
                    <td className="px-4 py-3 align-top text-zinc-400">Conforme a política do processador</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p>
            Também podemos fornecer dados a autoridades públicas quando houver ordem judicial ou obrigação legal, sempre no limite do que for exigido.
          </p>
        </Secao>

        <Secao id={S[5].id} n={6} titulo={S[5].titulo}>
          <p>
            Alguns fornecedores armazenam dados fora do Brasil (veja a tabela acima). Essas transferências ocorrem conforme o art. 33 da LGPD,
            com base em cláusulas contratuais de proteção de dados oferecidas por esses fornecedores e em garantias equivalentes às exigidas pela
            lei brasileira, e são necessárias para executar o contrato com você.
          </p>
        </Secao>

        <Secao id={S[6].id} n={7} titulo={S[6].titulo}>
          <Lista
            itens={[
              <><strong>Dados da conta e dados cadastrados:</strong> enquanto a conta existir. Ao excluir a conta, apagamos tudo imediatamente da base principal.</>,
              <><strong>Cópias de segurança:</strong> são sobrescritas automaticamente em até {retencao.backupsDias} dias após a exclusão.</>,
              <><strong>Registros de acesso:</strong> {retencao.logsAcessoMeses} meses, como exige o Marco Civil da Internet, ou mais se houver requisição de autoridade.</>,
              <><strong>Mensagens de suporte:</strong> pelo tempo necessário para resolver a solicitação e por até 5 anos para defesa em eventuais processos (prazo do Código de Defesa do Consumidor).</>,
            ]}
          />
        </Secao>

        <Secao id={S[7].id} n={8} titulo={S[7].titulo}>
          <Lista
            itens={[
              'Conexão criptografada (HTTPS/TLS) em todo o tráfego.',
              'Isolamento por conta no banco de dados (Row Level Security): cada usuário só acessa os próprios registros, regra aplicada pelo próprio banco.',
              'Senhas armazenadas com hash forte, nunca em texto puro.',
              'Fotos guardadas em pastas separadas por usuário, com permissão de escrita só para o dono.',
              'Acesso administrativo restrito e com autenticação.',
            ]}
          />
          <p>
            Nenhum sistema é 100% invulnerável. Proteja sua senha, não a compartilhe e saia da conta em computadores de uso compartilhado.
          </p>
        </Secao>

        <Secao id={S[8].id} n={9} titulo={S[8].titulo}>
          <p>Pelo art. 18 da LGPD você pode, a qualquer momento e sem custo:</p>
          <Lista
            itens={[
              'confirmar se tratamos seus dados e acessá-los;',
              'corrigir dados incompletos, inexatos ou desatualizados;',
              'pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;',
              'receber seus dados em formato estruturado (portabilidade);',
              'pedir a eliminação dos dados tratados com seu consentimento;',
              'saber com quem compartilhamos seus dados;',
              'ser informado sobre a possibilidade de não consentir e suas consequências, e revogar consentimentos;',
              'opor-se a tratamentos baseados em legítimo interesse, quando houver irregularidade;',
              'peticionar à Autoridade Nacional de Proteção de Dados (ANPD).',
            ]}
          />
          <Destaque>
            <strong>Pelo próprio sistema:</strong> em <strong>Painel → Conta</strong> você baixa todos os seus dados (arquivo JSON) e pode excluir
            a conta definitivamente. <strong>Por e-mail:</strong> escreva para <Email endereco={emailPrivacidade()} assunto="Direitos do titular — LGPD" />.
            Respondemos em até 15 dias (art. 19, II, da LGPD). Podemos pedir uma confirmação de identidade para proteger você.
          </Destaque>
        </Secao>

        <Secao id={S[9].id} n={10} titulo={S[9].titulo}>
          <p>
            Se você cadastra dados de clientes (como nomes nos pedidos), é você quem responde por ter uma base legal para isso. Em geral, a execução
            do contrato de venda com o seu cliente é base suficiente (art. 7º, V). Recomendamos cadastrar apenas o necessário, como nome ou
            apelido, e não incluir CPF, endereço ou dados sensíveis nas observações.
          </p>
          <p>
            Se um cliente seu nos procurar para exercer direitos, encaminharemos o pedido a você e daremos o apoio necessário, como operadores,
            para que você responda (art. 39 da LGPD).
          </p>
        </Secao>

        <Secao id={S[10].id} n={11} titulo={S[10].titulo}>
          <p>
            O {servico} é destinado a maiores de 18 anos e a empresas. Não coletamos, de propósito, dados de crianças e adolescentes. Se você
            souber de uma conta criada por menor de idade, avise-nos para que possamos removê-la.
          </p>
        </Secao>

        <Secao id={S[11].id} n={12} titulo={S[11].titulo}>
          <p>
            Se ocorrer um incidente de segurança que possa trazer risco ou dano relevante aos titulares, comunicaremos os afetados e a ANPD em
            prazo razoável, conforme o art. 48 da LGPD e a regulamentação da ANPD. A comunicação dirá o que aconteceu, quais dados foram
            envolvidos e as medidas adotadas.
          </p>
        </Secao>

        <Secao id={S[12].id} n={13} titulo={S[12].titulo}>
          <p>
            Podemos atualizar esta política para refletir mudanças no serviço ou na lei. A data de vigência e a versão ficam no topo da página.
            Mudanças relevantes serão avisadas por e-mail ou no painel com antecedência mínima de 15 dias, antes de entrarem em vigor.
          </p>
        </Secao>

        <Secao id={S[13].id} n={14} titulo={S[13].titulo}>
          <p>
            Encarregado pelo tratamento de dados pessoais (art. 41 da LGPD): <strong>{encarregado.nome}</strong> —{' '}
            <Email endereco={emailPrivacidade()} assunto="Privacidade — LGPD" />.
          </p>
          <p>
            Outras dúvidas: <Link to="/contato" className="text-brand-300 hover:underline">página de contato</Link>. Se você entender que
            sua solicitação não foi atendida, também pode procurar a Autoridade Nacional de Proteção de Dados em{' '}
            <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:underline">gov.br/anpd</a>.
          </p>
        </Secao>
      </div>
    </LegalLayout>
  )
}
