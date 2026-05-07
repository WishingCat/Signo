import { describe, it, expect } from 'vitest'
import { lessonXp, lessonStars, lessonLeaves, reviewLeaves } from '@/lib/curriculum/scoring'

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
  it('3 stars whenever the lesson has at least one question (过关即 3 星)', () => {
    expect(lessonStars({ total: 4, correct: 4 })).toBe(3)
    expect(lessonStars({ total: 5, correct: 3 })).toBe(3)
    expect(lessonStars({ total: 5, correct: 0 })).toBe(3)
  })
  it('1 star for degenerate empty lesson', () => {
    expect(lessonStars({ total: 0, correct: 0 })).toBe(1)
  })
})

describe('lessonLeaves', () => {
  it('base 5 落叶 for any non-perfect clear', () => {
    expect(lessonLeaves({ total: 4, correct: 0 })).toBe(5)
    expect(lessonLeaves({ total: 4, correct: 3 })).toBe(5)
  })
  it('perfect bonus +5 → 10 落叶', () => {
    expect(lessonLeaves({ total: 4, correct: 4 })).toBe(10)
  })
  it('handles total=0 gracefully', () => {
    expect(lessonLeaves({ total: 0, correct: 0 })).toBe(5)
  })
})

describe('reviewLeaves', () => {
  it('1 落叶 per correct answer', () => {
    expect(reviewLeaves({ total: 6, correct: 4 })).toBe(4)
  })
  it('perfect review +2 bonus', () => {
    expect(reviewLeaves({ total: 6, correct: 6 })).toBe(8)
  })
  it('zero-total review yields 0', () => {
    expect(reviewLeaves({ total: 0, correct: 0 })).toBe(0)
  })
})
