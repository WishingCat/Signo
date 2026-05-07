import { prisma } from '@/lib/db'
import { lessonXp, lessonStars, lessonLeaves, reviewLeaves } from '@/lib/curriculum/scoring'
import { bumpStreakOnClear } from './streak'
import { claimDailyQuestIfEligible } from './dailyQuest'
import { awardBadges } from '@/lib/badges/service'
import type { ClearResult, GradedAnswer, OnLessonClearArgs } from './types'

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
  const leavesEarned = lessonLeaves({ total, correct })

  await prisma.lessonClear.create({
    data: { userId, lessonId, stars },
  })

  const today = todayIsoDate()

  // 读 upsert 前的 DailyStat 作为"今日 quest 是否已领 + previousXp"判定依据
  const prevStat = await prisma.dailyStat.findUnique({
    where: { userId_date: { userId, date: today } },
  })
  const previousTodayXp = prevStat?.xp ?? 0
  const alreadyClaimed = !!prevStat?.dailyQuestClaimedAt

  await prisma.dailyStat.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, xp, leaves: leavesEarned, lessonsCleared: 1 },
    update: { xp: { increment: xp }, leaves: { increment: leavesEarned }, lessonsCleared: { increment: 1 } },
  })

  // 每日任务结算（若触发，wrapper 内部会再追加 bonus 到 DailyStat + User）
  const dailyQuest = await claimDailyQuestIfEligible({
    userId,
    today,
    previousXp: previousTodayXp,
    newXp: previousTodayXp + xp,
    alreadyClaimed,
  })

  // 最后再统一更新 User（lesson 本身的 XP + 落叶；bonus 已在 claim 内写过）
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totalXp: { increment: xp },
      weeklyXp: { increment: xp },
      leaves: { increment: leavesEarned },
    },
    select: { totalXp: true, leaves: true },
  })

  // 连胜推进
  const streak = await bumpStreakOnClear(userId, today)

  // 徽章评估（lessonsCleared 需实时 count；刚 create 过一条所以 +1）
  const lessonsCleared = await prisma.lessonClear.count({ where: { userId } })
  const badgesEarned = await awardBadges(userId, {
    lessonsCleared,
    currentStreak: streak.currentStreak,
    totalXp: updatedUser.totalXp,
    completedReview: false,
    isLessonPerfect: correct === total && total > 0,
  })

  return {
    xp,
    correct,
    total,
    stars,
    streak,
    totalXp: updatedUser.totalXp,
    leavesEarned,
    totalLeaves: updatedUser.leaves,
    dailyQuest,
    badgesEarned,
  }
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 复习关结算：不写 LessonClear（非正式关卡），仅记 Attempts + XP + streak */
export async function onReviewClear(args: {
  userId: string
  graded: GradedAnswer[]
}): Promise<ClearResult> {
  const { userId, graded } = args
  const correct = graded.reduce((n, g) => n + (g.isCorrect ? 1 : 0), 0)
  const total = graded.length

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

  // 复习关 XP 按比例给，较正式关稍低（以鼓励先完成正课）：每对 2 XP，全对额外 +3
  const xp = Math.max(0, correct * 2) + (correct === total && total > 0 ? 3 : 0)
  const stars = lessonStars({ total, correct })
  const leavesEarned = reviewLeaves({ total, correct })

  const today = todayIsoDate()

  const prevStat = await prisma.dailyStat.findUnique({
    where: { userId_date: { userId, date: today } },
  })
  const previousTodayXp = prevStat?.xp ?? 0
  const alreadyClaimed = !!prevStat?.dailyQuestClaimedAt

  await prisma.dailyStat.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, xp, leaves: leavesEarned, lessonsCleared: 0 },
    update: { xp: { increment: xp }, leaves: { increment: leavesEarned } },
  })

  const dailyQuest = await claimDailyQuestIfEligible({
    userId,
    today,
    previousXp: previousTodayXp,
    newXp: previousTodayXp + xp,
    alreadyClaimed,
  })

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      totalXp: { increment: xp },
      weeklyXp: { increment: xp },
      leaves: { increment: leavesEarned },
    },
    select: { totalXp: true, leaves: true },
  })

  const streak = await bumpStreakOnClear(userId, today)

  const lessonsCleared = await prisma.lessonClear.count({ where: { userId } })
  const badgesEarned = await awardBadges(userId, {
    lessonsCleared,
    currentStreak: streak.currentStreak,
    totalXp: updated.totalXp,
    completedReview: true,
    isLessonPerfect: false,
  })

  return { xp, correct, total, stars, streak, totalXp: updated.totalXp, leavesEarned, totalLeaves: updated.leaves, dailyQuest, badgesEarned }
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
  leaves: number
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
        leaves: true,
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
    leaves: u.leaves,
    currentStreak: u.currentStreak,
    bestStreak: u.bestStreak,
    tier: u.tier,
    lessonsClearedTotal: clearsCount,
  }
}

export type LessonProgressMap = Record<string, { stars: number; clearedAt: Date }>

/** 用户每关最佳通关记录（按星级取最高，stars 相同则取最早一次） */
export async function getLessonProgressMap(userId: string): Promise<LessonProgressMap> {
  const clears = await prisma.lessonClear.findMany({
    where: { userId },
    orderBy: [{ lessonId: 'asc' }, { stars: 'desc' }, { clearedAt: 'asc' }],
    select: { lessonId: true, stars: true, clearedAt: true },
  })
  const map: LessonProgressMap = {}
  for (const c of clears) {
    if (!map[c.lessonId]) {
      map[c.lessonId] = { stars: c.stars, clearedAt: c.clearedAt }
    }
  }
  return map
}

export type LeaderRow = {
  rank: number
  userId: string
  nickname: string
  friendCode: string
  tier: number
  weeklyXp: number
}

export async function getWeeklyLeaders(limit = 20): Promise<LeaderRow[]> {
  const users = await prisma.user.findMany({
    where: { weeklyXp: { gt: 0 } },
    orderBy: [{ weeklyXp: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    select: {
      id: true,
      nickname: true,
      friendCode: true,
      tier: true,
      weeklyXp: true,
    },
  })
  return users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    nickname: u.nickname,
    friendCode: u.friendCode,
    tier: u.tier,
    weeklyXp: u.weeklyXp,
  }))
}
