/**
 * Extração de cores de uma logo, no navegador (canvas), sem bibliotecas.
 *
 * 1. reduz a imagem para ~96px e lê os pixels opacos;
 * 2. descarta quase-branco, quase-preto e cinzas (fundo, contorno e texto);
 * 3. agrupa por matiz (faixas de 15°) ponderando pela saturação;
 * 4. primária = faixa mais forte; secundária = próxima faixa forte com matiz
 *    diferente (≥ 35°) ou, se a logo for de uma cor só, uma variação análoga.
 * As cores são ajustadas para uma luminosidade utilizável em botões e textos.
 */

export interface Paleta {
  primaria: string
  secundaria: string
  /** Até 6 cores representativas para o usuário escolher. */
  candidatas: string[]
  /** true quando a logo não tem cor (preto/branco/cinza). */
  monocromatica: boolean
}

type RGB = [number, number, number]
type HSL = [number, number, number] // h 0-360, s 0-1, l 0-1

export function rgbParaHsl([r, g, b]: RGB): HSL {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h *= 60
  return [h, s, l]
}

export function hslParaHex([h, s, l]: HSL): string {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

export function hexParaRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Ajusta saturação/luz para a cor funcionar como cor de marca na interface. */
function utilizavel([h, s, l]: HSL, faixaL: [number, number]): HSL {
  return [h, clamp(s, 0.45, 0.95), clamp(l, faixaL[0], faixaL[1])]
}

const distanciaMatiz = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Texto legível (quase-preto ou branco) sobre a cor dada. */
export function corDeTextoSobre(hex: string): string {
  const [r, g, b] = hexParaRgb(hex).map((c) => {
    const x = c / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminancia > 0.36 ? '#18181b' : '#ffffff'
}

export async function extrairPaleta(imagem: Blob): Promise<Paleta> {
  const bitmap = await createImageBitmap(imagem)
  const lado = 96
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * escala))
  const h = Math.max(1, Math.round(bitmap.height * escala))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Não foi possível ler a imagem.')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const { data } = ctx.getImageData(0, 0, w, h)

  const FAIXA = 15
  const faixas = Array.from({ length: 360 / FAIXA }, () => ({ peso: 0, r: 0, g: 0, b: 0, n: 0, h: 0 }))
  let opacos = 0

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 160) continue
    opacos++
    const rgb: RGB = [data[i], data[i + 1], data[i + 2]]
    const [hh, s, l] = rgbParaHsl(rgb)
    if (s < 0.22 || l < 0.1 || l > 0.92) continue
    const f = faixas[Math.floor(hh / FAIXA) % faixas.length]
    const peso = s * (1 - Math.abs(l - 0.5))
    f.peso += peso
    f.r += rgb[0] * peso
    f.g += rgb[1] * peso
    f.b += rgb[2] * peso
    f.h += hh * peso
    f.n++
  }

  const ordenadas = faixas
    .filter((f) => f.n > 0 && f.peso > 0)
    .map((f) => {
      const rgb: RGB = [f.r / f.peso, f.g / f.peso, f.b / f.peso]
      return { peso: f.peso, hsl: rgbParaHsl(rgb) }
    })
    .sort((a, b) => b.peso - a.peso)

  // logo sem cor: mantém o padrão do sistema
  if (!ordenadas.length || ordenadas[0].peso < opacos * 0.004) {
    return { primaria: '#f97316', secundaria: '#fbbf24', candidatas: [], monocromatica: true }
  }

  const prim = ordenadas[0]
  const sec = ordenadas.find((o) => o !== prim && distanciaMatiz(o.hsl[0], prim.hsl[0]) >= 35 && o.peso >= prim.peso * 0.08)

  const primaria = hslParaHex(utilizavel(prim.hsl, [0.42, 0.6]))
  const secundaria = sec
    ? hslParaHex(utilizavel(sec.hsl, [0.5, 0.7]))
    : hslParaHex(utilizavel([(prim.hsl[0] + 30) % 360, prim.hsl[1], prim.hsl[2] + 0.12], [0.55, 0.72]))

  const candidatas = [...new Set(ordenadas.slice(0, 6).map((o) => hslParaHex(utilizavel(o.hsl, [0.38, 0.72]))))]
  return { primaria, secundaria, candidatas, monocromatica: false }
}
