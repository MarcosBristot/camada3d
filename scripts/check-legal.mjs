// Verifica se os dados legais foram preenchidos antes do deploy.
// Uso: npm run check:legal   (sai com código 1 se houver "[PREENCHER" em src/config/legal.ts)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const arquivo = fileURLToPath(new URL('../src/config/legal.ts', import.meta.url))
const linhas = readFileSync(arquivo, 'utf8').split(/\r?\n/)

const pendencias = linhas
  .map((texto, i) => ({ n: i + 1, texto: texto.trim() }))
  .filter(({ texto }) => /\bP\('/.test(texto) && !texto.startsWith('const P') && !texto.startsWith('*') && !texto.startsWith('//'))

// Ao cobrar (planosPagos: true), o Decreto 7.962/2013 (comércio eletrônico) exige identificação
// completa do fornecedor: CPF/CNPJ e endereço físico visíveis no site.
const texto = linhas.join('\n')
const cobrando = /planosPagos:\s*true/.test(texto)
const semDocumento = /documento:\s*''/.test(texto)
const semEndereco = /endereco:\s*''/.test(texto)
if (cobrando && (semDocumento || semEndereco)) {
  pendencias.push({
    n: linhas.findIndex((l) => l.includes('planosPagos')) + 1,
    texto: 'planosPagos: true exige responsavel.documento (CPF/CNPJ) e responsavel.endereco preenchidos (Decreto 7.962/2013, art. 2º).',
  })
}

if (pendencias.length) {
  console.error(`\n✖ ${pendencias.length} campo(s) legal(is) ainda sem preencher em src/config/legal.ts:\n`)
  for (const p of pendencias) console.error(`  linha ${String(p.n).padStart(3)}  ${p.texto}`)
  console.error('\nPreencha antes de publicar o site. Os textos legais exibem esses valores.\n')
  process.exit(1)
}
console.log('✔ Dados legais preenchidos.')
