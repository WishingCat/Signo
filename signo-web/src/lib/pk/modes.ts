import {
  HELL_FAST_MS,
  HELL_PER_QUESTION_MS,
  type PkMode,
} from './types'

/** Pure scoring fn. msSpent is server-measured (Date.now() - questionStartedAt) — never trust client. */
export function scoreAnswer(
  mode: PkMode,
  isCorrect: boolean,
  msSpent: number,
  timedOut: boolean,
): number {
  if (mode === 'hell') {
    if (timedOut || !isCorrect) return 0
    return msSpent < HELL_FAST_MS ? 10 : 5
  }
  // casual + timed share scoring: +1 / -1 / 0(timeout)
  if (timedOut) return 0
  return isCorrect ? 1 : -1
}

/** Determines if a per-question hard timeout exists for this mode. */
export function perQuestionDeadlineMs(mode: PkMode): number | null {
  return mode === 'hell' ? HELL_PER_QUESTION_MS : null
}
