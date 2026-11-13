import { useEffect } from 'react'
import { useToast } from './Toast'

const MENSAGENS: Record<string, string> = {
  otp_expired: 'Este link expirou ou já foi usado. Se você estava confirmando o cadastro, tente entrar: o e-mail pode já estar confirmado. Senão, peça um novo link.',
  access_denied: 'Não foi possível validar o link. Peça um novo e use o mais recente.',
}

/**
 * Quando um link de e-mail (confirmação/redefinição) falha, o Supabase volta para o site com
 * "#error=...&error_code=...". Mostra uma mensagem clara e limpa o endereço.
 */
export function AvisoErroLink() {
  const notificar = useToast()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash.includes('error')) return
    const p = new URLSearchParams(hash)
    const codigo = p.get('error_code') ?? p.get('error') ?? ''
    notificar('erro', MENSAGENS[codigo] ?? p.get('error_description')?.replace(/\+/g, ' ') ?? 'O link não funcionou. Peça um novo.')
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [notificar])

  return null
}
