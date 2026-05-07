import { SCORING } from '@/config/scoring'
import { ECONOMY } from '@/config/economy'

type GradeSummary = { total: number; correct: number }

export function lessonXp({ total, correct }: GradeSummary): number {
  const perfect = total > 0 && correct === total
  return SCORING.BASE_XP + (perfect ? SCORING.PERFECT_BONUS : 0)
}

export function lessonStars({ total }: GradeSummary): 1 | 2 | 3 {
  // 过关即 3 星：只要这一关有题，完成就满星。
  // 回炉到对机制保证用户到达 onLessonClear 时必定全对；星数不再承担难度评估职责。
  return total > 0 ? 3 : 1
}

/** 通关一关获得的落叶（基础 + 全对加成）。 */
export function lessonLeaves({ total, correct }: GradeSummary): number {
  const perfect = total > 0 && correct === total
  return ECONOMY.LEAVES_PER_LESSON + (perfect ? ECONOMY.LEAVES_PERFECT_BONUS : 0)
}

/** 复习关获得的落叶：每答对 1 题给 1 落叶 + 全对额外奖励。 */
export function reviewLeaves({ total, correct }: GradeSummary): number {
  if (total === 0) return 0
  const base = correct * ECONOMY.LEAVES_REVIEW_PER_CORRECT
  const perfect = correct === total
  return base + (perfect ? ECONOMY.LEAVES_REVIEW_PERFECT_BONUS : 0)
}
