import { describe, it, expect } from 'vitest'
import { advanceQueue, correctCount } from '@/lib/curriculum/lessonQueue'

type Q = { id: string }
const q = (id: string): Q => ({ id })

describe('advanceQueue', () => {
  it('drops the head on correct', () => {
    const next = advanceQueue([q('a'), q('b'), q('c')], true)
    expect(next.map((x) => x.id)).toEqual(['b', 'c'])
  })
  it('rotates head to tail on wrong', () => {
    const next = advanceQueue([q('a'), q('b'), q('c')], false)
    expect(next.map((x) => x.id)).toEqual(['b', 'c', 'a'])
  })
  it('preserves order when only 1 item and correct → empty', () => {
    expect(advanceQueue([q('a')], true)).toEqual([])
  })
  it('keeps 1-item queue intact when wrong (tail==head)', () => {
    const next = advanceQueue([q('a')], false)
    expect(next.map((x) => x.id)).toEqual(['a'])
  })
  it('is a no-op on empty queue', () => {
    expect(advanceQueue([], true)).toEqual([])
    expect(advanceQueue([], false)).toEqual([])
  })
  it('does not mutate the input array', () => {
    const input = [q('a'), q('b')]
    advanceQueue(input, false)
    expect(input.map((x) => x.id)).toEqual(['a', 'b'])
  })
})

describe('correctCount', () => {
  it('is total - remaining', () => {
    expect(correctCount(5, 3)).toBe(2)
  })
  it('clamps to 0', () => {
    expect(correctCount(3, 10)).toBe(0)
  })
  it('clamps to total', () => {
    expect(correctCount(3, -1)).toBe(3)
  })
})
