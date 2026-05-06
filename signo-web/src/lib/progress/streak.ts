import { prisma } from '@/lib/db'

export type StreakDelta = {
  currentStreak: number
  bestStreak: number
  lastClearDate: string
  /** 本次相对上一次状态是否延续 / 重置 / 首次 */
  event: 'continued' | 'reset' | 'started' | 'same-day'
}

/**
 * 纯函数：根据"上次通关日"与"今天"推出新 streak。
 * - same-day：同一天再通关，streak 不变
 * - continued：昨天→今天，+1
 * - reset：中间空了至少 1 天，回到 1
 * - started：之前从未通关，从 1 起步
 */
export function computeStreak(args: {
  today: string
  lastClearDate: string | null
  currentStreak: number
  bestStreak: number
}): StreakDelta {
  const { today, lastClearDate, currentStreak, bestStreak } = args

  if (!lastClearDate) {
    return { currentStreak: 1, bestStreak: Math.max(1, bestStreak), lastClearDate: today, event: 'started' }
  }
  if (lastClearDate === today) {
    return { currentStreak, bestStreak, lastClearDate: today, event: 'same-day' }
  }
  const y = yesterdayOf(today)
  if (lastClearDate === y) {
    const next = currentStreak + 1
    return { currentStreak: next, bestStreak: Math.max(next, bestStreak), lastClearDate: today, event: 'continued' }
  }
  return { currentStreak: 1, bestStreak: Math.max(1, bestStreak), lastClearDate: today, event: 'reset' }
}

function yesterdayOf(today: string): string {
  const d = new Date(today + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function bumpStreakOnClear(userId: string, today: string): Promise<StreakDelta> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, bestStreak: true, lastClearDate: true },
  })
  if (!u) throw new Error(`bumpStreakOnClear: user ${userId} not found`)
  const delta = computeStreak({
    today,
    lastClearDate: u.lastClearDate,
    currentStreak: u.currentStreak,
    bestStreak: u.bestStreak,
  })
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: delta.currentStreak,
      bestStreak: delta.bestStreak,
      lastClearDate: delta.lastClearDate,
    },
  })
  return delta
}
