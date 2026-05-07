import { NextResponse } from 'next/server'
import { z } from 'zod'
import { gradeQuestionDetailed } from '@/lib/curriculum/service'
import { getSessionUser } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

const Input = z.object({
  questionId: z.string().min(1),
  choice: z.number().int().min(0).max(3),
})

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const parsed = Input.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad input' }, { status: 400 })
  }
  try {
    const result = await gradeQuestionDetailed(parsed.data.questionId, parsed.data.choice)
    if (!result) return NextResponse.json({ error: 'question not found' }, { status: 404 })
    return NextResponse.json(result)
  } catch (err) {
    logger.error({ err }, 'grade-question: service failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
