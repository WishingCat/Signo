import { prisma } from '@/lib/db'
import { lessonXp, lessonStars } from '@/lib/curriculum/scoring'
import { bumpStreakOnClear } from './streak'
import type { ClearResult, OnLessonClearArgs } from './types'

/**
 * 结算关卡 hook：W2 起同时更新 streak / totalXp / weeklyXp。
 * W3 会在此追加 badge 评估。
 */
export async function onLessonClear(
  args: OnLessonClearArgs,
): Promise<ClearResult> {
  const { userId, lessonId, graded, totalInLesson } = args
  const correct = graded.reduce((n, g) => n + (g.isCorrect ? 1 : 0), 0)
  const total = totalInLesson

  for (const g of graded) {
    await prisma.attempt.create({
      data: {
        userId,
        questionId: g.questionId,
        isCorrect: g.isCorrect,
        msSpent: g.msSpent,
      },
    })
  }

  const xp = lessonXp({ total, correct })
  const stars = lessonStars({ total, correct })

  await prisma.lessonClear.create({
    data: { userId, lessonId, stars },
  })

  const today = todayIsoDate()
  await prisma.dailyStat.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, xp, lessonsCleared: 1 },
    update: { xp: { increment: xp }, lessonsCleared: { increment: 1 } },
  })

  // 更新用户总 XP / 周 XP
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totalXp: { increment: xp },
      weeklyXp: { increment: xp },
    },
    select: { totalXp: true },
  })

  // 连胜推进
  const streak = await bumpStreakOnClear(userId, today)

  return {
    xp,
    correct,
    total,
    stars,
    streak,
    totalXp: updatedUser.totalXp,
  }
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function getTodayXp(userId: string): Promise<number> {
  const stat = await prisma.dailyStat.findUnique({
    where: { userId_date: { userId, date: todayIsoDate() } },
  })
  return stat?.xp ?? 0
}

export type UserProgressSummary = {
  todayXp: number
  totalXp: number
  weeklyXp: number
  currentStreak: number
  bestStreak: number
  tier: number
  lessonsClearedTotal: number
}

export async function getUserProgress(userId: string): Promise<UserProgressSummary> {
  const [u, todayStat, clearsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalXp: true,
        weeklyXp: true,
        currentStreak: true,
        bestStreak: true,
        tier: true,
      },
    }),
    prisma.dailyStat.findUnique({
      where: { userId_date: { userId, date: todayIsoDate() } },
    }),
    prisma.lessonClear.count({ where: { userId } }),
  ])
  if (!u) throw new Error('getUserProgress: user not found')
  return {
    todayXp: todayStat?.xp ?? 0,
    totalXp: u.totalXp,
    weeklyXp: u.weeklyXp,
    currentStreak: u.currentStreak,
    bestStreak: u.bestStreak,
    tier: u.tier,
    lessonsClearedTotal: clearsCount,
  }
}
