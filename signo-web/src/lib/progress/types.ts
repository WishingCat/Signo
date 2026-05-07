import type { StreakDelta } from './streak'
import type { DailyQuestDelta } from './dailyQuest'
import type { EarnedBadge } from '@/lib/badges/service'
import type { TeamBonusGrant } from '@/lib/teams/types'

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
  leavesEarned: number
  totalLeaves: number
  dailyQuest: DailyQuestDelta
  /** 本次结算触发的团队加成列表（调用者视角 XP credited） */
  teamBonuses: TeamBonusGrant[]
  badgesEarned?: EarnedBadge[]
}

export type OnLessonClearArgs = {
  userId: string
  lessonId: string
  graded: GradedAnswer[]
  totalInLesson: number
}
