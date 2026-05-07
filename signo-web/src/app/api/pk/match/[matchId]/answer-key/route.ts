import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { prisma } from '@/lib/db'

/** Test-only: exposes the in-DB question set + answer indexes for a match,
 *  so Playwright can drive 双 context PK 自动答题. 404 in production. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> },
) {
  if (env().NODE_ENV === 'production') {
    return new Response('not found', { status: 404 })
  }
  const { matchId } = await ctx.params
  const match = await prisma.pkMatch.findUnique({
    where: { id: matchId },
    select: { questionsJson: true },
  })
  if (!match) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const questions = JSON.parse(match.questionsJson) as Array<{
    signId: number
    choices: string[]
    answerIndex: number
  }>
  return NextResponse.json({ answerKey: questions.map((q) => q.answerIndex) })
}
