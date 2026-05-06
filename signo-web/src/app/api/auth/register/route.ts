import { NextResponse } from 'next/server'
import { RegisterInput } from '@/lib/auth/auth.schema'
import { registerUser } from '@/lib/auth/service'
import { signSession } from '@/lib/auth/jwt'
import { SESSION_COOKIE } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = RegisterInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad input' }, { status: 400 })
  }

  const result = await registerUser(parsed.data)
  if (!result.ok) {
    if (result.code === 'USERNAME_TAKEN') {
      return NextResponse.json({ error: 'username taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'auth error' }, { status: 400 })
  }

  try {
    const token = await signSession({ uid: result.user.id })
    const res = NextResponse.json({
      id: result.user.id,
      nickname: result.user.nickname,
    })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (err) {
    logger.error({ err }, 'register: failed to sign session')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
