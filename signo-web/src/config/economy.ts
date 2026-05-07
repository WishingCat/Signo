/**
 * 经济系统配置（落叶货币 + 每日任务奖励）。新增数值在此处一处调整。
 */
export const ECONOMY = {
  /** 通关一关基础落叶 */
  LEAVES_PER_LESSON: 5,
  /** 通关全对额外落叶 */
  LEAVES_PERFECT_BONUS: 5,
  /** 复习关每对一题落叶（每答对 1 题给 1 落叶） */
  LEAVES_REVIEW_PER_CORRECT: 1,
  /** 复习关全对额外落叶 */
  LEAVES_REVIEW_PERFECT_BONUS: 2,

  /** 每日任务阈值：当日累计 XP 达到此值即触发 */
  DAILY_QUEST_THRESHOLD: 100,
  /** 每日任务奖励 XP */
  DAILY_QUEST_BONUS_XP: 20,
  /** 每日任务奖励落叶 */
  DAILY_QUEST_BONUS_LEAVES: 50,
} as const
