import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { RespondInviteInput } from '@/lib/teams/team.schema'
import { respondInvite } from '@/lib/teams/service'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const parsed = RespondInviteInput.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 })
  try {
    const result = await respondInvite(user.id, parsed.data.inviteId, parsed.data.accept)
    if (!result.ok) {
      const msg: Record<string, { status: number; error: string }> = {
        INVITE_NOT_FOUND: { status: 404, error: 'invite not found' },
        NOT_YOU: { status: 403, error: '这不是发给你的邀请' },
        TEAM_FULL: { status: 409, error: '队伍已满员' },
        NOT_PENDING: { status: 410, error: '已响应过' },
      }
      const m = msg[result.code]
      return NextResponse.json({ error: m.error }, { status: m.status })
    }
    return NextResponse.json(result)
  } catch (err) {
    logger.error({ err }, 'teams/respond: failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
