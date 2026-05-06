import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from '@/lib/auth/jwt'

describe('jwt session', () => {
  it('roundtrips payload', async () => {
    const t = await signSession({ uid: 'user-1' })
    const p = await verifySession(t)
    expect(p?.uid).toBe('user-1')
  })

  it('rejects tampered token', async () => {
    const t = await signSession({ uid: 'user-1' })
    expect(await verifySession(t + 'x')).toBeNull()
  })

  it('rejects gibberish', async () => {
    expect(await verifySession('not-a-jwt')).toBeNull()
  })
})
