import { prisma } from '@/lib/db'
import { lessonXp, lessonStars } from '@/lib/curriculum/scoring'
import type { ClearResult, OnLessonClearArgs } from './types'

/**
 * 结算关卡 — W1 只写 Attempt/LessonClear/DailyStat。
 * W2 在此 hook 里追加 streak / 段位 weeklyXp / 错题更新。
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

  return { xp, correct, total, stars }
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
