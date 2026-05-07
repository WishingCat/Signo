import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { AnswerInput } from '@/lib/pk/pk.schema'
import { submitAnswer } from '@/lib/pk/matchStore'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ matchId: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { matchId } = await ctx.params

  const parsed = AnswerInput.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad input' }, { status: 400 })
  }

  const dbMatch = await prisma.pkMatch.findUnique({ where: { id: matchId } })
  if (!dbMatch) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (dbMatch.aId !== user.id && dbMatch.bId !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const result = submitAnswer(matchId, user.id, parsed.data.qIndex, parsed.data.choice)
    if (!result.ok) {
      const status =
        result.error === 'no-match' ? 410 :
        result.error === 'wrong-qindex' ? 409 :
        result.error === 'already-answered' ? 409 : 400
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'pk.answer: failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
