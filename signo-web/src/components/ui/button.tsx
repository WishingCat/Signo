import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'

const styles: Record<Variant, string> = {
  primary: 'bg-hazel text-oat hover:brightness-95 active:translate-y-px',
  secondary: 'bg-moss text-oat hover:brightness-95',
  ghost: 'bg-transparent text-bark hover:bg-oat/60',
}

export function Button({
  variant = 'primary',
  className,
  ...rest
}: { variant?: Variant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-btn shadow-soft transition',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        styles[variant],
        className,
      )}
    />
  )
}
