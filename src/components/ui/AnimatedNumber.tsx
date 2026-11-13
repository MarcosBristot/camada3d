import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { formatBRL } from '../../lib/format'

interface Props {
  value: number
  format?: (n: number) => string
  className?: string
}

/** Número que "rola" suavemente até o novo valor. */
export function AnimatedNumber({ value, format = formatBRL, className }: Props) {
  const spring = useSpring(value, { stiffness: 140, damping: 22 })
  const text = useTransform(spring, (v) => format(v))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span className={className}>{text}</motion.span>
}
