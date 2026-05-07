import {
  applyAction,
  type Action,
  type ApplyResult,
  type MatchCore,
  determineWinner,
} from './matchEngine'
import { perQuestionDeadlineMs } from './modes'
import { COUNTDOWN_MS, type PkPlayerScores, type PkQuestionPublic } from './types'

export type MatchEvent =
  | {
      type: 'state'
      phase: MatchCore['phase']
      questionIndex: number
      scores: PkPlayerScores
      countdownRemainingMs: number
      currentQuestion: PkQuestionPublic | null
      questionDeadlineMs: number | null
      endReason?: MatchCore['endReason']
      winnerId?: string | null
    }
  | { type: 'countdown'; remaining: 3 | 2 | 1 | 0 }
  | { type: 'question'; index: number; signId: number; choices: string[]; deadlineMs: number | null }
  | {
      type: 'answered'
      userId: string
      qIndex: number
      isCorrect: boolean
      scoreDelta: number
      scores: PkPlayerScores
    }
  | {
      type: 'finished'
      reason: NonNullable<MatchCore['endReason']>
      scores: PkPlayerScores
      winnerId: string | null
    }

type Subscriber = (e: MatchEvent) => void

type Slot = {
  core: MatchCore
  subscribers: Set<Subscriber>
  countdownTimers: Set<NodeJS.Timeout>
  roundTimer: NodeJS.Timeout | null
  globalTimer: NodeJS.Timeout | null
  onFinished: ((core: MatchCore) => void | Promise<void>) | null
}

const STORE = new Map<string, Slot>()

function broadcast(slot: Slot, e: MatchEvent) {
  for (const s of slot.subscribers) {
    try { s(e) } catch {}
  }
}

function publicQuestion(core: MatchCore): PkQuestionPublic | null {
  const q = core.questions[core.questionIndex]
  if (!q) return null
  return { signId: q.signId, choices: q.choices }
}

function questionDeadline(core: MatchCore): number | null {
  const ms = perQuestionDeadlineMs(core.mode)
  if (ms === null) return null
  return core.questionStartedAt + ms
}

function emitQuestion(slot: Slot) {
  const q = publicQuestion(slot.core)
  if (!q) return
  broadcast(slot, {
    type: 'question',
    index: slot.core.questionIndex,
    signId: q.signId,
    choices: q.choices,
    deadlineMs: questionDeadline(slot.core),
  })
}

function clearRoundTimer(slot: Slot) {
  if (slot.roundTimer) {
    clearTimeout(slot.roundTimer)
    slot.roundTimer = null
  }
}

function clearAllTimers(slot: Slot) {
  for (const t of slot.countdownTimers) clearTimeout(t)
  slot.countdownTimers.clear()
  clearRoundTimer(slot)
  if (slot.globalTimer) {
    clearTimeout(slot.globalTimer)
    slot.globalTimer = null
  }
}

function scheduleRoundTimer(slot: Slot) {
  clearRoundTimer(slot)
  if (slot.core.phase !== 'in-progress') return
  const ms = perQuestionDeadlineMs(slot.core.mode)
  if (ms === null) return
  slot.roundTimer = setTimeout(() => {
    runAction(slot, { type: 'round-timeout', now: Date.now() })
  }, ms)
}

function scheduleGlobalTimer(slot: Slot) {
  if (slot.globalTimer) return
  if (slot.core.mode !== 'timed') return
  const totalSec = slot.core.modeConfig.totalSec ?? 60
  slot.globalTimer = setTimeout(() => {
    runAction(slot, { type: 'global-timeout', now: Date.now() })
  }, totalSec * 1000)
}

function runAction(slot: Slot, action: Action): ApplyResult {
  const before = slot.core
  const result = applyAction(slot.core, action)
  if (!result.ok) return result
  slot.core = result.state

  if (action.type === 'answer') {
    const last = slot.core.perRound[action.userId].at(-1)
    if (last) {
      broadcast(slot, {
        type: 'answered',
        userId: action.userId,
        qIndex: last.qIndex,
        isCorrect: last.isCorrect,
        scoreDelta: last.scoreDelta,
        scores: { ...slot.core.scores },
      })
    }
  }

  const enteredInProgress = before.phase === 'countdown' && slot.core.phase === 'in-progress'
  const movedQuestion =
    before.phase === 'in-progress' &&
    slot.core.phase === 'in-progress' &&
    before.questionIndex !== slot.core.questionIndex

  if (enteredInProgress) {
    emitQuestion(slot)
    scheduleRoundTimer(slot)
    scheduleGlobalTimer(slot)
  } else if (movedQuestion) {
    emitQuestion(slot)
    scheduleRoundTimer(slot)
  }

  if (slot.core.phase === 'finished') {
    clearAllTimers(slot)
    const winnerId = determineWinner(slot.core)
    broadcast(slot, {
      type: 'finished',
      reason: slot.core.endReason ?? 'finished',
      scores: { ...slot.core.scores },
      winnerId,
    })
    if (slot.onFinished) {
      Promise.resolve(slot.onFinished(slot.core)).catch(() => {})
    }
  }
  return result
}

export function spawnMatch(
  core: MatchCore,
  onFinished?: (core: MatchCore) => void | Promise<void>,
) {
  if (STORE.has(core.matchId)) return
  const slot: Slot = {
    core,
    subscribers: new Set(),
    countdownTimers: new Set(),
    roundTimer: null,
    globalTimer: null,
    onFinished: onFinished ?? null,
  }
  STORE.set(core.matchId, slot)

  // Countdown ticks: 3, 2, 1 (each at offsets 0s, 1s, 2s from now), then end at 3s.
  for (const r of [3, 2, 1] as const) {
    const offsetMs = (3 - r) * 1000
    const t = setTimeout(() => broadcast(slot, { type: 'countdown', remaining: r }), offsetMs)
    slot.countdownTimers.add(t)
  }
  const tEnd = setTimeout(() => {
    broadcast(slot, { type: 'countdown', remaining: 0 })
    runAction(slot, { type: 'countdown-end', now: Date.now() })
  }, COUNTDOWN_MS)
  slot.countdownTimers.add(tEnd)
}

export function getMatch(matchId: string): MatchCore | null {
  return STORE.get(matchId)?.core ?? null
}

export function snapshot(core: MatchCore): MatchEvent {
  return {
    type: 'state',
    phase: core.phase,
    questionIndex: core.questionIndex,
    scores: { ...core.scores },
    countdownRemainingMs:
      core.phase === 'countdown'
        ? Math.max(0, core.startedAt + COUNTDOWN_MS - Date.now())
        : 0,
    currentQuestion: core.phase === 'in-progress' ? publicQuestion(core) : null,
    questionDeadlineMs: core.phase === 'in-progress' ? questionDeadline(core) : null,
    endReason: core.endReason,
    winnerId: core.phase === 'finished' ? determineWinner(core) : null,
  }
}

export function subscribe(matchId: string, fn: Subscriber): () => void {
  const slot = STORE.get(matchId)
  if (!slot) return () => {}
  slot.subscribers.add(fn)
  fn(snapshot(slot.core))
  return () => { slot.subscribers.delete(fn) }
}

export function submitAnswer(
  matchId: string,
  userId: string,
  qIndex: number,
  choice: number,
): ApplyResult | { ok: false; error: 'no-match' } {
  const slot = STORE.get(matchId)
  if (!slot) return { ok: false, error: 'no-match' }
  return runAction(slot, { type: 'answer', userId, qIndex, choice, now: Date.now() })
}

export function submitQuit(
  matchId: string,
  userId: string,
): ApplyResult | { ok: false; error: 'no-match' } {
  const slot = STORE.get(matchId)
  if (!slot) return { ok: false, error: 'no-match' }
  return runAction(slot, { type: 'quit', userId, now: Date.now() })
}

export function disposeMatch(matchId: string) {
  const slot = STORE.get(matchId)
  if (!slot) return
  clearAllTimers(slot)
  STORE.delete(matchId)
}

/** Tests only. */
export function __resetStore() {
  for (const id of [...STORE.keys()]) disposeMatch(id)
}
