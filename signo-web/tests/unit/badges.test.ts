import { describe, it, expect } from 'vitest'
import { evaluateBadgeRules } from '@/lib/badges/rules'

describe('evaluateBadgeRules', () => {
  const base = {
    lessonsCleared: 0,
    currentStreak: 0,
    totalXp: 0,
    completedReview: false,
    isLessonPerfect: false,
  }

  it('awards first-clear on first lesson', () => {
    expect(evaluateBadgeRules({ ...base, lessonsCleared: 1 })).toContain('first-clear')
  })

  it('awards first-perfect on perfect clear', () => {
    expect(evaluateBadgeRules({ ...base, lessonsCleared: 1, isLessonPerfect: true }))
      .toEqual(expect.arrayContaining(['first-clear', 'first-perfect']))
  })

  it('awards streak-3 at 3-day streak', () => {
    expect(evaluateBadgeRules({ ...base, currentStreak: 3 })).toContain('streak-3')
    expect(evaluateBadgeRules({ ...base, currentStreak: 2 })).not.toContain('streak-3')
  })

  it('awards xp-100 when totalXp reaches 100', () => {
    expect(evaluateBadgeRules({ ...base, totalXp: 100 })).toContain('xp-100')
    expect(evaluateBadgeRules({ ...base, totalXp: 99 })).not.toContain('xp-100')
  })

  it('awards reviewer on review clear', () => {
    expect(evaluateBadgeRules({ ...base, completedReview: true })).toContain('reviewer')
  })

  it('does not award anything on empty context', () => {
    expect(evaluateBadgeRules(base)).toEqual([])
  })
})
