import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'ink'
type Size = 'md' | 'lg' | 'sm'

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-btn transition-all duration-200 ' +
  'font-[family-name:var(--font-book)] tracking-[0.02em] select-none ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-hazel/40 focus-visible:ring-offset-2 focus-visible:ring-offset-oat'

const variants: Record<Variant, string> = {
  primary:
    'bg-hazel text-cream shadow-[0_4px_0_rgba(74,58,44,0.18),0_8px_14px_-6px_rgba(126,162,85,0.45)] ' +
    'hover:-translate-y-[1px] hover:shadow-[0_6px_0_rgba(74,58,44,0.18),0_12px_20px_-8px_rgba(126,162,85,0.55)] ' +
    'active:translate-y-[2px] active:shadow-[0_2px_0_rgba(74,58,44,0.18),0_4px_8px_-4px_rgba(126,162,85,0.4)]',
  secondary:
    'bg-moss text-cream shadow-[0_4px_0_rgba(74,58,44,0.16),0_8px_14px_-6px_rgba(95,125,79,0.45)] ' +
    'hover:-translate-y-[1px] active:translate-y-[2px]',
  ghost:
    'bg-transparent text-bark hover:bg-bark/5 active:bg-bark/10',
  ink:
    'bg-cream/60 text-ink border border-ink/55 shadow-[0_3px_0_rgba(43,36,30,0.18)] ' +
    'hover:bg-cream hover:-translate-y-[1px] active:translate-y-[1px] ' +
    'before:absolute before:inset-0 before:rounded-btn before:pointer-events-none ' +
    "before:[background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.14 0 0 0 0 0.12 0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>\")] " +
    'before:mix-blend-multiply before:opacity-60',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 h-8 text-[13px]',
  md: 'px-5 h-10 text-[14px]',
  lg: 'px-6 h-12 text-[15px]',
}

type ButtonProps = {
  variant?: Variant
  size?: Size
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      <span className="relative">{children}</span>
    </button>
  )
}
