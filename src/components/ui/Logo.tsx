export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-8 w-8 flex-col items-center justify-end gap-[3px] rounded-lg bg-zinc-900 pb-1.5 ring-1 ring-white/10">
        <span className="h-[3px] w-2.5 rounded-full bg-amber-300" />
        <span className="h-[3px] w-3.5 rounded-full bg-orange-300" />
        <span className="h-[3px] w-[18px] rounded-full bg-orange-500" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Camada<span className="text-gradient">3D</span>
      </span>
    </span>
  )
}
