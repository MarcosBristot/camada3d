// Verifica se os dados legais foram preenchidos antes do deploy.
// Uso: npm run check:legal   (sai com código 1 se houver "[PREENCHER" em src/config/legal.ts)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const arquivo = fileURLToPath(new URL('../src/config/legal.ts', import.meta.url))
const linhas = readFileSync(arquivo, 'utf8').split(/\r?\n/)

const pendencias = linhas
  .map((texto, i) => ({ n: i + 1, texto: texto.trim() }))
  .filter(({ texto }) => /\bP\('/.test(texto) && !texto.startsWith('const P') && !texto.startsWith('*') && !texto.startsWith('//'))

if (pendencias.length) {
  console.error(`\n✖ ${pendencias.length} campo(s) legal(is) ainda sem preencher em src/config/legal.ts:\n`)
  for (const p of pendencias) console.error(`  linha ${String(p.n).padStart(3)}  ${p.texto}`)
  console.error('\nPreencha antes de publicar o site. Os textos legais exibem esses valores.\n')
  process.exit(1)
}
console.log('✔ Dados legais preenchidos.')
