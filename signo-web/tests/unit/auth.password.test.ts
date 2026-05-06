import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('password', () => {
  it('hashes and verifies correctly', async () => {
    const h = await hashPassword('hunter22')
    expect(await verifyPassword('hunter22', h)).toBe(true)
    expect(await verifyPassword('wrong', h)).toBe(false)
  })

  it('produces different hashes for same password (salted)', async () => {
    const a = await hashPassword('samepw')
    const b = await hashPassword('samepw')
    expect(a).not.toBe(b)
    expect(await verifyPassword('samepw', a)).toBe(true)
    expect(await verifyPassword('samepw', b)).toBe(true)
  })
})
