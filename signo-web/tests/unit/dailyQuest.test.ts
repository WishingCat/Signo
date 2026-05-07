import { describe, it, expect } from 'vitest'
import { computeDailyQuest } from '@/lib/progress/dailyQuest'

describe('computeDailyQuest', () => {
  it('returns not-yet when below threshold', () => {
    const r = computeDailyQuest({ previousXp: 0, newXp: 50, alreadyClaimed: false })
    expect(r.event).toBe('not-yet')
    expect(r.bonusXp).toBe(0)
    expect(r.bonusLeaves).toBe(0)
  })

  it('returns just-crossed when reaching threshold for the first time', () => {
    const r = computeDailyQuest({ previousXp: 80, newXp: 100, alreadyClaimed: false })
    expect(r.event).toBe('just-crossed')
    expect(r.bonusXp).toBe(20)
    expect(r.bonusLeaves).toBe(50)
    expect(r.todayXp).toBe(120) // 100 + 20 bonus
  })

  it('returns just-crossed when going from below to above threshold in one shot', () => {
    const r = computeDailyQuest({ previousXp: 0, newXp: 150, alreadyClaimed: false })
    expect(r.event).toBe('just-crossed')
    expect(r.bonusXp).toBe(20)
    expect(r.bonusLeaves).toBe(50)
  })

  it('returns already-claimed when alreadyClaimed=true regardless of XP', () => {
    const r = computeDailyQuest({ previousXp: 200, newXp: 250, alreadyClaimed: true })
    expect(r.event).toBe('already-claimed')
    expect(r.bonusXp).toBe(0)
    expect(r.bonusLeaves).toBe(0)
  })

  it('handles edge of previously >= threshold but unclaimed (defensive)', () => {
    const r = computeDailyQuest({ previousXp: 110, newXp: 130, alreadyClaimed: false })
    expect(r.event).toBe('just-crossed')
    expect(r.bonusXp).toBe(20)
  })

  it('threshold value is 100 from ECONOMY config', () => {
    expect(computeDailyQuest({ previousXp: 99, newXp: 99, alreadyClaimed: false }).event).toBe('not-yet')
    expect(computeDailyQuest({ previousXp: 99, newXp: 100, alreadyClaimed: false }).event).toBe('just-crossed')
  })
})
