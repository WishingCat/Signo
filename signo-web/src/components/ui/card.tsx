import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn('bg-white rounded-card shadow-soft p-5', className)}
    />
  )
}
