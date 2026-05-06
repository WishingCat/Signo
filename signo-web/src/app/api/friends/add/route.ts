import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { AddFriendInput } from '@/lib/social/friends.schema'
import { addFriendByCode } from '@/lib/social/service'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = AddFriendInput.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 })

  try {
    const result = await addFriendByCode(user.id, parsed.data.code)
    if (!result.ok) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json({ error: 'no one found with that code' }, { status: 404 })
      }
      if (result.code === 'SELF') {
        return NextResponse.json({ error: 'that is your own code' }, { status: 400 })
      }
    }
    return NextResponse.json(result)
  } catch (err) {
    logger.error({ err }, 'friends/add: failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
