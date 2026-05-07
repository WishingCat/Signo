import { describe, it, expect } from 'vitest'
import {
  applyAction,
  createMatchCore,
  determineWinner,
} from '@/lib/pk/matchEngine'
import type { PkQuestionInternal } from '@/lib/pk/types'

function fakeQuestions(n = 15): PkQuestionInternal[] {
  return Array.from({ length: n }).map((_, i) => ({
    signId: 1000 + i,
    choices: ['A', 'B', 'C', 'D'],
    answerIndex: i % 4,
    correctMeaning: ['A', 'B', 'C', 'D'][i % 4],
  }))
}

const T0 = 1_000_000_000_000
const make = (mode: 'casual' | 'timed' | 'hell' = 'casual') =>
  createMatchCore({
    matchId: 'm1', theme: '常用语', mode,
    modeConfig: mode === 'timed' ? { totalSec: 60 } : {},
    aId: 'A', bId: 'B', questions: fakeQuestions(),
    now: T0,
  })

describe('matchEngine basic flow', () => {
  it('countdown → in-progress', () => {
    const s = make()
    const r = applyAction(s, { type: 'countdown-end', now: T0 + 3000 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.state.phase).toBe('in-progress')
      expect(r.state.questionStartedAt).toBe(T0 + 3000)
    }
  })

  it('rejects answers during countdown', () => {
    const s = make()
    const r = applyAction(s, { type: 'answer', userId: 'A', qIndex: 0, choice: 0, now: T0 + 500 })
    expect(r.ok).toBe(false)
  })

  it('one-side answer does not advance', () => {
    let s = make()
    s = (applyAction(s, { type: 'countdown-end', now: T0 + 3000 }) as any).state
    const r = applyAction(s, { type: 'answer', userId: 'A', qIndex: 0, choice: 0, now: T0 + 4000 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.advanced).toBe(false)
      expect(r.state.questionIndex).toBe(0)
      expect(r.state.scores.A).toBe(1)
      expect(r.state.scores.B).toBe(0)
    }
  })

  it('both sides answer → advances to next question', () => {
    let s = make()
    s = (applyAction(s, { type: 'countdown-end', now: T0 + 3000 }) as any).state
    s = (applyAction(s, { type: 'answer', userId: 'A', qIndex: 0, choice: 0, now: T0 + 4000 }) as any).state
    const r = applyAction(s, { type: 'answer', userId: 'B', qIndex: 0, choice: 1, now: T0 + 4500 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.advanced).toBe(true)
      expect(r.state.questionIndex).toBe(1)
      expect(r.state.answeredThisRound.size).toBe(0)
      expect(r.state.scores.A).toBe(1)
      expect(r.state.scores.B).toBe(-1) // wrong
    }
  })

  it('rejects same-user double answer with already-answered', () => {
    let s = make()
    s = (applyAction(s, { type: 'countdown-end', now: T0 + 3000 }) as any).state
    s = (applyAction(s, { type: 'answer', userId: 'A', qIndex: 0, choice: 0, now: T0 + 4000 }) as any).state
    const r = applyAction(s, { type: 'answer', userId: 'A', qIndex: 0, choice: 1, now: T0 + 4100 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('already-answered')
  })

  it('rejects wrong qIndex', () => {
    let s = make()
    s = (applyAction(s, { type: 'countdown-end', now: T0 + 3000 }) as any).state
    const r = applyAction(s, { type: 'answer', userId: 'A', qIndex: 5, choice: 0, now: T0 + 4000 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('wrong-qindex')
  })

  it('quit ends match immediately and sets endReason', () => {
    let s = make()
    s = (applyAction(s, { type: 'countdown-end', now: T0 + 3000 }) as any).state
    const r = applyAction(s, { type: 'quit', userId: 'A', now: T0 + 4000 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.ended).toBe(true)
      expect(r.state.phase).toBe('finished')
      expect(r.state.endReason).toBe('quit-a')
      expect(determineWinner(r.state)).toBe('B')
    }
  })

  it('finishes after 15 questions', () => {
    let s = make()
    s = (applyAction(s, { type: 'countdown-end', now: T0 + 3000 }) as any).state
    for (let i = 0; i < 15; i++) {
      s = (applyAction(s, { type: 'answer', userId: 'A', qIndex: i, choice: 0, now: T0 + 3000 + i * 1000 }) as any).state
      s = (applyAction(s, { type: 'answer', userId: 'B', qIndex: i, choice: 0, now: T0 + 3000 + i * 1000 + 100 }) as any).state
    }
    expect(s.phase).toBe('finished')
    expect(s.endReason).toBe('finished')
  })
})

describe('matchEngine timeouts', () => {
  it('hell round-timeout records 0 and advances', () => {
    let s = make('hell')
    s = (applyAction(s, { type: 'countdown-end', now: T0 + 3000 }) as any).state
    const r = applyAction(s, { type: 'round-timeout', now: T0 + 3000 + 5000 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.state.questionIndex).toBe(1)
      expect(r.state.scores.A).toBe(0)
      expect(r.state.scores.B).toBe(0)
    }
  })

  it('timed global-timeout finishes match', () => {
    let s = make('timed')
    s = (applyAction(s, { type: 'countdown-end', now: T0 + 3000 }) as any).state
    const r = applyAction(s, { type: 'global-timeout', now: T0 + 3000 + 60_000 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.state.phase).toBe('finished')
      expect(r.state.endReason).toBe('timeout')
    }
  })
})

describe('determineWinner', () => {
  it('higher score wins', () => {
    const s = { ...make(), phase: 'finished' as const, endReason: 'finished' as const,
      scores: { A: 5, B: 3 } }
    expect(determineWinner(s)).toBe('A')
  })
  it('tie returns null', () => {
    const s = { ...make(), phase: 'finished' as const, endReason: 'finished' as const,
      scores: { A: 4, B: 4 } }
    expect(determineWinner(s)).toBeNull()
  })
})
