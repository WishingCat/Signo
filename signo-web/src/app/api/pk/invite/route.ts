import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { logger } from '@/lib/logger'
import { InviteInput } from '@/lib/pk/pk.schema'
import { createInvite } from '@/lib/pk/service'
import type { PkMode, PkTheme } from '@/lib/pk/types'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = InviteInput.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad input' }, { status: 400 })
  }
  // Discriminated union check is enforced by ModeConfigSchema.
  if (parsed.data.modeConfig.mode !== parsed.data.mode) {
    return NextResponse.json({ error: 'mode/modeConfig mismatch' }, { status: 400 })
  }
  try {
    const result = await createInvite({
      inviterId: user.id,
      friendCode: parsed.data.friendCode,
      theme: parsed.data.theme as PkTheme,
      mode: parsed.data.mode as PkMode,
      modeConfig: parsed.data.modeConfig,
    })
    if (!result.ok) {
      const status =
        result.code === 'NOT_FOUND' ? 404 :
        result.code === 'PENDING_EXISTS' ? 409 : 400
      return NextResponse.json({ error: result.code }, { status })
    }
    return NextResponse.json({ inviteId: result.inviteId, expiresAt: result.expiresAt })
  } catch (err) {
    logger.error({ err }, 'pk.invite: failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
