import { describe, it, expect } from 'vitest'
import {
  listSignsByTheme,
  findSignsByMeaning,
  getSign,
  getMeanings,
  getImageAbsolutePath,
  listThemes,
} from '@/lib/signDb/service'

describe('signDb service', () => {
  it('lists signs for the 3 seeded themes', () => {
    expect(listSignsByTheme('常用语').length).toBeGreaterThanOrEqual(29)
    expect(listSignsByTheme('数字').length).toBe(24)
    expect(listSignsByTheme('身体').length).toBeGreaterThanOrEqual(38)
  })
  it('finds a sign by meaning text', () => {
    const signs = findSignsByMeaning('谢谢')
    expect(signs.length).toBeGreaterThan(0)
    expect(signs[0].theme).toContain('常用语')
  })
  it('fetches meanings for a sign', () => {
    const s = findSignsByMeaning('1')[0]
    expect(s).toBeDefined()
    expect(getMeanings(s.id).some((m) => m.text === '一')).toBe(true)
  })
  it('resolves image absolute path for a known sign', () => {
    const s = findSignsByMeaning('1')[0]
    const abs = getImageAbsolutePath(s.id)
    expect(abs).toBeTruthy()
    expect(abs!.endsWith('.jpg')).toBe(true)
  })
  it('returns null for missing sign', () => {
    expect(getSign(9_999_999)).toBeNull()
    expect(getImageAbsolutePath(9_999_999)).toBeNull()
  })
  it('lists all 31 themes', () => {
    expect(listThemes().length).toBe(31)
  })
})
