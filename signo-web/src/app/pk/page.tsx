import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot, TIER_MASCOT, MASCOT_LABEL } from '@/components/forest/Mascot'
import { ChallengePanel } from '@/components/pk/ChallengePanel'
import { InviteInbox } from '@/components/pk/InviteInbox'
import { getSessionUser } from '@/lib/auth/session'
import { listFriends } from '@/lib/social/service'
import { getRecentMatches } from '@/lib/pk/service'
import { getPkDailyCount, PK_REWARDS } from '@/lib/pk/awardXp'

export default async function PkHub() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const [friends, recent, dailyCount] = await Promise.all([
    listFriends(user.id),
    getRecentMatches(user.id, 8),
    getPkDailyCount(user.id),
  ])

  return (
    <div className="py-6 space-y-5 bloom-in">
      <div>
        <h1 className="brush-text text-[24px]">手语知识竞赛</h1>
        <p className="text-[12px] text-bark/60 mt-0.5">
          选个主题、选条规则、向林友发起实时挑战。
        </p>
      </div>

      <Card density="tight" className="text-[12px] text-bark/65">
        <div className="flex items-center justify-between">
          <span>今日已计入 XP 的 PK 次数</span>
          <span className="text-[15px] tabular-nums text-hazel font-medium">
            {Math.min(dailyCount, PK_REWARDS.DAILY_CAP)} / {PK_REWARDS.DAILY_CAP}
          </span>
        </div>
        <p className="mt-1 leading-5">
          胜 +{PK_REWARDS.WIN_XP} XP · 负 +{PK_REWARDS.LOSE_XP} XP · 平 +{PK_REWARDS.DRAW_XP} XP；超过 3 次仅记战绩。
        </p>
      </Card>

      <InviteInbox />

      <Section title="发起挑战">
        <ChallengePanel
          friends={friends.map((f) => ({
            id: f.id, nickname: f.nickname, friendCode: f.friendCode, tier: f.tier,
          }))}
        />
      </Section>

      <Section title="最近战绩">
        {recent.length === 0 ? (
          <Card density="tight" className="text-center text-[13px] text-bark/55 py-4">
            还没有对战记录。
          </Card>
        ) : (
          <Card density="tight">
            <ul className="divide-y divide-bark/10">
              {recent.map((m) => {
                const isWin = m.winnerId === user.id
                const isDraw = m.winnerId === null && m.endedReason === 'finished'
                const tag = isDraw ? '平' : isWin ? '胜' : '负'
                const opp = m.opponent
                const oppMascot = opp ? TIER_MASCOT[Math.min(Math.max(opp.tier, 1), 7)] : 'firefly'
                return (
                  <li key={m.id} className="flex items-center gap-3 px-2 py-2">
                    <Mascot name={oppMascot} className="h-7 w-7 text-bark shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-ink truncate">
                        {opp?.nickname ?? '未知对手'}
                      </div>
                      <div className="text-[11px] text-bark/55 mt-0.5">
                        {m.theme} · {MASCOT_LABEL[oppMascot]}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={
                        'text-[14px] tabular-nums font-medium leading-none ' +
                        (isWin ? 'text-hazel' : isDraw ? 'text-bark' : 'text-ochre')
                      }>
                        {tag} {m.selfScore}:{m.oppScore}
                      </div>
                      {m.selfXp > 0 && (
                        <div className="text-[10px] text-moss mt-0.5">+{m.selfXp} XP</div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[14px] font-medium text-ink mb-2">{title}</h2>
      <SketchDivider className="mb-3 opacity-60" />
      {children}
    </section>
  )
}
