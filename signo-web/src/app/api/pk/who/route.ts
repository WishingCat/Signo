import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

/** Lightweight opponent lookup for PK match HUD.
 *  Returns nickname only. No friend-relation gating because both parties of a
 *  match (PkMatch.aId/bId) are by definition opponents — we just need a label. */
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

  // Authorize: requesting user must share at least one PkMatch with the target.
  const shared = await prisma.pkMatch.findFirst({
    where: {
      OR: [
        { aId: user.id, bId: userId },
        { aId: userId, bId: user.id },
      ],
    },
    select: { id: true },
  })
  if (!shared) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true, friendCode: true, tier: true },
  })
  if (!u) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(u)
}
