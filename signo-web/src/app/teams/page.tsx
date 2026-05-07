import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot } from '@/components/forest/Mascot'
import { getSessionUser } from '@/lib/auth/session'
import { listMyTeams, pendingInvitesForUser } from '@/lib/teams/service'
import { teamBonusBps } from '@/lib/teams/bonus'
import { RespondInviteButtons } from '@/components/teams/RespondInviteButtons'
import { cn } from '@/lib/utils'

export default async function TeamsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const [teams, invites] = await Promise.all([
    listMyTeams(user.id),
    pendingInvitesForUser(user.id),
  ])

  return (
    <div className="py-6 space-y-5 bloom-in">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="brush-text text-[24px]">团队协作</h1>
          <p className="text-[12px] text-bark/60 mt-0.5">
            2–4 人组队，大家当日都完成每日任务，全员当天 XP 得 19–21% 加成。
          </p>
        </div>
        <Link href="/teams/new">
          <Button size="md">+ 新建</Button>
        </Link>
      </div>

      {invites.length > 0 && (
        <section>
          <h2 className="text-[14px] font-medium text-ink mb-2">收到的邀请 ({invites.length})</h2>
          <ul className="space-y-2">
            {invites.map((iv) => (
              <li key={iv.id}>
                <Card density="tight" className="flex items-center gap-3 flex-wrap">
                  <Mascot name="firefly" className="h-9 w-9 text-ink opacity-80 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-ink truncate">
                      <span className="text-moss font-medium">{iv.inviterNickname}</span> 邀你加入
                    </div>
                    <div className="text-[12px] text-bark/60 truncate">
                      《{iv.teamName}》 · 当前 {iv.currentMemberCount} 人
                    </div>
                  </div>
                  <RespondInviteButtons inviteId={iv.id} />
                </Card>
              </li>
            ))}
          </ul>
          <SketchDivider className="mt-4 opacity-50" />
        </section>
      )}

      <section>
        <h2 className="text-[14px] font-medium text-ink mb-2">
          我的队伍 <span className="text-[11px] text-bark/45 font-normal">({teams.length})</span>
        </h2>
        {teams.length === 0 ? (
          <Card className="text-center py-8">
            <Mascot name="squirrel" className="h-14 w-14 mx-auto text-moss opacity-70" />
            <p className="text-[13px] text-bark/65 mt-2">还没组队。拉几个林友，全员每日任务达成有加成。</p>
            <Link href="/teams/new" className="inline-block mt-4">
              <Button size="md">创建第一个队伍</Button>
            </Link>
          </Card>
        ) : (
          <ul className="space-y-2">
            {teams.map((t) => {
              const bps = teamBonusBps(t.memberCount)
              const full = t.memberCount === 4
              return (
                <li key={t.id}>
                  <Link
                    href={`/teams/${t.id}`}
                    className="group block rounded-[14px] px-3 py-3 bg-cream/70 hover:bg-cream hover:-translate-y-[1px] transition-all border border-bark/10 shadow-[0_2px_0_rgba(74,58,44,0.06)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] text-ink font-medium truncate flex-1">
                        {t.name}
                      </span>
                      <span className={cn(
                        'text-[11px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full',
                        bps == null ? 'bg-bark/10 text-bark/55' : 'bg-moss/15 text-moss',
                      )}>
                        {bps == null ? '未满 2 人' : `+${bps / 100}%`}
                      </span>
                      {full && (
                        <span className="text-[10px] tracking-[0.2em] uppercase text-hazel">满员</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[12px] text-bark/65">
                        今日完成 <span className="tabular-nums">{t.todayCompletedCount}</span> / {t.memberCount}
                      </span>
                      <span className="text-[11px] text-bark/50">
                        {t.bonusSettledToday ? '✓ 今日已结算' : '进行中'}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="pt-2">
        <Link href="/me">
          <Button variant="ink" className="w-full">回到个人</Button>
        </Link>
      </div>
    </div>
  )
}
