import { NextResponse } from 'next/server'
import { ClearLessonInput } from '@/lib/curriculum/learn.schema'
import {
  gradeAnswer,
  getQuestionsMapForLesson,
} from '@/lib/curriculum/service'
import { onLessonClear } from '@/lib/progress/service'
import { getSessionUser } from '@/lib/auth/session'
import { logger } from '@/lib/logger'
import type { GradedAnswer } from '@/lib/progress/types'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const parsed = ClearLessonInput.safeParse(
    await req.json().catch(() => null),
  )
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad input' }, { status: 400 })
  }

  const { lessonId, answers } = parsed.data

  try {
    const correctMap = await getQuestionsMapForLesson(lessonId)
    if (correctMap.size === 0) {
      return NextResponse.json({ error: 'lesson not found' }, { status: 404 })
    }

    const graded: GradedAnswer[] = []
    for (const a of answers) {
      const { correct } = await gradeAnswer(a.questionId, a.choice)
      graded.push({
        questionId: a.questionId,
        choice: a.choice,
        msSpent: a.msSpent,
        isCorrect: correct,
      })
    }

    const result = await onLessonClear({
      userId: user.id,
      lessonId,
      graded,
      totalInLesson: correctMap.size,
    })
    return NextResponse.json(result)
  } catch (err) {
    logger.error({ err }, 'clear-lesson: service failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
