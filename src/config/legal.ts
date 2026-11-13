/**
 * DADOS LEGAIS DO SERVIÇO — preencha antes do deploy.
 *
 * Tudo o que aparece nos Termos, na Política de Privacidade, na Política de Reembolso,
 * no Contato e no rodapé vem daqui. Campos com "[PREENCHER" são pendências:
 *   npm run check:legal   → lista o que falta (e falha se houver pendência)
 *
 * Não é aconselhamento jurídico: peça para um advogado revisar os textos antes de lançar.
 */

export const LEGAL = {
  /** Nome comercial do serviço (como aparece para o usuário). */
  servico: 'farmOps 3D',

  /**
   * Quem opera o serviço e responde por ele (controlador dos dados das contas).
   * Hoje: pessoa física, sem publicar CPF/endereço (lançamento gratuito).
   * Ao abrir um MEI/empresa: tipo 'PJ', razão social, CNPJ e endereço comercial.
   */
  responsavel: {
    tipo: 'PF' as 'PJ' | 'PF',
    nome: 'Marcos Bristot',
    /** CNPJ (PJ) ou CPF (PF). Opcional para PF: deixe '' para não publicar. */
    documento: '',
    /** Endereço completo. Opcional para PF: deixe '' para não publicar. */
    endereco: '',
  },

  contato: {
    email: 'farmops3d@gmail.com',
    /** WhatsApp opcional (só números com DDI e DDD, ex.: 5551999999999). Deixe '' para ocultar. */
    whatsapp: '',
    horario: 'segunda a sexta, das 9h às 18h (horário de Brasília), exceto feriados',
    /** Prazo de primeira resposta no suporte. */
    prazoRespostaDiasUteis: 3,
  },

  /** Encarregado pelo tratamento de dados pessoais (LGPD, art. 41). Pode ser você mesmo. */
  encarregado: {
    nome: 'Marcos Bristot',
    /** '' = usa o mesmo e-mail de contato */
    email: '',
  },

  /**
   * Comarca para conflitos com usuários que NÃO são consumidores (o consumidor sempre pode usar o próprio domicílio).
   * '' = "domicílio do responsável pelo serviço".
   */
  foro: '',

  /** Cobrança: enquanto for gratuito, a política de reembolso informa isso. */
  cobranca: {
    planosPagos: false,
    /** Empresa que processa pagamentos (quando houver), ex.: 'Stripe' ou 'Mercado Pago'. */
    processadorPagamento: 'Mercado Pago',
    /** Direito de arrependimento: 7 dias corridos (CDC, art. 49). Não reduza. */
    diasArrependimento: 7,
  },

  /** Empresas que processam dados em nome do serviço (operadores/suboperadores). */
  fornecedores: [
    {
      nome: 'Supabase Inc.',
      funcao: 'Banco de dados, autenticação (login e e-mails de acesso) e armazenamento de imagens',
      local: 'Estados Unidos (região us-east-2)',
      politica: 'https://supabase.com/privacy',
    },
    {
      nome: 'Vercel Inc.',
      funcao: 'Hospedagem e entrega das páginas do site (registra IP e dados técnicos de acesso)',
      local: 'Estados Unidos (rede global de servidores)',
      politica: 'https://vercel.com/legal/privacy-policy',
    },
    {
      nome: 'Google LLC (Gmail)',
      funcao: 'Envio dos e-mails de confirmação de cadastro e de redefinição de senha',
      local: 'Estados Unidos',
      politica: 'https://policies.google.com/privacy',
    },
  ],

  /** Prazos de guarda (em meses) */
  retencao: {
    /** Registros de acesso à aplicação: mínimo legal de 6 meses (Marco Civil, art. 15). */
    logsAcessoMeses: 6,
    /** Cópias de segurança do provedor do banco são sobrescritas neste prazo (confira no seu plano Supabase). */
    backupsDias: 7,
  },

  /** Versão dos documentos. Mude a data e a versão sempre que alterar o conteúdo dos textos. */
  versao: '1.3',
  vigenciaDesde: '2026-11-13',
}

export type ConfigLegal = typeof LEGAL

/** Lista os campos ainda com "[PREENCHER". */
export function pendenciasLegais(cfg: unknown = LEGAL, caminho = ''): string[] {
  if (typeof cfg === 'string') return cfg.includes('[PREENCHER') ? [`${caminho}: ${cfg}`] : []
  if (Array.isArray(cfg)) return cfg.flatMap((v, i) => pendenciasLegais(v, `${caminho}[${i}]`))
  if (cfg && typeof cfg === 'object') {
    return Object.entries(cfg).flatMap(([k, v]) => pendenciasLegais(v, caminho ? `${caminho}.${k}` : k))
  }
  return []
}

export const dataVigencia = () => {
  const [y, m, d] = LEGAL.vigenciaDesde.split('-')
  return `${d}/${m}/${y}`
}

export const identificacao = () => {
  const { tipo, nome, documento } = LEGAL.responsavel
  if (tipo === 'PJ') return `${nome} — CNPJ ${documento}`
  return documento ? `${nome} (pessoa física) — CPF ${documento}` : `${nome} (pessoa física)`
}

/** E-mail do encarregado (cai no de contato se não houver um próprio). */
export const emailPrivacidade = () => LEGAL.encarregado.email || LEGAL.contato.email

/** Texto do foro para não consumidores. */
export const textoForo = () => (LEGAL.foro ? `da comarca de ${LEGAL.foro}` : 'do domicílio do responsável pelo serviço')
