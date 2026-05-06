import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot, TIER_MASCOT, MASCOT_LABEL } from '@/components/forest/Mascot'
import { getSessionUser } from '@/lib/auth/session'
import { getWeeklyLeaders } from '@/lib/progress/service'
import { cn } from '@/lib/utils'

export default async function LeaderboardPage() {
  const [user, leaders] = await Promise.all([
    getSessionUser(),
    getWeeklyLeaders(20),
  ])

  return (
    <div className="py-6 space-y-4 bloom-in">
      <div>
        <h1 className="brush-text text-[24px]">本周排行</h1>
        <p className="text-[12px] text-bark/60">
          从本周一 0 点起累计的学习 XP。
        </p>
      </div>

      <SketchDivider />

      {leaders.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-[14px] text-bark/65">本周还没人种下第一片叶子。</p>
          <a href="/" className="inline-block mt-4">
            <Button>去种第一片</Button>
          </a>
        </Card>
      ) : (
        <Card density="tight">
          <ol className="divide-y divide-bark/10">
            {leaders.map((row) => {
              const isMe = user?.id === row.userId
              const mascot = TIER_MASCOT[Math.min(Math.max(row.tier, 1), 7)]
              return (
                <li
                  key={row.userId}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2.5 transition-colors',
                    isMe && 'bg-hazel/10 rounded-[8px] -mx-1 px-3',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] tabular-nums font-medium',
                      row.rank === 1 && 'bg-hazel text-cream',
                      row.rank === 2 && 'bg-mist text-ink',
                      row.rank === 3 && 'bg-sage/60 text-ink',
                      row.rank > 3 && 'bg-bark/10 text-bark/70',
                    )}
                  >
                    {row.rank}
                  </span>
                  <Mascot name={mascot} className="h-10 w-10 text-bark shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-ink truncate">
                      {row.nickname}
                      {isMe && <span className="ml-1.5 text-[10px] text-hazel">(你)</span>}
                    </div>
                    <div className="text-[11px] text-bark/55 mt-0.5">
                      {MASCOT_LABEL[mascot]} · L{row.tier}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] tabular-nums font-medium text-hazel leading-none">
                      {row.weeklyXp}
                    </div>
                    <div className="text-[9px] tracking-[0.25em] uppercase text-bark/45 mt-1">xp</div>
                  </div>
                </li>
              )
            })}
          </ol>
        </Card>
      )}

      <p className="text-center text-[11px] text-bark/45 italic pt-2">
        每周一 0 点重新开始 · 前 5 名升段（W3 开启）
      </p>
    </div>
  )
}
