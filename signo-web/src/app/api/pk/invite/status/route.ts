import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

/** Lightweight poll for the inviter side to detect accept/decline/timeout. */
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const inviteId = url.searchParams.get('inviteId')
  if (!inviteId) return NextResponse.json({ error: 'missing inviteId' }, { status: 400 })

  const invite = await prisma.pkInvite.findUnique({ where: { id: inviteId } })
  if (!invite) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (invite.inviterId !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  // Lazy timeout flip.
  if (invite.status === 'pending' && invite.expiresAt < new Date()) {
    await prisma.pkInvite.update({
      where: { id: invite.id },
      data: { status: 'timeout' },
    })
    return NextResponse.json({ status: 'timeout' })
  }
  return NextResponse.json({
    status: invite.status,
    matchId: invite.matchId,
  })
}
