import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifySession } from './jwt'
import type { SessionUser } from './types'

export const SESSION_COOKIE = 'signo_session'

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = await verifySession(token)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.uid } })
  if (!u) return null
  return {
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    friendCode: u.friendCode,
    tier: u.tier,
    role: u.role === 'admin' ? 'admin' : 'user',
  }
}
