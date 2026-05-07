/** PK domain shared types. Pure TS — no React, no Prisma here. */

export type PkTheme = '常用语' | '数字' | '身体'
export const PK_THEMES: PkTheme[] = ['常用语', '数字', '身体']

export type PkMode = 'casual' | 'timed' | 'hell'
export const PK_MODES: PkMode[] = ['casual', 'timed', 'hell']

export type PkTimedSec = 30 | 60 | 90

export type PkModeConfig =
  | { mode: 'casual' }
  | { mode: 'timed'; totalSec: PkTimedSec }
  | { mode: 'hell' }

/** Hidden from clients during the match. */
export type PkQuestionInternal = {
  signId: number
  choices: string[]
  answerIndex: number
  correctMeaning: string
}

/** Shape sent to the client (no answer). */
export type PkQuestionPublic = {
  signId: number
  choices: string[]
}

export type MatchPhase = 'countdown' | 'in-progress' | 'finished'

export type PkPlayerScores = Record<string, number>

export type AnswerRecord = {
  qIndex: number
  choice: number
  msSpent: number
  scoreDelta: number
  isCorrect: boolean
}

export const TOTAL_QUESTIONS = 15
export const COUNTDOWN_MS = 3000
export const HELL_PER_QUESTION_MS = 5000
export const HELL_FAST_MS = 3000
