import type { StreakDelta } from './streak'
import type { DailyQuestDelta } from './dailyQuest'
import type { EarnedBadge } from '@/lib/badges/service'

export type GradedAnswer = {
  questionId: string
  choice: number
  msSpent: number
  isCorrect: boolean
}

export type ClearResult = {
  xp: number
  correct: number
  total: number
  stars: 1 | 2 | 3
  streak: StreakDelta
  totalXp: number
  /** 本次结算获得的落叶（lessonLeaves / reviewLeaves） */
  leavesEarned: number
  /** 写入后用户的落叶余额 */
  totalLeaves: number
  /** 每日任务判定与奖励（always present after hook runs） */
  dailyQuest: DailyQuestDelta
  badgesEarned?: EarnedBadge[]
}

export type OnLessonClearArgs = {
  userId: string
  lessonId: string
  graded: GradedAnswer[]
  totalInLesson: number
}
