import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export const inputCls =
  'w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-orange-400/60 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50'

/** Aceita vírgula ou ponto como separador decimal. Vazio/ inválido => 0. */
export function parseNum(v: string): number {
  const n = Number(v.trim().replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, hint, error, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  )
}

interface NumberInputProps {
  id?: string
  value: string
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
  placeholder?: string
  invalid?: boolean
}

/** Campo numérico em texto (permite "1,5") com prefixo/sufixo. */
export function NumberInput({ id, value, onChange, prefix, suffix, placeholder = '0', invalid }: NumberInputProps) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">{prefix}</span>}
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
        aria-invalid={invalid || undefined}
        className={`${inputCls} ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-12' : ''} ${invalid ? '!border-red-400/60' : ''}`}
      />
      {suffix && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">{suffix}</span>}
    </div>
  )
}

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  children: ReactNode
}

const btnVariants = {
  primary: 'bg-gradient-to-r from-orange-500 to-amber-400 text-zinc-950 shadow-[0_0_30px_-10px_rgba(251,146,60,0.8)] hover:brightness-110',
  secondary: 'border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]',
  ghost: 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100',
  danger: 'border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20',
}

export function Button({ variant = 'primary', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${btnVariants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </motion.button>
  )
}

/** Botão de exclusão em dois cliques: o primeiro pede confirmação por 3 s. */
export function ConfirmButton({
  onConfirm,
  label,
  children,
  disabled,
}: {
  onConfirm: () => void
  label: string
  children: ReactNode
  disabled?: boolean
}) {
  const [armado, setArmado] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={armado ? `Confirmar: ${label}` : label}
      title={armado ? 'Clique de novo para confirmar' : label}
      onClick={() => {
        if (armado) {
          clearTimeout(timer.current)
          setArmado(false)
          onConfirm()
        } else {
          setArmado(true)
          timer.current = setTimeout(() => setArmado(false), 3000)
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
        armado ? 'bg-red-500/15 text-red-300 ring-1 ring-red-400/40' : 'text-zinc-500 hover:bg-white/5 hover:text-red-300'
      }`}
    >
      {children}
      {armado && <span>Confirmar?</span>}
    </button>
  )
}
