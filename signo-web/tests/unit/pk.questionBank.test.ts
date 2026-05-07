import { describe, it, expect } from 'vitest'
import { buildPkQuestionSet } from '@/lib/pk/questionBank'

function seeded(seed = 7) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('pk.buildPkQuestionSet', () => {
  it.each(['常用语', '数字', '身体'] as const)('builds 15 questions for %s', (theme) => {
    const qs = buildPkQuestionSet(theme, seeded(42))
    expect(qs.length).toBe(15)
    for (const q of qs) {
      expect(q.choices.length).toBe(4)
      expect(new Set(q.choices).size).toBe(4)
      expect(q.answerIndex).toBeGreaterThanOrEqual(0)
      expect(q.answerIndex).toBeLessThanOrEqual(3)
      expect(q.choices[q.answerIndex]).toBe(q.correctMeaning)
      expect(q.signId).toBeGreaterThan(0)
    }
    const ids = qs.map((q) => q.signId)
    expect(new Set(ids).size).toBe(ids.length) // all distinct signs
  })
  it('different rands produce different sets', () => {
    const a = buildPkQuestionSet('数字', seeded(1)).map((q) => q.signId).join(',')
    const b = buildPkQuestionSet('数字', seeded(99)).map((q) => q.signId).join(',')
    expect(a).not.toBe(b)
  })
})
