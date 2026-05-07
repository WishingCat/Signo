import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { logger } from '@/lib/logger'
import { RespondInviteInput } from '@/lib/pk/pk.schema'
import { respondInvite } from '@/lib/pk/service'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = RespondInviteInput.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad input' }, { status: 400 })
  }
  try {
    const r = await respondInvite({
      userId: user.id,
      inviteId: parsed.data.inviteId,
      accept: parsed.data.accept,
    })
    if (!r.ok) {
      const status =
        r.code === 'NOT_FOUND' ? 404 :
        r.code === 'NOT_INVITEE' ? 403 :
        r.code === 'EXPIRED' ? 410 : 409
      return NextResponse.json({ error: r.code }, { status })
    }
    return NextResponse.json({ accepted: r.accepted, matchId: r.matchId })
  } catch (err) {
    logger.error({ err }, 'pk.respond: failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
