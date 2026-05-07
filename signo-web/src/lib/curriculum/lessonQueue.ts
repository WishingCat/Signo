/** Pure logic for the "wrong → requeue at tail, right → pop head" lesson flow.
 *  Extracted so it can be unit-tested without mounting a React tree. */

export type QueueItem = { id: string }

export function advanceQueue<T extends QueueItem>(queue: T[], isCorrect: boolean): T[] {
  if (queue.length === 0) return queue
  if (isCorrect) return queue.slice(1)
  const [head, ...rest] = queue
  return [...rest, head]
}

/** Count of unique questions already answered correctly.
 *  Works only given the original total and current queue length because
 *  incorrect answers keep the item in the queue (just rotated). */
export function correctCount(total: number, queueLength: number): number {
  return Math.max(0, Math.min(total, total - queueLength))
}
