import { describe, it, expect } from 'vitest'
import { scoreAnswer, perQuestionDeadlineMs } from '@/lib/pk/modes'

describe('pk.scoreAnswer', () => {
  it('casual: +1 / -1 / 0', () => {
    expect(scoreAnswer('casual', true, 1234, false)).toBe(1)
    expect(scoreAnswer('casual', false, 1234, false)).toBe(-1)
    expect(scoreAnswer('casual', false, 9999, true)).toBe(0)
  })
  it('timed: +1 / -1 / 0 (timeout regardless of correctness)', () => {
    expect(scoreAnswer('timed', true, 500, false)).toBe(1)
    expect(scoreAnswer('timed', false, 500, false)).toBe(-1)
    expect(scoreAnswer('timed', true, 500, true)).toBe(0)
  })
  it('hell: <3000ms correct → 10', () => {
    expect(scoreAnswer('hell', true, 2999, false)).toBe(10)
    expect(scoreAnswer('hell', true, 100, false)).toBe(10)
  })
  it('hell: 3000-5000ms correct → 5', () => {
    expect(scoreAnswer('hell', true, 3000, false)).toBe(5)
    expect(scoreAnswer('hell', true, 4999, false)).toBe(5)
  })
  it('hell: wrong → 0 regardless of speed', () => {
    expect(scoreAnswer('hell', false, 100, false)).toBe(0)
    expect(scoreAnswer('hell', false, 4000, false)).toBe(0)
  })
  it('hell: timeout → 0', () => {
    expect(scoreAnswer('hell', false, 5000, true)).toBe(0)
    expect(scoreAnswer('hell', true, 5000, true)).toBe(0)
  })
})

describe('pk.perQuestionDeadlineMs', () => {
  it('hell has 5000ms per-question deadline', () => {
    expect(perQuestionDeadlineMs('hell')).toBe(5000)
  })
  it('casual / timed have no per-question deadline', () => {
    expect(perQuestionDeadlineMs('casual')).toBeNull()
    expect(perQuestionDeadlineMs('timed')).toBeNull()
  })
})
