import { prisma } from '@/lib/db'
import type { TeamBonusGrant } from './types'

/**
 * 团队加成基点（basis points，1 bps = 0.01%）。
 * 2 人 +19%，3 人 +20%，4 人 +21%。其它人数不发放（[2,4] 之外返回 null）。
 */
const BONUS_BPS_BY_SIZE: Record<number, number> = {
  2: 1900,
  3: 2000,
  4: 2100,
}

export function teamBonusBps(memberCount: number): number | null {
  return BONUS_BPS_BY_SIZE[memberCount] ?? null
}

/** 基点折算：day XP 乘以 bps / 10000，向下取整。 */
export function computeBonusXp(dayXp: number, bps: number): number {
  if (dayXp <= 0 || bps <= 0) return 0
  return Math.floor((dayXp * bps) / 10000)
}

/**
 * 当 userId 刚完成每日任务时调用：遍历其所有队伍，若某队全员当天都已完成
 * 且今日未结算 → 写 TeamBonusEvent 占坑 (unique [teamId,date]) + 给每位成员发放
 * day XP × bps% 的奖励（同步 increment DailyStat.xp + User.totalXp/weeklyXp）。
 *
 * 返回当前用户视角的 grants（供 ClearResult 回显）。其它成员的奖励由本函数一并写入 DB。
 */
export async function settleTeamBonusesForUser(
  userId: string,
  today: string,
): Promise<TeamBonusGrant[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          members: { include: { user: { select: { id: true } } } },
          bonuses: { where: { date: today } },
        },
      },
    },
  })

  const grants: TeamBonusGrant[] = []
  for (const m of memberships) {
    if (m.team.bonuses.length > 0) continue
    const members = m.team.members
    const size = members.length
    const bps = teamBonusBps(size)
    if (bps == null) continue

    const memberIds = members.map((x) => x.userId)
    const stats = await prisma.dailyStat.findMany({
      where: { userId: { in: memberIds }, date: today },
    })
    const statMap = new Map(stats.map((s) => [s.userId, s]))
    const allComplete = members.every((x) => statMap.get(x.userId)?.dailyQuestClaimedAt != null)
    if (!allComplete) continue

    // 占坑：TeamBonusEvent @@unique([teamId, date]) 拦截并发重复结算
    try {
      await prisma.teamBonusEvent.create({
        data: { teamId: m.teamId, date: today, pctBps: bps, memberCount: size },
      })
    } catch {
      continue
    }

    for (const mem of members) {
      const dayXp = statMap.get(mem.userId)?.xp ?? 0
      const bonusXp = computeBonusXp(dayXp, bps)
      if (bonusXp <= 0) continue
      await prisma.$transaction([
        prisma.dailyStat.update({
          where: { userId_date: { userId: mem.userId, date: today } },
          data: { xp: { increment: bonusXp } },
        }),
        prisma.user.update({
          where: { id: mem.userId },
          data: { totalXp: { increment: bonusXp }, weeklyXp: { increment: bonusXp } },
        }),
      ])
      if (mem.userId === userId) {
        grants.push({
          teamId: m.teamId,
          teamName: m.team.name,
          pctBps: bps,
          xpCredited: bonusXp,
          memberCount: size,
        })
      }
    }
  }
  return grants
}
