import {
  getMeanings,
  getImageAbsolutePath,
  listSignsByTheme,
} from '@/lib/signDb/service'
import type { PkQuestionInternal, PkTheme } from './types'

function pickN<T>(pool: T[], n: number, rand: () => number): T[] {
  const copy = pool.slice()
  const out: T[] = []
  while (out.length < n && copy.length) {
    const i = Math.floor(rand() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Build a 15-question topic PK set from sign_themed.db. Pure (given rand). */
export function buildPkQuestionSet(
  theme: PkTheme,
  rand: () => number,
  size = 15,
): PkQuestionInternal[] {
  const all = listSignsByTheme(theme).filter(
    (s) => getImageAbsolutePath(s.id) !== null,
  )
  const labelOf = (signId: number): string | null => {
    const ms = getMeanings(signId)
    return ms.length > 0 ? ms[0].text : null
  }
  const candidates = all
    .map((s) => ({ signId: s.id, label: labelOf(s.id) }))
    .filter((c): c is { signId: number; label: string } => c.label !== null)

  if (candidates.length < size) {
    throw new Error(
      `pk.questionBank: theme "${theme}" has only ${candidates.length} usable signs, need ${size}`,
    )
  }
  if (candidates.length < size + 3) {
    throw new Error(
      `pk.questionBank: theme "${theme}" needs at least ${size + 3} signs for distractors`,
    )
  }

  const allLabels = Array.from(new Set(candidates.map((c) => c.label)))
  const chosen = pickN(candidates, size, rand)

  return chosen.map(({ signId, label }) => {
    const distractorPool = allLabels.filter((l) => l !== label)
    const distractors = pickN(distractorPool, 3, rand)
    const choices = shuffle([label, ...distractors], rand)
    return {
      signId,
      choices,
      answerIndex: choices.indexOf(label),
      correctMeaning: label,
    }
  })
}
