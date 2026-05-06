import { describe, it, expect } from 'vitest'
import { lessonXp, lessonStars } from '@/lib/curriculum/scoring'

describe('lessonXp', () => {
  it('base xp for any non-empty clear', () => {
    expect(lessonXp({ total: 5, correct: 0 })).toBe(10)
    expect(lessonXp({ total: 5, correct: 3 })).toBe(10)
  })
  it('bonus for full clear', () => {
    expect(lessonXp({ total: 5, correct: 5 })).toBe(15)
  })
  it('no bonus when total is 0 (degenerate)', () => {
    expect(lessonXp({ total: 0, correct: 0 })).toBe(10)
  })
})

describe('lessonStars', () => {
  it('3 stars for perfect', () => {
    expect(lessonStars({ total: 4, correct: 4 })).toBe(3)
  })
  it('2 stars when ratio >= 0.6', () => {
    expect(lessonStars({ total: 5, correct: 3 })).toBe(2)
  })
  it('1 star when ratio < 0.6', () => {
    expect(lessonStars({ total: 5, correct: 2 })).toBe(1)
  })
})
