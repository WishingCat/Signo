import { describe, it, expect } from 'vitest'
import { computeStreak } from '@/lib/progress/streak'

describe('computeStreak', () => {
  const today = '2026-05-06'

  it('starts streak from 1 when never cleared', () => {
    expect(computeStreak({ today, lastClearDate: null, currentStreak: 0, bestStreak: 0 }))
      .toEqual({ currentStreak: 1, bestStreak: 1, lastClearDate: today, event: 'started' })
  })

  it('keeps streak on same-day clear', () => {
    expect(computeStreak({ today, lastClearDate: today, currentStreak: 7, bestStreak: 7 }))
      .toEqual({ currentStreak: 7, bestStreak: 7, lastClearDate: today, event: 'same-day' })
  })

  it('increments streak when yesterday was last clear', () => {
    expect(computeStreak({ today, lastClearDate: '2026-05-05', currentStreak: 3, bestStreak: 5 }))
      .toEqual({ currentStreak: 4, bestStreak: 5, lastClearDate: today, event: 'continued' })
  })

  it('updates bestStreak when current surpasses best', () => {
    const r = computeStreak({ today, lastClearDate: '2026-05-05', currentStreak: 9, bestStreak: 9 })
    expect(r).toEqual({ currentStreak: 10, bestStreak: 10, lastClearDate: today, event: 'continued' })
  })

  it('resets streak to 1 when gap exists', () => {
    expect(computeStreak({ today, lastClearDate: '2026-05-02', currentStreak: 12, bestStreak: 12 }))
      .toEqual({ currentStreak: 1, bestStreak: 12, lastClearDate: today, event: 'reset' })
  })

  it('handles month boundary correctly', () => {
    expect(computeStreak({ today: '2026-06-01', lastClearDate: '2026-05-31', currentStreak: 2, bestStreak: 2 }))
      .toEqual({ currentStreak: 3, bestStreak: 3, lastClearDate: '2026-06-01', event: 'continued' })
  })
})
