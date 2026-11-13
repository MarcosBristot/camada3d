import { Link } from 'react-router-dom'
import { Destaque, Email, LegalLayout, Lista, Secao } from '../../components/legal/LegalLayout'
import { LEGAL, identificacao, textoForo } from '../../config/legal'
import { PLANOS, formatarPreco } from '../../config/planos'

const S = [
  { id: 'aceite', titulo: 'Aceite' },
  { id: 'servico', titulo: 'O que é o serviço' },
  { id: 'conta', titulo: 'Cadastro e conta' },
  { id: 'uso', titulo: 'Uso permitido e proibido' },
  { id: 'conteudo', titulo: 'Seu conteúdo e seus dados' },
  { id: 'calculos', titulo: 'Cálculos são estimativas' },
  { id: 'planos', titulo: 'Planos, preços e pagamento' },
  { id: 'disponibilidade', titulo: 'Disponibilidade e mudanças no serviço' },
  { id: 'propriedade', titulo: 'Propriedade intelectual' },
  { id: 'responsabilidade', titulo: 'Limitação de responsabilidade' },
  { id: 'encerramento', titulo: 'Suspensão e encerramento' },
  { id: 'alteracoes', titulo: 'Alterações destes termos' },
  { id: 'lei', titulo: 'Lei aplicável e foro' },
  { id: 'contato', titulo: 'Contato' },
]

export default function Termos() {
  const { servico, contato, cobranca } = LEGAL
  return (
    <LegalLayout
      titulo="Termos de Uso"
      resumo={`As regras para usar o ${servico}: o que oferecemos, o que esperamos de você e como resolvemos eventuais problemas.`}
      sumario={S}
    >
      <Secao id={S[0].id} n={1} titulo={S[0].titulo}>
        <p>
          Estes Termos regulam o uso do {servico}, fornecido por <strong>{identificacao()}</strong>. Ao criar uma conta ou usar o serviço, você
          concorda com estes Termos, com a <Link to="/privacidade" className="text-brand-300 hover:underline">Política de Privacidade</Link> e com a{' '}
          <Link to="/reembolso" className="text-brand-300 hover:underline">Política de Cancelamento e Reembolso</Link>. Se não concordar, não use o serviço.
        </p>
        <p>O aceite fica registrado na sua conta, com a data e a versão destes Termos.</p>
      </Secao>

      <Secao id={S[1].id} n={2} titulo={S[1].titulo}>
        <p>
          O {servico} é um software on-line (SaaS) para negócios de impressão 3D e produtos físicos. Com ele você calcula custos e preços,
          cadastra produtos com fotos, registra e acompanha pedidos, controla despesas e vê indicadores financeiros. Também é possível importar
          dados de planilhas.
        </p>
        <p>
          O {servico} é uma ferramenta de gestão. Não vendemos os seus produtos, não intermediamos pagamentos entre você e seus clientes e não
          somos parte das relações que você mantém com eles.
        </p>
      </Secao>

      <Secao id={S[2].id} n={3} titulo={S[2].titulo}>
        <Lista
          itens={[
            'Você precisa ter 18 anos ou mais e capacidade legal para contratar, ou agir em nome de uma empresa com poderes para isso.',
            'Informe um e-mail válido e mantenha seus dados atualizados.',
            'A senha é pessoal. Você responde pelo que for feito na sua conta. Se suspeitar de acesso indevido, troque a senha e nos avise.',
            'Cada conta é de um titular. Não revenda nem compartilhe o acesso com terceiros fora da sua empresa.',
          ]}
        />
      </Secao>

      <Secao id={S[3].id} n={4} titulo={S[3].titulo}>
        <p>Você concorda em não:</p>
        <Lista
          itens={[
            'usar o serviço para atividades ilegais, fraudes ou para vender produtos proibidos ou que violem direitos de terceiros (por exemplo, réplicas que infrinjam marcas ou direitos autorais);',
            'enviar conteúdo ilegal, ofensivo, com vírus ou que viole a privacidade ou a imagem de outras pessoas;',
            'tentar acessar dados de outros usuários, contornar mecanismos de segurança, fazer engenharia reversa ou sobrecarregar o sistema (por exemplo, com robôs ou ataques);',
            'cadastrar dados pessoais sensíveis de terceiros (saúde, religião, biometria etc.) ou documentos como CPF e RG de clientes.',
          ]}
        />
      </Secao>

      <Secao id={S[4].id} n={5} titulo={S[4].titulo}>
        <p>
          Tudo o que você cadastra (produtos, fotos, preços, pedidos, logo, despesas) continua sendo seu. Você nos concede apenas a autorização
          necessária para armazenar, processar e exibir esse conteúdo para você, com o único objetivo de prestar o serviço.
        </p>
        <p>
          Você declara ter o direito de usar as imagens e informações que envia e é o controlador dos dados pessoais dos seus clientes que
          cadastrar, nos termos da LGPD. Detalhes em <Link to="/privacidade#clientes" className="text-brand-300 hover:underline">Dados dos seus clientes</Link>.
        </p>
        <p>
          Você pode exportar todos os seus dados ou excluir sua conta a qualquer momento em <strong>Painel → Conta</strong>. Recomendamos
          exportar seus dados periodicamente para ter uma cópia própria.
        </p>
      </Secao>

      <Secao id={S[5].id} n={6} titulo={S[5].titulo}>
        <Destaque>
          Os custos, preços sugeridos, lucros e indicadores do {servico} são <strong>estimativas</strong> calculadas a partir dos dados que você
          informa (peso, preço do material, tempo de máquina, energia, margem). Eles não consideram impostos, taxas de plataformas, perdas de
          impressão ou outros custos que você não cadastrar. <strong>Não são aconselhamento contábil, fiscal ou jurídico.</strong> Confira os
          números e, para obrigações fiscais, consulte um contador.
        </Destaque>
      </Secao>

      <Secao id={S[6].id} n={7} titulo={S[6].titulo}>
        <p>
          O {servico} tem dois planos: o <strong>Free</strong>, gratuito e sem prazo, com limite de {PLANOS.free.limites.produtos} produtos e{' '}
          {PLANOS.free.limites.pedidosMes} pedidos por mês, e o <strong>Pro</strong>, pago, sem esses limites e com recursos extras (como
          importação de planilhas e ordem de serviço sem o selo do {servico}). Os recursos de cada plano ficam descritos na página de planos.
        </p>
        <p>
          Toda conta nova recebe <strong>{PLANOS.diasTeste} dias de Pro grátis</strong>. Ao fim do teste a conta passa automaticamente para o Free,{' '}
          <strong>sem nenhuma cobrança</strong>. Nenhum dado é apagado por mudança de plano: os limites só valem para novos cadastros.
        </p>
        {cobranca.planosPagos ? (
          <>
            <p>
              Os planos, valores e o que cada um inclui ficam na página de contratação, antes do pagamento. Os pagamentos são processados por{' '}
              {cobranca.processadorPagamento || 'um processador de pagamentos parceiro'}, e não guardamos dados completos de cartão.
            </p>
            <p>
              Valores atuais do Pro: {formatarPreco(PLANOS.pro.precoMensal)} por mês ou {formatarPreco(PLANOS.pro.precoAnual)} por ano. A
              assinatura mensal pelo {cobranca.processadorPagamento || 'processador de pagamentos'} é renovada automaticamente a cada mês até você
              cancelar. O plano anual é pago à vista e não renova sozinho. O Pro é liberado em até 1 dia útil depois da confirmação do pagamento.
            </p>
            <p>
              Se o pagamento não for renovado, a conta volta para o Free no vencimento, sem perda de dados. Reajustes de preço serão avisados com
              pelo menos 30 dias de antecedência e só valem a partir do próximo ciclo.
            </p>
          </>
        ) : (
          <p>
            No momento não há cobrança: as assinaturas do Pro ainda não estão abertas. Quando abrirem, os valores e condições serão
            apresentados antes de qualquer contratação, e nada será cobrado sem o seu aceite expresso.
          </p>
        )}
        <p>
          Cancelamento, direito de arrependimento e reembolso seguem a{' '}
          <Link to="/reembolso" className="text-brand-300 hover:underline">Política de Cancelamento e Reembolso</Link>.
        </p>
      </Secao>

      <Secao id={S[7].id} n={8} titulo={S[7].titulo}>
        <p>
          Trabalhamos para manter o serviço disponível, mas podem ocorrer interrupções por manutenção, atualizações, falhas de fornecedores de
          infraestrutura ou casos fortuitos. Manutenções programadas serão avisadas com antecedência sempre que possível.
        </p>
        <p>
          Podemos melhorar, alterar ou remover funcionalidades. Se uma mudança retirar uma função essencial de um plano pago, você poderá
          cancelar e receber o reembolso proporcional do período não utilizado.
        </p>
      </Secao>

      <Secao id={S[8].id} n={9} titulo={S[8].titulo}>
        <p>
          O software, a marca {servico}, o layout, os textos e o código são protegidos por lei (Leis 9.609/1998 e 9.610/1998) e pertencem a nós ou
          aos nossos licenciadores. Você recebe uma licença pessoal, não exclusiva e intransferível para usar o serviço enquanto sua conta estiver
          ativa. Isso não transfere nenhum direito sobre o software.
        </p>
      </Secao>

      <Secao id={S[9].id} n={10} titulo={S[9].titulo}>
        <p>Dentro do que a lei permite, e sem afastar direitos garantidos pelo Código de Defesa do Consumidor:</p>
        <Lista
          itens={[
            'não respondemos por decisões comerciais, preços praticados ou resultados financeiros tomados com base nas estimativas do sistema;',
            'não respondemos por danos causados por informações incorretas que você cadastrar, por uso indevido da sua senha ou por conteúdo que você enviar;',
            'não respondemos por indisponibilidades causadas por terceiros fora do nosso controle razoável (como falhas de internet, energia ou de grandes provedores de nuvem).',
          ]}
        />
        <p>Responderemos por danos que comprovadamente decorram de falha nossa, na forma da lei.</p>
      </Secao>

      <Secao id={S[10].id} n={11} titulo={S[10].titulo}>
        <p>
          Você pode encerrar sua conta quando quiser, em <strong>Painel → Conta</strong>. A exclusão apaga seus dados de forma definitiva (veja a
          Política de Privacidade).
        </p>
        <p>
          Podemos suspender ou encerrar contas que violem estes Termos ou a lei, ou que coloquem em risco a segurança do serviço ou de outros
          usuários. Salvo em casos graves ou por ordem de autoridade, avisaremos antes e daremos prazo para você exportar seus dados.
        </p>
      </Secao>

      <Secao id={S[11].id} n={12} titulo={S[11].titulo}>
        <p>
          Podemos atualizar estes Termos. Mudanças relevantes serão avisadas por e-mail ou no painel com pelo menos 15 dias de antecedência.
          Continuar usando o serviço depois da vigência significa concordar com a nova versão. Se não concordar, você pode encerrar a conta sem custo.
        </p>
      </Secao>

      <Secao id={S[12].id} n={13} titulo={S[12].titulo}>
        <p>
          Estes Termos seguem as leis brasileiras, em especial o Código Civil, o Código de Defesa do Consumidor (Lei 8.078/1990), o Marco Civil da
          Internet (Lei 12.965/2014) e a LGPD (Lei 13.709/2018).
        </p>
        <p>
          Se você for consumidor, poderá propor ações no foro do seu domicílio. Nos demais casos, fica eleito o foro{' '}
          <strong>{textoForo()}</strong>. Antes de ir à Justiça, procure nosso atendimento: a maioria das questões se resolve rapidamente. Você também
          pode usar a plataforma pública <a href="https://www.consumidor.gov.br" target="_blank" rel="noopener noreferrer" className="text-brand-300 hover:underline">consumidor.gov.br</a>.
        </p>
      </Secao>

      <Secao id={S[13].id} n={14} titulo={S[13].titulo}>
        <p>
          Dúvidas sobre estes Termos: <Email endereco={contato.email} assunto="Termos de Uso" /> ou pela{' '}
          <Link to="/contato" className="text-brand-300 hover:underline">página de contato</Link>.
        </p>
      </Secao>
    </LegalLayout>
  )
}
