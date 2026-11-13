import { Logo } from '../ui/Logo'

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 md:flex-row">
        <Logo />
        <p>Precificação, vendas e finanças para impressão 3D.</p>
        <p>© {new Date().getFullYear()} Camada3D</p>
      </div>
    </footer>
  )
}
