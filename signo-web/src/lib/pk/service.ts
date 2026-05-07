import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import { isFriend } from '@/lib/social/service'
import { buildPkQuestionSet } from './questionBank'
import { createMatchCore } from './matchEngine'
import { spawnMatch } from './matchStore'
import { awardPkXp } from './awardXp'
import type { PkMode, PkTheme, PkQuestionInternal } from './types'
import { TOTAL_QUESTIONS } from './types'

const INVITE_TTL_MS = 60_000

export type InviteCreateResult =
  | { ok: true; inviteId: string; expiresAt: Date }
  | {
      ok: false
      code: 'NOT_FOUND' | 'SELF' | 'NOT_FRIEND' | 'PENDING_EXISTS'
    }

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

function rand(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export async function createInvite(args: {
  inviterId: string
  friendCode: string
  theme: PkTheme
  mode: PkMode
  modeConfig: Record<string, unknown>
}): Promise<InviteCreateResult> {
  const target = await prisma.user.findUnique({
    where: { friendCode: args.friendCode.toUpperCase() },
    select: { id: true },
  })
  if (!target) return { ok: false, code: 'NOT_FOUND' }
  if (target.id === args.inviterId) return { ok: false, code: 'SELF' }
  if (!(await isFriend(args.inviterId, target.id))) return { ok: false, code: 'NOT_FRIEND' }

  const now = new Date()
  // Lazy timeout sweep for any of my pending invites against this user.
  await prisma.pkInvite.updateMany({
    where: {
      inviterId: args.inviterId,
      inviteeId: target.id,
      status: 'pending',
      expiresAt: { lt: now },
    },
    data: { status: 'timeout' },
  })
  const existing = await prisma.pkInvite.findFirst({
    where: { inviterId: args.inviterId, inviteeId: target.id, status: 'pending' },
  })
  if (existing) return { ok: false, code: 'PENDING_EXISTS' }

  const invite = await prisma.pkInvite.create({
    data: {
      inviterId: args.inviterId,
      inviteeId: target.id,
      theme: args.theme,
      mode: args.mode,
      modeConfig: JSON.stringify(args.modeConfig),
      status: 'pending',
      expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
    },
  })
  return { ok: true, inviteId: invite.id, expiresAt: invite.expiresAt }
}

export type InboxInvite = {
  id: string
  inviterId: string
  inviterNickname: string
  inviterFriendCode: string
  inviterTier: number
  theme: string
  mode: string
  modeConfig: string
  expiresAt: Date
}

export async function listInbox(userId: string): Promise<InboxInvite[]> {
  const now = new Date()
  await prisma.pkInvite.updateMany({
    where: { inviteeId: userId, status: 'pending', expiresAt: { lt: now } },
    data: { status: 'timeout' },
  })
  const rows = await prisma.pkInvite.findMany({
    where: { inviteeId: userId, status: 'pending' },
    include: {
      inviter: { select: { id: true, nickname: true, friendCode: true, tier: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((r) => ({
    id: r.id,
    inviterId: r.inviter.id,
    inviterNickname: r.inviter.nickname,
    inviterFriendCode: r.inviter.friendCode,
    inviterTier: r.inviter.tier,
    theme: r.theme,
    mode: r.mode,
    modeConfig: r.modeConfig,
    expiresAt: r.expiresAt,
  }))
}

export type RespondResult =
  | { ok: true; matchId?: string; accepted: boolean }
  | { ok: false; code: 'NOT_FOUND' | 'NOT_INVITEE' | 'EXPIRED' | 'BAD_STATUS' }

export async function respondInvite(args: {
  userId: string
  inviteId: string
  accept: boolean
}): Promise<RespondResult> {
  const invite = await prisma.pkInvite.findUnique({ where: { id: args.inviteId } })
  if (!invite) return { ok: false, code: 'NOT_FOUND' }
  if (invite.inviteeId !== args.userId) return { ok: false, code: 'NOT_INVITEE' }
  if (invite.status !== 'pending') return { ok: false, code: 'BAD_STATUS' }
  if (invite.expiresAt < new Date()) {
    await prisma.pkInvite.update({
      where: { id: invite.id },
      data: { status: 'timeout' },
    })
    return { ok: false, code: 'EXPIRED' }
  }
  if (!args.accept) {
    await prisma.pkInvite.update({
      where: { id: invite.id },
      data: { status: 'declined', respondedAt: new Date() },
    })
    return { ok: true, accepted: false }
  }

  const theme = invite.theme as PkTheme
  const mode = invite.mode as PkMode
  const modeConfig = JSON.parse(invite.modeConfig || '{}') as { totalSec?: number }
  const seed = Date.now() ^ Math.floor(Math.random() * 0xffff)
  const questions: PkQuestionInternal[] = buildPkQuestionSet(theme, rand(seed), TOTAL_QUESTIONS)

  const [aId, bId] = canonicalPair(invite.inviterId, invite.inviteeId)
  const match = await prisma.pkMatch.create({
    data: {
      theme: invite.theme,
      mode: invite.mode,
      modeConfig: JSON.stringify(modeConfig),
      aId, bId,
      questionsJson: JSON.stringify(questions),
    },
  })
  await prisma.pkInvite.update({
    where: { id: invite.id },
    data: { status: 'accepted', matchId: match.id, respondedAt: new Date() },
  })

  const core = createMatchCore({
    matchId: match.id,
    theme: invite.theme,
    mode,
    modeConfig,
    aId, bId,
    questions,
    now: Date.now(),
  })
  spawnMatch(core, async (finalCore) => {
    try {
      await awardPkXp(finalCore)
    } catch {
      // Settle errors are logged elsewhere; surfacing here would crash the timer chain.
    }
  })

  return { ok: true, accepted: true, matchId: match.id }
}

export async function getRecentMatches(userId: string, limit = 10) {
  const rows = await prisma.pkMatch.findMany({
    where: { OR: [{ aId: userId }, { bId: userId }], endedAt: { not: null } },
    orderBy: { endedAt: 'desc' },
    take: limit,
  })
  const otherIds = rows.map((r) => (r.aId === userId ? r.bId : r.aId))
  const others = await prisma.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, nickname: true, friendCode: true, tier: true },
  })
  const byId = new Map(others.map((o) => [o.id, o]))
  return rows.map((r): {
    id: string
    theme: string
    mode: string
    selfScore: number
    oppScore: number
    selfXp: number
    winnerId: string | null
    endedReason: string | null
    endedAt: Date | null
    opponent: { id: string; nickname: string; friendCode: string; tier: number } | undefined
  } => {
    const isA = r.aId === userId
    return {
      id: r.id,
      theme: r.theme,
      mode: r.mode,
      selfScore: isA ? r.aScore : r.bScore,
      oppScore: isA ? r.bScore : r.aScore,
      selfXp: isA ? r.aXpAwarded : r.bXpAwarded,
      winnerId: r.winnerId,
      endedReason: r.endedReason,
      endedAt: r.endedAt,
      opponent: byId.get(isA ? r.bId : r.aId),
    }
  })
}

export type _PrismaTx = Prisma.TransactionClient // re-export for tests if needed
