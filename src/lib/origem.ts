/**
 * Origem do cadastro (de qual anúncio/post a pessoa veio), sem ferramentas de terceiros.
 *
 * Links de divulgação levam um parâmetro, ex.:
 *   https://farmops3d.vercel.app/?origem=reels-calculadora
 *   (também aceita utm_source / utm_campaign / utm_content)
 * Sem parâmetro, usa o site de onde a pessoa veio (ex.: instagram.com).
 *
 * Fica só no navegador (localStorage, 30 dias) e é gravado no cadastro como "origem".
 * Documentado na Política de Cookies.
 */
const CHAVE = 'camada3d-origem'
const VALIDADE_MS = 30 * 86400000

const limpar = (v: string) => v.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 60)

export function capturarOrigem() {
  try {
    const url = new URL(window.location.href)
    const p = url.searchParams
    const partes = [p.get('origem'), p.get('utm_source'), p.get('utm_campaign'), p.get('utm_content')].filter(Boolean) as string[]

    let origem: string | null = partes.length ? partes.map(limpar).join('/') : null
    if (!origem && document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\.|^l\.|^m\.|^lm\./, '')
      if (host && host !== window.location.hostname) origem = `ref:${limpar(host)}`
    }
    if (origem) localStorage.setItem(CHAVE, JSON.stringify({ origem, em: Date.now() }))

    // tira os parâmetros do endereço (link limpo para compartilhar)
    if (partes.length) {
      ;['origem', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].forEach((k) => p.delete(k))
      history.replaceState(null, '', url.pathname + (p.toString() ? `?${p}` : '') + url.hash)
    }
  } catch {
    /* sem origem, sem problema */
  }
}

export function lerOrigem(): string | null {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as { origem: string; em: number } | null
    if (!salvo || Date.now() - salvo.em > VALIDADE_MS) return null
    return salvo.origem
  } catch {
    return null
  }
}
