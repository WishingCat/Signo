import { perQuestionDeadlineMs, scoreAnswer } from './modes'
import {
  COUNTDOWN_MS,
  TOTAL_QUESTIONS,
  type AnswerRecord,
  type MatchPhase,
  type PkMode,
  type PkPlayerScores,
  type PkQuestionInternal,
} from './types'

/** Pure state for a single match. No timers, no subscribers — those live in matchStore. */
export type MatchCore = {
  matchId: string
  theme: string
  mode: PkMode
  modeConfig: { totalSec?: number }
  aId: string
  bId: string
  questions: PkQuestionInternal[]
  phase: MatchPhase
  questionIndex: number
  questionStartedAt: number // ms epoch (server time)
  scores: PkPlayerScores
  perRound: Record<string, AnswerRecord[]>
  answeredThisRound: Set<string>
  endReason?: 'finished' | 'quit-a' | 'quit-b' | 'timeout'
  startedAt: number // ms epoch when match was created (countdown started)
}

export function createMatchCore(args: {
  matchId: string
  theme: string
  mode: PkMode
  modeConfig: { totalSec?: number }
  aId: string
  bId: string
  questions: PkQuestionInternal[]
  now: number
}): MatchCore {
  return {
    matchId: args.matchId,
    theme: args.theme,
    mode: args.mode,
    modeConfig: args.modeConfig,
    aId: args.aId,
    bId: args.bId,
    questions: args.questions,
    phase: 'countdown',
    questionIndex: 0,
    questionStartedAt: args.now + COUNTDOWN_MS,
    scores: { [args.aId]: 0, [args.bId]: 0 },
    perRound: { [args.aId]: [], [args.bId]: [] },
    answeredThisRound: new Set(),
    startedAt: args.now,
  }
}

export type Action =
  | { type: 'countdown-end'; now: number }
  | { type: 'answer'; userId: string; qIndex: number; choice: number; now: number }
  | { type: 'round-timeout'; now: number } // hell mode per-question timeout
  | { type: 'global-timeout'; now: number } // timed mode total deadline
  | { type: 'quit'; userId: string; now: number }

export type ApplyResult =
  | { ok: true; state: MatchCore; advanced: boolean; ended: boolean }
  | { ok: false; error: 'phase-mismatch' | 'wrong-qindex' | 'already-answered' | 'unknown-user' }

function advance(state: MatchCore, now: number): MatchCore {
  const next = state.questionIndex + 1
  if (next >= TOTAL_QUESTIONS) {
    return { ...state, phase: 'finished', endReason: state.endReason ?? 'finished' }
  }
  return {
    ...state,
    questionIndex: next,
    questionStartedAt: now,
    answeredThisRound: new Set(),
  }
}

function recordTimeoutForUnanswered(state: MatchCore, now: number): MatchCore {
  const next = { ...state, perRound: { ...state.perRound } }
  for (const uid of [state.aId, state.bId]) {
    if (state.answeredThisRound.has(uid)) continue
    const delta = scoreAnswer(state.mode, false, now - state.questionStartedAt, true)
    next.perRound[uid] = [
      ...next.perRound[uid],
      {
        qIndex: state.questionIndex,
        choice: -1,
        msSpent: now - state.questionStartedAt,
        scoreDelta: delta,
        isCorrect: false,
      },
    ]
    if (delta !== 0) {
      next.scores = { ...next.scores, [uid]: (next.scores[uid] ?? 0) + delta }
    }
  }
  return next
}

export function applyAction(state: MatchCore, action: Action): ApplyResult {
  if (state.phase === 'finished') return { ok: false, error: 'phase-mismatch' }

  if (action.type === 'countdown-end') {
    if (state.phase !== 'countdown') return { ok: false, error: 'phase-mismatch' }
    return {
      ok: true,
      state: { ...state, phase: 'in-progress', questionStartedAt: action.now },
      advanced: true,
      ended: false,
    }
  }

  if (action.type === 'quit') {
    const reason: 'quit-a' | 'quit-b' = action.userId === state.aId ? 'quit-a' : 'quit-b'
    return {
      ok: true,
      state: { ...state, phase: 'finished', endReason: reason },
      advanced: false,
      ended: true,
    }
  }

  if (state.phase !== 'in-progress') return { ok: false, error: 'phase-mismatch' }

  if (action.type === 'global-timeout') {
    let next = recordTimeoutForUnanswered(state, action.now)
    next = { ...next, phase: 'finished', endReason: 'timeout' }
    return { ok: true, state: next, advanced: false, ended: true }
  }

  if (action.type === 'round-timeout') {
    if (perQuestionDeadlineMs(state.mode) === null) return { ok: false, error: 'phase-mismatch' }
    const recorded = recordTimeoutForUnanswered(state, action.now)
    const advanced = advance(recorded, action.now)
    return { ok: true, state: advanced, advanced: true, ended: advanced.phase === 'finished' }
  }

  // type === 'answer'
  if (action.userId !== state.aId && action.userId !== state.bId) {
    return { ok: false, error: 'unknown-user' }
  }
  if (action.qIndex !== state.questionIndex) return { ok: false, error: 'wrong-qindex' }
  if (state.answeredThisRound.has(action.userId)) {
    return { ok: false, error: 'already-answered' }
  }

  const q = state.questions[state.questionIndex]
  const isCorrect = action.choice === q.answerIndex
  const msSpent = Math.max(0, action.now - state.questionStartedAt)
  const delta = scoreAnswer(state.mode, isCorrect, msSpent, false)
  const newAnswered = new Set(state.answeredThisRound)
  newAnswered.add(action.userId)
  let next: MatchCore = {
    ...state,
    answeredThisRound: newAnswered,
    perRound: {
      ...state.perRound,
      [action.userId]: [
        ...state.perRound[action.userId],
        { qIndex: state.questionIndex, choice: action.choice, msSpent, scoreDelta: delta, isCorrect },
      ],
    },
    scores: { ...state.scores, [action.userId]: (state.scores[action.userId] ?? 0) + delta },
  }
  // Both players answered this round → advance immediately.
  if (newAnswered.size === 2) {
    next = advance(next, action.now)
    return { ok: true, state: next, advanced: true, ended: next.phase === 'finished' }
  }
  return { ok: true, state: next, advanced: false, ended: false }
}

export function determineWinner(state: MatchCore): string | null {
  if (state.endReason === 'quit-a') return state.bId
  if (state.endReason === 'quit-b') return state.aId
  const a = state.scores[state.aId] ?? 0
  const b = state.scores[state.bId] ?? 0
  if (a > b) return state.aId
  if (b > a) return state.bId
  return null
}
