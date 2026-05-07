import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { getQuestionsMapForLesson } from '@/lib/curriculum/service'

/** Test-only helper: reveals the correct answerIndex for every question in a lesson.
 *  Gated to non-production so Playwright in dev can play through deterministically
 *  without depending on fixed answerIndex positions. */
export async function GET(req: Request) {
  if (env().NODE_ENV === 'production') {
    return new Response('not found', { status: 404 })
  }
  const url = new URL(req.url)
  const lessonId = url.searchParams.get('lessonId')
  if (!lessonId) {
    return NextResponse.json({ error: 'missing lessonId' }, { status: 400 })
  }
  const map = await getQuestionsMapForLesson(lessonId)
  return NextResponse.json(Object.fromEntries(map))
}
