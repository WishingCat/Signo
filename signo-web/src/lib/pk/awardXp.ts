import { prisma } from '@/lib/db'
import { determineWinner, type MatchCore } from './matchEngine'

const PK_DAILY_CAP = 3
const WIN_XP = 20
const LOSE_XP = 15
const DRAW_XP = 10

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export type PkXpAward = {
  aXp: number
  bXp: number
  winnerId: string | null
  reason: NonNullable<MatchCore['endReason']>
}

/** Atomically settle PK XP for both sides, capped at 3/day each.
 *  Idempotency: caller must guarantee endedAt was null before calling
 *  (we transition it inside the same transaction). */
export async function awardPkXp(core: MatchCore): Promise<PkXpAward> {
  const reason = core.endReason ?? 'finished'
  const winnerId = determineWinner(core)
  const date = todayIsoDate()

  return prisma.$transaction(async (tx) => {
    // Lock the match row by checking endedAt — bail out if already settled.
    const existing = await tx.pkMatch.findUnique({ where: { id: core.matchId } })
    if (!existing) throw new Error(`pk.awardXp: match ${core.matchId} not found`)
    if (existing.endedAt) {
      return {
        aXp: existing.aXpAwarded,
        bXp: existing.bXpAwarded,
        winnerId: existing.winnerId,
        reason: (existing.endedReason as PkXpAward['reason']) ?? 'finished',
      }
    }

    async function consumeAndAward(userId: string, xp: number): Promise<number> {
      if (xp <= 0) return 0
      // Atomic count++ if count<3.
      const updated = await tx.pkDailyXp.updateMany({
        where: { userId, date, count: { lt: PK_DAILY_CAP } },
        data: { count: { increment: 1 } },
      })
      let granted: boolean
      if (updated.count === 1) {
        granted = true
      } else {
        // Either no row yet → create with count=1; or row exists but already at cap → no-op.
        const existingRow = await tx.pkDailyXp.findUnique({
          where: { userId_date: { userId, date } },
        })
        if (!existingRow) {
          await tx.pkDailyXp.create({ data: { userId, date, count: 1 } })
          granted = true
        } else {
          granted = false
        }
      }
      if (!granted) return 0
      await tx.user.update({
        where: { id: userId },
        data: { totalXp: { increment: xp }, weeklyXp: { increment: xp } },
      })
      await tx.dailyStat.upsert({
        where: { userId_date: { userId, date } },
        update: { xp: { increment: xp } },
        create: { userId, date, xp },
      })
      return xp
    }

    let aXp = 0
    let bXp = 0
    if (reason === 'quit-a') {
      bXp = await consumeAndAward(core.bId, WIN_XP)
    } else if (reason === 'quit-b') {
      aXp = await consumeAndAward(core.aId, WIN_XP)
    } else if (winnerId === core.aId) {
      aXp = await consumeAndAward(core.aId, WIN_XP)
      bXp = await consumeAndAward(core.bId, LOSE_XP)
    } else if (winnerId === core.bId) {
      aXp = await consumeAndAward(core.aId, LOSE_XP)
      bXp = await consumeAndAward(core.bId, WIN_XP)
    } else {
      aXp = await consumeAndAward(core.aId, DRAW_XP)
      bXp = await consumeAndAward(core.bId, DRAW_XP)
    }

    await tx.pkMatch.update({
      where: { id: core.matchId },
      data: {
        aScore: core.scores[core.aId] ?? 0,
        bScore: core.scores[core.bId] ?? 0,
        aXpAwarded: aXp,
        bXpAwarded: bXp,
        winnerId,
        endedReason: reason,
        endedAt: new Date(),
      },
    })

    return { aXp, bXp, winnerId, reason }
  })
}

export async function getPkDailyCount(userId: string): Promise<number> {
  const date = todayIsoDate()
  const row = await prisma.pkDailyXp.findUnique({
    where: { userId_date: { userId, date } },
  })
  return row?.count ?? 0
}

export const PK_REWARDS = { WIN_XP, LOSE_XP, DRAW_XP, DAILY_CAP: PK_DAILY_CAP }
