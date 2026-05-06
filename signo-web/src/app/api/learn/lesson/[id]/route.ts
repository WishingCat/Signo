import { NextResponse } from 'next/server'
import { getQuestionsForLesson } from '@/lib/curriculum/service'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const questions = await getQuestionsForLesson(id)
  return NextResponse.json(questions)
}
