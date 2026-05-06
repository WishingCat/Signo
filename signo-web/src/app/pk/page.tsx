import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot, TIER_MASCOT, MASCOT_LABEL } from '@/components/forest/Mascot'
import { getSessionUser } from '@/lib/auth/session'
import { listFriends } from '@/lib/social/service'
import { getWeeklyLeaders } from '@/lib/progress/service'
import { getLessonTree } from '@/lib/curriculum/service'
import { cn } from '@/lib/utils'

export default async function PkHub() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const [friends, leaders, tree] = await Promise.all([
    listFriends(user.id),
    getWeeklyLeaders(5),
    getLessonTree(),
  ])

  const lessons = tree.flatMap((t) => t.lessons)

  return (
    <div className="py-6 space-y-5 bloom-in">
      <div>
        <h1 className="brush-text text-[24px]">手语知识竞赛</h1>
        <p className="text-[12px] text-bark/60 mt-0.5">
          和林友比比谁的星星更多，每周看谁走得最远。
        </p>
      </div>

      <Section title="向林友发起挑战" hint="点关卡名直接去 PK 页">
        {friends.length === 0 ? (
          <Card density="cozy" className="text-center">
            <Mascot name="firefly" className="h-14 w-14 mx-auto text-ink opacity-65" />
            <p className="text-[13px] text-bark/65 mt-2">还没有林友——先加几个再来。</p>
            <a href="/friends" className="inline-block mt-3">
              <Button size="md">去加林友</Button>
            </a>
          </Card>
        ) : (
          <ul className="space-y-2.5">
            {friends.map((f) => {
              const mascot = TIER_MASCOT[Math.min(Math.max(f.tier, 1), 7)]
              return (
                <li key={f.id}>
                  <Card density="tight">
                    <div className="flex items-center gap-3">
                      <Mascot name={mascot} className="h-10 w-10 text-bark shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-ink truncate">{f.nickname}</div>
                        <div className="text-[11px] text-bark/55 mt-0.5">
                          {MASCOT_LABEL[mascot]} · L{f.tier}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {lessons.map((l) => (
                        <Link
                          key={l.id}
                          href={`/pk/${l.id}/${f.friendCode}`}
                          className="inline-flex items-center gap-1 rounded-full bg-oat hover:bg-hazel/15 border border-bark/15 hover:border-hazel/50 px-2.5 py-1 text-[12px] text-ink transition-colors"
                        >
                          <span>{l.title}</span>
                          <span className="text-hazel">→</span>
                        </Link>
                      ))}
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section title="本周排行（前 5）" hint="完整名单看 /leaderboard">
        {leaders.length === 0 ? (
          <Card density="tight" className="text-center text-[13px] text-bark/55 py-4">
            本周还没人种下第一片叶子。
          </Card>
        ) : (
          <Card density="tight">
            <ol className="divide-y divide-bark/10">
              {leaders.map((row) => {
                const isMe = row.userId === user.id
                const mascot = TIER_MASCOT[Math.min(Math.max(row.tier, 1), 7)]
                return (
                  <li
                    key={row.userId}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 transition-colors',
                      isMe && 'bg-hazel/10 rounded-[8px] -mx-1 px-3',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] tabular-nums font-medium',
                        row.rank === 1 && 'bg-hazel text-cream',
                        row.rank === 2 && 'bg-mist text-ink',
                        row.rank === 3 && 'bg-sage/60 text-ink',
                        row.rank > 3 && 'bg-bark/10 text-bark/70',
                      )}
                    >
                      {row.rank}
                    </span>
                    <Mascot name={mascot} className="h-8 w-8 text-bark shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-ink truncate">
                        {row.nickname}
                        {isMe && <span className="ml-1.5 text-[10px] text-hazel">(你)</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] tabular-nums font-medium text-hazel leading-none">
                        {row.weeklyXp}
                      </div>
                      <div className="text-[9px] tracking-[0.25em] uppercase text-bark/45 mt-0.5">xp</div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </Card>
        )}
        <a href="/leaderboard" className="block text-right text-[12px] text-moss hover:text-hazel mt-2">
          查看全榜 →
        </a>
      </Section>

      <Card density="cozy" className="text-[12px] text-bark/65 leading-6">
        <strong className="text-ink font-medium">什么是 PK？</strong>
        <p className="mt-1">
          异步对战：你和林友各自完成同一关，比较通关星级。
          打开链接 <code className="text-[11px] bg-oat px-1 rounded">/pk/[关卡]/[好友码]</code>
          即可看到双方成绩。MVP 阶段以星级比较为基线，实时对战在 W3 接入 WebSocket。
        </p>
      </Card>
    </div>
  )
}

function Section({
  title, hint, children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-[14px] font-medium text-ink">{title}</h2>
        {hint && <span className="text-[11px] text-bark/45">{hint}</span>}
      </div>
      <SketchDivider className="mb-3 opacity-60" />
      {children}
    </section>
  )
}
