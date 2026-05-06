import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from './password'
import type { SessionUser } from './types'
import type { LoginInput, RegisterInput } from './auth.schema'

export type AuthError =
  | { ok: false; code: 'USERNAME_TAKEN' }
  | { ok: false; code: 'INVALID_CREDENTIALS' }

export type AuthSuccess = { ok: true; user: SessionUser }
export type AuthResult = AuthSuccess | AuthError

function friendCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function toSessionUser(u: {
  id: string
  username: string
  nickname: string
  friendCode: string
  tier: number
  role: string
}): SessionUser {
  return {
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    friendCode: u.friendCode,
    tier: u.tier,
    role: u.role === 'admin' ? 'admin' : 'user',
  }
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const exists = await prisma.user.findUnique({
    where: { username: input.username },
  })
  if (exists) return { ok: false, code: 'USERNAME_TAKEN' }

  const passwordHash = await hashPassword(input.password)
  const created = await prisma.user.create({
    data: {
      username: input.username,
      nickname: input.nickname,
      passwordHash,
      friendCode: friendCode(),
    },
  })
  return { ok: true, user: toSessionUser(created) }
}

export async function authenticateUser(input: LoginInput): Promise<AuthResult> {
  const u = await prisma.user.findUnique({ where: { username: input.username } })
  if (!u) return { ok: false, code: 'INVALID_CREDENTIALS' }
  const okPw = await verifyPassword(input.password, u.passwordHash)
  if (!okPw) return { ok: false, code: 'INVALID_CREDENTIALS' }
  return { ok: true, user: toSessionUser(u) }
}
