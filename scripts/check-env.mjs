// Garante que o build de produção aponta para o Supabase (sem isso o app cairia no modo demonstração).
// Lê as variáveis do ambiente (Vercel) ou, localmente, do arquivo .env.
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const env = { ...process.env }
const arquivo = fileURLToPath(new URL('../.env', import.meta.url))
if (existsSync(arquivo)) {
  for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && env[m[1]] === undefined) env[m[1]] = m[2]
  }
}

const erros = []
const url = env.VITE_SUPABASE_URL ?? ''
const chave = env.VITE_SUPABASE_ANON_KEY ?? ''
if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) erros.push('VITE_SUPABASE_URL ausente ou inválida (esperado https://<id>.supabase.co).')
if (chave.length < 30) erros.push('VITE_SUPABASE_ANON_KEY ausente.')
if (/service_role/.test(Buffer.from(chave.split('.')[1] ?? '', 'base64').toString())) {
  erros.push('VITE_SUPABASE_ANON_KEY é a chave service_role! Use a chave "anon"/"publishable". A service_role NUNCA pode ir para o site.')
}

if (erros.length) {
  console.error('\n✖ Variáveis de ambiente de produção:\n')
  for (const e of erros) console.error('  - ' + e)
  console.error('\nConfigure em Vercel → Project → Settings → Environment Variables e faça o deploy de novo.\n')
  process.exit(1)
}
console.log('✔ Variáveis do Supabase configuradas.')
