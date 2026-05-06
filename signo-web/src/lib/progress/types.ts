import type { StreakDelta } from './streak'

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
  /** Phase B 回填 */
  badgesEarned?: string[]
}

export type OnLessonClearArgs = {
  userId: string
  lessonId: string
  graded: GradedAnswer[]
  totalInLesson: number
}
