import type { CSSProperties } from 'react'

/**
 * Logo "farmOps 3D".
 * O arquivo public/logo-farmops.png é branco com fundo transparente; aqui ele é usado como
 * MÁSCARA, e a cor vem do texto atual (currentColor). Assim a logo fica clara no tema escuro
 * e escura no tema claro, sem precisar de duas imagens.
 */
const PROPORCAO = 447 / 128

const mascara: CSSProperties = {
  WebkitMaskImage: 'url(/logo-farmops.png)',
  maskImage: 'url(/logo-farmops.png)',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'left center',
  maskPosition: 'left center',
  aspectRatio: String(PROPORCAO),
}

export function Logo({ className = '', altura = 'h-9' }: { className?: string; altura?: string }) {
  return (
    <span className={`inline-flex items-center text-zinc-50 ${className}`}>
      <span role="img" aria-label="farmOps 3D" className={`block ${altura} bg-current`} style={mascara} />
    </span>
  )
}
