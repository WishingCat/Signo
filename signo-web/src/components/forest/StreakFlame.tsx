import { cn } from '@/lib/utils'

type Props = {
  /** 连胜天数；0 表示未点燃 */
  days: number
  className?: string
  /** 大号显示（个人主页），默认小号（首页 chip） */
  large?: boolean
}

/** 连胜火焰：天数 + 手绘火苗 SVG。0 时显示灰色未点燃状态。 */
export function StreakFlame({ days, className, large = false }: Props) {
  const lit = days > 0
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <svg
        viewBox="0 0 24 24"
        className={cn(
          'transition-all',
          large ? 'h-10 w-10' : 'h-5 w-5',
          lit ? 'text-hazel' : 'text-bark/25',
        )}
        style={lit ? { filter: 'drop-shadow(0 0 6px rgba(199,127,68,0.4))' } : undefined}
        aria-hidden
      >
        <path
          d="M12 2.5 C 9 6, 7 8.5, 7 12 C 7 15.5, 9 18, 12 18 C 15 18, 17 15.5, 17 12 C 17 9.5, 15.5 8, 14 6 C 14 9, 12 10, 12 10 Z"
          fill="currentColor"
        />
        <path
          d="M12 10 C 10.5 11.5, 10 13, 10.5 14.5 C 11 15.5, 12 16, 13 15 C 14 14, 14 12.5, 12 10 Z"
          fill={lit ? '#f3c969' : 'rgba(74,58,44,0.35)'}
          stroke="none"
        />
        <path
          d="M8 20 C 10 22, 14 22, 16 20"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      <span
        className={cn(
          'font-medium tabular-nums leading-none',
          large ? 'text-[26px]' : 'text-[14px]',
          lit ? 'text-ink' : 'text-bark/50',
        )}
      >
        {days}
        <span className={cn('ml-1 text-bark/55', large ? 'text-[13px]' : 'text-[11px]')}>
          {lit ? '天' : '天等你'}
        </span>
      </span>
    </span>
  )
}
