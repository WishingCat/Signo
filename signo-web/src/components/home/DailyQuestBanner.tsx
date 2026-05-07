import { LeafCoin } from '@/components/forest/LeafCoin'
import { cn } from '@/lib/utils'

type Props = {
  todayXp: number
  threshold: number
  alreadyClaimed: boolean
  bonusXp: number
  bonusLeaves: number
}

/**
 * 首页每日任务条：显示今日 XP 进度 / 100，或完成状态。
 * 奖励：+20 XP + 50 落叶（一日一次）。
 */
export function DailyQuestBanner({
  todayXp, threshold, alreadyClaimed, bonusXp, bonusLeaves,
}: Props) {
  const pct = Math.min(100, Math.round((todayXp / threshold) * 100))

  if (alreadyClaimed) {
    return (
      <div className="rounded-[16px] border border-moss/40 bg-moss/10 px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-moss text-cream flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12 L 10 17 L 19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-moss font-medium">今日任务已完成</div>
          <div className="text-[11px] text-bark/55 mt-0.5">继续练习更多 XP 不再额外发放，明天见。</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-bark/15 bg-cream/80 px-4 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-[13px] text-ink font-medium">
          <LeafCoin iconOnly size={16} />
          <span>今日任务</span>
          <span className="text-[11px] text-bark/55 font-normal ml-1">
            达到 {threshold} XP → +{bonusXp} XP · +{bonusLeaves} 落叶
          </span>
        </div>
        <span className="tabular-nums text-[12px] text-bark/60">
          {todayXp} / {threshold}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-bark/10 overflow-hidden">
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500',
            todayXp >= threshold ? 'bg-moss' : 'bg-hazel',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {todayXp >= threshold && (
        <p className="mt-2 text-[11px] text-moss font-medium">
          已经到线，下次通关自动领取奖励。
        </p>
      )}
    </div>
  )
}
