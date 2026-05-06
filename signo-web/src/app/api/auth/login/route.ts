import { NextResponse } from 'next/server'
import { LoginInput } from '@/lib/auth/auth.schema'
import { authenticateUser } from '@/lib/auth/service'
import { signSession } from '@/lib/auth/jwt'
import { SESSION_COOKIE } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = LoginInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad input' }, { status: 400 })
  }

  const result = await authenticateUser(parsed.data)
  if (!result.ok) {
    return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })
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
    logger.error({ err }, 'login: failed to sign session')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
