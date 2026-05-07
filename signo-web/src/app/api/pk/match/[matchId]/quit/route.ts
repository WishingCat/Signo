import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { submitQuit } from '@/lib/pk/matchStore'

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { matchId } = await ctx.params

  const dbMatch = await prisma.pkMatch.findUnique({ where: { id: matchId } })
  if (!dbMatch) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (dbMatch.aId !== user.id && dbMatch.bId !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  try {
    const result = submitQuit(matchId, user.id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 410 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'pk.quit: failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
