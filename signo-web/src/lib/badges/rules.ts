export type BadgeContext = {
  /** 本次事件之后的累计通关数（含本次） */
  lessonsCleared: number
  /** 当前连胜 */
  currentStreak: number
  /** 最新 totalXp */
  totalXp: number
  /** 本次是否为复习关结算 */
  completedReview: boolean
  /** 本次正课是否满分（复习关传 false） */
  isLessonPerfect: boolean
}

/**
 * 纯函数：根据快照返回应颁发的徽章 slug 列表（不考虑重复，去重交给 service 层）。
 */
export function evaluateBadgeRules(ctx: BadgeContext): string[] {
  const out: string[] = []
  if (ctx.lessonsCleared >= 1) out.push('first-clear')
  if (ctx.isLessonPerfect) out.push('first-perfect')
  if (ctx.currentStreak >= 3) out.push('streak-3')
  if (ctx.totalXp >= 100) out.push('xp-100')
  if (ctx.completedReview) out.push('reviewer')
  return out
}
