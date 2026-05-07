import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { listInbox } from '@/lib/pk/service'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const invites = await listInbox(user.id)
  return NextResponse.json({ invites })
}
