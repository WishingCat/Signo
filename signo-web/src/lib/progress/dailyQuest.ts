import { prisma } from '@/lib/db'
import { ECONOMY } from '@/config/economy'

export type DailyQuestEvent = 'already-claimed' | 'not-yet' | 'just-crossed'

export type DailyQuestDelta = {
  event: DailyQuestEvent
  bonusXp: number
  bonusLeaves: number
  /** 当前累计 XP（含本次结算与可能的 bonus） */
  todayXp: number
  /** 阈值（前端显示进度条用） */
  threshold: number
}

/**
 * 纯函数：判断本次 XP 写入是否触发每日任务结算。
 * - just-crossed：本次新增使得 previousXp < 100 ≤ newXp 且未领过 → 给 bonus
 * - already-claimed：之前已经领过（不重复结算）
 * - not-yet：还没到阈值
 */
export function computeDailyQuest(args: {
  previousXp: number
  newXp: number
  alreadyClaimed: boolean
}): DailyQuestDelta {
  const { previousXp, newXp, alreadyClaimed } = args
  const t = ECONOMY.DAILY_QUEST_THRESHOLD
  if (alreadyClaimed) {
    return { event: 'already-claimed', bonusXp: 0, bonusLeaves: 0, todayXp: newXp, threshold: t }
  }
  if (newXp < t) {
    return { event: 'not-yet', bonusXp: 0, bonusLeaves: 0, todayXp: newXp, threshold: t }
  }
  // newXp ≥ threshold and not previously claimed
  // (we treat any first-time-crossing — including same-write — as just-crossed)
  if (previousXp >= t) {
    // edge: previously had ≥100 but never claimed — defensive: treat as just-crossed too
    return {
      event: 'just-crossed',
      bonusXp: ECONOMY.DAILY_QUEST_BONUS_XP,
      bonusLeaves: ECONOMY.DAILY_QUEST_BONUS_LEAVES,
      todayXp: newXp + ECONOMY.DAILY_QUEST_BONUS_XP,
      threshold: t,
    }
  }
  return {
    event: 'just-crossed',
    bonusXp: ECONOMY.DAILY_QUEST_BONUS_XP,
    bonusLeaves: ECONOMY.DAILY_QUEST_BONUS_LEAVES,
    todayXp: newXp + ECONOMY.DAILY_QUEST_BONUS_XP,
    threshold: t,
  }
}

/**
 * DB 包装：检查阈值穿越后，落库 bonus 并标记 dailyQuestClaimedAt。
 * 调用方应在 DailyStat upsert 之后调用，传入 upsert 前的 previousXp 与 upsert 后的 newXp。
 */
export async function claimDailyQuestIfEligible(args: {
  userId: string
  today: string
  previousXp: number
  newXp: number
  alreadyClaimed: boolean
}): Promise<DailyQuestDelta> {
  const delta = computeDailyQuest({
    previousXp: args.previousXp,
    newXp: args.newXp,
    alreadyClaimed: args.alreadyClaimed,
  })
  if (delta.event !== 'just-crossed') return delta

  await prisma.$transaction([
    prisma.dailyStat.update({
      where: { userId_date: { userId: args.userId, date: args.today } },
      data: {
        xp: { increment: delta.bonusXp },
        leaves: { increment: delta.bonusLeaves },
        dailyQuestClaimedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: args.userId },
      data: {
        totalXp: { increment: delta.bonusXp },
        weeklyXp: { increment: delta.bonusXp },
        leaves: { increment: delta.bonusLeaves },
      },
    }),
  ])
  return delta
}
