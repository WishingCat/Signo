import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot, TIER_MASCOT, MASCOT_LABEL } from '@/components/forest/Mascot'
import { getSessionUser } from '@/lib/auth/session'
import { getTeam } from '@/lib/teams/service'
import { InviteForm } from '@/components/teams/InviteForm'
import { LeaveTeamButton } from '@/components/teams/LeaveTeamButton'
import { cn } from '@/lib/utils'

export default async function TeamDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const team = await getTeam(id, user.id)
  if (!team) notFound()

  const canInvite = team.isMember && team.memberCount < 4
  const allComplete = team.members.every((m) => m.completedDailyQuestToday)
  const bonusDisplay =
    team.bonusSettledToday && team.todayBonusBps != null
      ? `✓ 今日 +${team.todayBonusBps / 100}% 已发放`
      : team.bonusBps == null
        ? '未满 2 人，无加成'
        : allComplete
          ? `即将结算 +${team.bonusBps / 100}%`
          : `等待 ${team.memberCount - team.members.filter((m) => m.completedDailyQuestToday).length} 位伙伴完成每日任务`

  return (
    <div className="py-6 space-y-5 bloom-in">
      <Card tilt="left" density="cozy">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="brush-text text-[24px] truncate">{team.name}</h1>
            <p className="text-[12px] text-bark/60 mt-0.5">
              {team.memberCount} / 4 人
              {team.isOwner && <span className="ml-2 text-hazel">队长</span>}
            </p>
          </div>
          <div className="text-right">
            <div className={cn(
              'text-[11px] tracking-[0.2em] uppercase px-2 py-1 rounded-full inline-block',
              team.bonusBps == null ? 'bg-bark/10 text-bark/55' : 'bg-moss/15 text-moss',
            )}>
              {team.bonusBps == null ? '待满员' : `+${team.bonusBps / 100}% 加成`}
            </div>
          </div>
        </div>
        <SketchDivider className="my-3" />
        <p className="text-[13px] text-bark/70">{bonusDisplay}</p>
      </Card>

      <section>
        <h2 className="text-[14px] font-medium text-ink mb-2">成员</h2>
        <ul className="space-y-2">
          {team.members.map((m) => {
            const mas = TIER_MASCOT[Math.min(Math.max(m.tier, 1), 7)]
            return (
              <li key={m.userId}>
                <Link
                  href={`/profile/${m.friendCode}`}
                  className="group flex items-center gap-3 rounded-[14px] px-3 py-2.5 bg-cream/70 hover:bg-cream transition-colors border border-bark/10"
                >
                  <Mascot name={mas} className="h-9 w-9 text-bark shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-ink truncate">
                      {m.nickname}
                      {team.ownerId === m.userId && <span className="ml-1.5 text-[10px] text-hazel">队长</span>}
                      {m.userId === user.id && <span className="ml-1.5 text-[10px] text-bark/55">(你)</span>}
                    </div>
                    <div className="text-[11px] text-bark/55">{MASCOT_LABEL[mas]} · L{m.tier}</div>
                  </div>
                  <div
                    className={cn(
                      'text-[11px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full shrink-0',
                      m.completedDailyQuestToday
                        ? 'bg-moss text-cream'
                        : 'bg-bark/10 text-bark/55',
                    )}
                  >
                    {m.completedDailyQuestToday ? '今日 ✓' : '待完成'}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {canInvite && (
        <section>
          <h2 className="text-[14px] font-medium text-ink mb-2">邀请林友</h2>
          <Card density="tight">
            <InviteForm teamId={team.id} />
            {team.pendingInvites.length > 0 && (
              <div className="mt-3 pt-3 border-t border-dashed border-bark/15">
                <p className="text-[11px] tracking-[0.2em] uppercase text-bark/50 mb-1.5">待响应</p>
                <ul className="space-y-1">
                  {team.pendingInvites.map((pi) => (
                    <li key={pi.id} className="text-[12px] text-bark/70 flex items-center justify-between">
                      <span>{pi.inviteeNickname}</span>
                      <span className="text-bark/45 text-[10px] tabular-nums">{pi.inviteeFriendCode}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </section>
      )}

      {team.isMember && (
        <section>
          <SketchDivider className="opacity-50" />
          <div className="pt-3">
            <LeaveTeamButton teamId={team.id} isOwner={team.isOwner} />
          </div>
        </section>
      )}

      <div className="pt-2">
        <Link href="/teams">
          <Button variant="ink" className="w-full">回到队伍列表</Button>
        </Link>
      </div>
    </div>
  )
}
