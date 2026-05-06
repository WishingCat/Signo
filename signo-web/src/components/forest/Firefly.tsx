'use client'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  /** 秒数，决定脉动周期 */
  period?: number
  /** 0-1，控制最大亮度 */
  intensity?: number
  /** 漂移 */
  drift?: boolean
}

export function Firefly({
  className,
  period = 3.2,
  intensity = 1,
  drift = true,
}: Props) {
  return (
    <span
      className={cn('pointer-events-none inline-block', className)}
      style={{
        animation: drift ? `firefly-drift ${period * 2.3}s ease-in-out infinite` : undefined,
      }}
    >
      <span
        className="block rounded-full"
        style={{
          width: 12,
          height: 12,
          background:
            'radial-gradient(circle, rgba(243,201,105,1) 0%, rgba(243,201,105,0.55) 45%, rgba(243,201,105,0) 75%)',
          boxShadow: '0 0 18px 6px rgba(243,201,105,0.35)',
          animation: `firefly-pulse ${period}s ease-in-out infinite`,
          opacity: intensity,
        }}
      />
    </span>
  )
}
