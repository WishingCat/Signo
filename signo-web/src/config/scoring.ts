/**
 * 课程评分配置。调整此处即可改变 XP / 星级规则，函数签名保持不变。
 */
export const SCORING = {
  BASE_XP: 10,
  PERFECT_BONUS: 5,
  STAR_PERFECT_THRESHOLD: 1.0,
  STAR_PASSING_THRESHOLD: 0.6,
} as const
