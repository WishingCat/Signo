import { cn } from '@/lib/utils'
import { Mascot, TIER_MASCOT, MASCOT_LABEL, type MascotName } from './Mascot'

type Props = {
  tier: number
  className?: string
  compact?: boolean
}

/** 显示当前段位：小动物 + 中文名 + L 编号 */
export function TierBadge({ tier, className, compact = false }: Props) {
  const safeTier = Math.min(Math.max(tier, 1), 7)
  const name: MascotName = TIER_MASCOT[safeTier]
  const label = MASCOT_LABEL[name]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-bark/10 bg-cream/80 backdrop-blur px-3 py-1',
        'shadow-[0_2px_6px_-2px_rgba(74,58,44,0.12)]',
        className,
      )}
    >
      <span className="relative flex h-7 w-7 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 55%, rgba(143,166,127,0.35) 0%, rgba(143,166,127,0) 70%)',
          }}
          aria-hidden
        />
        <Mascot name={name} className="h-6 w-6 text-bark" />
      </span>
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="font-[family-name:var(--font-brush)] text-[15px] text-ink leading-none">
            {label}
          </span>
          <span className="font-[family-name:var(--font-latin)] text-[11px] text-bark/55 leading-none">
            L{safeTier}
          </span>
        </span>
      )}
    </span>
  )
}
