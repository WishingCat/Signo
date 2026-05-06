import { NextResponse } from 'next/server'
import { ClearReviewInput } from '@/lib/curriculum/learn.schema'
import {
  getQuestionsMapByIds,
} from '@/lib/curriculum/service'
import { onReviewClear } from '@/lib/progress/service'
import { getSessionUser } from '@/lib/auth/session'
import { logger } from '@/lib/logger'
import type { GradedAnswer } from '@/lib/progress/types'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = ClearReviewInput.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 })

  try {
    const { answers } = parsed.data
    const ids = answers.map((a) => a.questionId)
    const correctMap = await getQuestionsMapByIds(ids)

    const graded: GradedAnswer[] = answers.map((a) => ({
      questionId: a.questionId,
      choice: a.choice,
      msSpent: a.msSpent,
      isCorrect: correctMap.get(a.questionId) === a.choice,
    }))

    const result = await onReviewClear({ userId: user.id, graded })
    return NextResponse.json(result)
  } catch (err) {
    logger.error({ err }, 'clear-review: service failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
