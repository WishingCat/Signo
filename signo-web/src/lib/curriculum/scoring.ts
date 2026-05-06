import { SCORING } from '@/config/scoring'

type GradeSummary = { total: number; correct: number }

export function lessonXp({ total, correct }: GradeSummary): number {
  const perfect = total > 0 && correct === total
  return SCORING.BASE_XP + (perfect ? SCORING.PERFECT_BONUS : 0)
}

export function lessonStars({ total, correct }: GradeSummary): 1 | 2 | 3 {
  if (total === 0) return 1
  const ratio = correct / total
  if (ratio >= SCORING.STAR_PERFECT_THRESHOLD) return 3
  if (ratio >= SCORING.STAR_PASSING_THRESHOLD) return 2
  return 1
}
