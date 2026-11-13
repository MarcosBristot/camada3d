import { Link } from 'react-router-dom'
import { Destaque, Email, LegalLayout, Lista, Secao } from '../../components/legal/LegalLayout'
import { LEGAL } from '../../config/legal'

const S = [
  { id: 'situacao', titulo: 'Situação atual de cobrança' },
  { id: 'arrependimento', titulo: 'Direito de arrependimento' },
  { id: 'cancelamento', titulo: 'Cancelamento a qualquer tempo' },
  { id: 'falhas', titulo: 'Cobranças indevidas e falhas do serviço' },
  { id: 'como', titulo: 'Como pedir' },
  { id: 'prazos', titulo: 'Prazos e forma de devolução' },
  { id: 'dados', titulo: 'O que acontece com seus dados' },
]

export default function Reembolso() {
  const { servico, contato, cobranca } = LEGAL
  const dias = cobranca.diasArrependimento
  return (
    <LegalLayout
      titulo="Cancelamento e Reembolso"
      resumo={`Como cancelar o ${servico} e quando você tem direito a receber dinheiro de volta, conforme o Código de Defesa do Consumidor.`}
      sumario={S}
    >
      <Secao id={S[0].id} n={1} titulo={S[0].titulo}>
        {cobranca.planosPagos ? (
          <p>
            O {servico} tem planos pagos. As regras abaixo valem para todas as contratações feitas pelo site.
          </p>
        ) : (
          <Destaque>
            Hoje não há cobrança: o plano Free é gratuito e o Pro está disponível apenas no período de teste. As regras abaixo passam a valer
            quando as assinaturas abrirem, e nenhuma cobrança será feita sem o seu aceite expresso. O teste grátis nunca vira cobrança
            automática.
          </Destaque>
        )}
      </Secao>

      <Secao id={S[1].id} n={2} titulo={S[1].titulo}>
        <p>
          Como a contratação é feita pela internet, você pode desistir em até <strong>{dias} dias corridos</strong> a partir da contratação ou da
          primeira cobrança, sem precisar justificar (art. 49 do Código de Defesa do Consumidor e Decreto 7.962/2013). Nesse caso devolvemos{' '}
          <strong>100% do valor pago</strong>, inclusive em planos anuais.
        </p>
      </Secao>

      <Secao id={S[2].id} n={3} titulo={S[2].titulo}>
        <Lista
          itens={[
            'Você pode cancelar quando quiser, sem multa e sem fidelidade, pelo painel ou por e-mail.',
            'Planos mensais: o cancelamento interrompe as próximas cobranças, e o acesso continua até o fim do período já pago. Não há reembolso proporcional de mês em curso fora do prazo de arrependimento.',
            'Planos anuais: depois do prazo de arrependimento, você pode cancelar e receber o valor proporcional aos meses inteiros ainda não iniciados.',
            'Se cancelarmos o seu plano sem que você tenha violado os Termos, devolvemos o valor proporcional ao período não utilizado.',
          ]}
        />
      </Secao>

      <Secao id={S[3].id} n={4} titulo={S[3].titulo}>
        <p>
          Cobrança em duplicidade, valor diferente do contratado ou cobrança após o cancelamento será devolvida integralmente. Pelo art. 42 do
          CDC, valores pagos indevidamente são devolvidos em dobro, salvo engano justificável.
        </p>
        <p>
          Se uma indisponibilidade prolongada por falha nossa impedir o uso do serviço, você pode pedir crédito ou reembolso proporcional ao
          período afetado.
        </p>
      </Secao>

      <Secao id={S[4].id} n={5} titulo={S[4].titulo}>
        <p>
          Escreva para <Email endereco={contato.email} assunto="Cancelamento / reembolso" /> com o e-mail da conta e o motivo (opcional).
          Também é possível usar a <Link to="/contato" className="text-brand-300 hover:underline">página de contato</Link>. Confirmamos o
          recebimento em até {contato.prazoRespostaDiasUteis} dias úteis.
        </p>
      </Secao>

      <Secao id={S[5].id} n={6} titulo={S[5].titulo}>
        <Lista
          itens={[
            'O reembolso é feito pelo mesmo meio de pagamento usado na compra, em até 10 dias úteis após a confirmação.',
            'No cartão de crédito, o estorno pode aparecer em até duas faturas, conforme as regras do banco emissor.',
            'No PIX ou boleto, devolvemos para uma conta de mesma titularidade de quem pagou.',
          ]}
        />
      </Secao>

      <Secao id={S[6].id} n={7} titulo={S[6].titulo}>
        <p>
          Cancelar o plano não apaga seus dados automaticamente: você pode exportá-los em <strong>Painel → Conta</strong>. Para apagar tudo,
          use a opção “Excluir conta”, que é definitiva. Veja a <Link to="/privacidade#retencao" className="text-brand-300 hover:underline">Política de Privacidade</Link>.
        </p>
      </Secao>
    </LegalLayout>
  )
}
