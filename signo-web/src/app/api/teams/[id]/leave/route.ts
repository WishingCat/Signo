import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { leaveTeam } from '@/lib/teams/service'
import { logger } from '@/lib/logger'

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  try {
    await leaveTeam(user.id, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'teams/leave: failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
