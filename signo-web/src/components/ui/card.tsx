import * as React from 'react'
import { cn } from '@/lib/utils'

type CardProps = {
  /** 纸张卡：淡黄纸 + 纤维颗粒 + 内阴影 */
  paper?: boolean
  /** 轻微倾斜 */
  tilt?: 'left' | 'right' | 'none'
  /** 顶部贴纸胶带 */
  tape?: boolean
  /** 内边距松紧 */
  density?: 'cozy' | 'tight' | 'loose'
} & React.HTMLAttributes<HTMLDivElement>

const tiltClass: Record<NonNullable<CardProps['tilt']>, string> = {
  none: '',
  left: '-rotate-[0.6deg]',
  right: 'rotate-[0.4deg]',
}

const densityClass: Record<NonNullable<CardProps['density']>, string> = {
  cozy: 'p-6',
  tight: 'p-4',
  loose: 'p-8',
}

export function Card({
  paper = true,
  tilt = 'none',
  tape = false,
  density = 'cozy',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        'relative rounded-card',
        paper
          ? 'paper'
          : 'bg-cream border border-bark/10 shadow-[var(--shadow-soft)]',
        densityClass[density],
        tiltClass[tilt],
        'transition-transform',
        className,
      )}
    >
      {tape && (
        <span
          className="tape rounded-[2px]"
          style={{ top: -9, left: '50%', transform: 'translateX(-50%) rotate(-3deg)' }}
          aria-hidden
        />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}
