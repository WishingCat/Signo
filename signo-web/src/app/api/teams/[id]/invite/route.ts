import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { InviteByCodeInput } from '@/lib/teams/team.schema'
import { inviteByFriendCode } from '@/lib/teams/service'
import { logger } from '@/lib/logger'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const parsed = InviteByCodeInput.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 })
  try {
    const result = await inviteByFriendCode(id, user.id, parsed.data.friendCode)
    if (!result.ok) {
      const msg: Record<string, { status: number; error: string }> = {
        TEAM_NOT_FOUND: { status: 404, error: 'team not found' },
        NOT_MEMBER: { status: 403, error: '你不在这支队伍里' },
        TEAM_FULL: { status: 409, error: '队伍已满员（4 人）' },
        USER_NOT_FOUND: { status: 404, error: '找不到这个好友码' },
        SELF: { status: 400, error: '这是你自己的好友码' },
        ALREADY_MEMBER: { status: 409, error: 'TA 已经在队伍里了' },
      }
      const m = msg[result.code]
      return NextResponse.json({ error: m.error }, { status: m.status })
    }
    return NextResponse.json(result)
  } catch (err) {
    logger.error({ err }, 'teams/invite: failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
