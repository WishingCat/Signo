import { describe, it, expect } from 'vitest'
import { teamBonusBps, computeBonusXp } from '@/lib/teams/bonus'

describe('teamBonusBps', () => {
  it('2 人 → 1900 bps (+19%)', () => expect(teamBonusBps(2)).toBe(1900))
  it('3 人 → 2000 bps (+20%)', () => expect(teamBonusBps(3)).toBe(2000))
  it('4 人 → 2100 bps (+21%)', () => expect(teamBonusBps(4)).toBe(2100))
  it('1 人（队伍还未凑够）→ null', () => expect(teamBonusBps(1)).toBeNull())
  it('5 人（超过上限）→ null', () => expect(teamBonusBps(5)).toBeNull())
  it('0 人 → null', () => expect(teamBonusBps(0)).toBeNull())
})

describe('computeBonusXp', () => {
  it('100 XP × 19% → 19', () => expect(computeBonusXp(100, 1900)).toBe(19))
  it('200 XP × 20% → 40', () => expect(computeBonusXp(200, 2000)).toBe(40))
  it('99 XP × 19% → 18 (floor 18.81)', () => expect(computeBonusXp(99, 1900)).toBe(18))
  it('0 XP → 0', () => expect(computeBonusXp(0, 1900)).toBe(0))
  it('negative XP (defensive) → 0', () => expect(computeBonusXp(-10, 1900)).toBe(0))
})
