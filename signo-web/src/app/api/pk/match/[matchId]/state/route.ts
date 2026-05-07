import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getMatch, snapshot } from '@/lib/pk/matchStore'

export async function GET(
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

  const live = getMatch(matchId)
  if (live) {
    return NextResponse.json({
      meta: {
        matchId, theme: dbMatch.theme, mode: dbMatch.mode, modeConfig: dbMatch.modeConfig,
        aId: dbMatch.aId, bId: dbMatch.bId, selfId: user.id,
      },
      state: snapshot(live),
    })
  }

  // Match already finished and disposed from in-memory store.
  return NextResponse.json({
    meta: {
      matchId, theme: dbMatch.theme, mode: dbMatch.mode, modeConfig: dbMatch.modeConfig,
      aId: dbMatch.aId, bId: dbMatch.bId, selfId: user.id,
    },
    state: {
      type: 'state',
      phase: 'finished',
      questionIndex: 14,
      scores: { [dbMatch.aId]: dbMatch.aScore, [dbMatch.bId]: dbMatch.bScore },
      countdownRemainingMs: 0,
      currentQuestion: null,
      questionDeadlineMs: null,
      endReason: dbMatch.endedReason,
      winnerId: dbMatch.winnerId,
    },
  })
}
