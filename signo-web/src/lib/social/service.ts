import { prisma } from '@/lib/db'

export type FriendSummary = {
  id: string
  nickname: string
  friendCode: string
  tier: number
  totalXp: number
  weeklyXp: number
  currentStreak: number
}

export type PublicProfile = {
  id: string
  nickname: string
  friendCode: string
  tier: number
  totalXp: number
  bestStreak: number
  currentStreak: number
  lessonsClearedTotal: number
  badges: Array<{ slug: string; title: string; emoji: string }>
  /** 同 viewerId 的关系：self / friend / stranger */
  relation: 'self' | 'friend' | 'stranger'
}

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export type AddFriendResult =
  | { ok: true; friend: { id: string; nickname: string; friendCode: string; tier: number } }
  | { ok: false; code: 'NOT_FOUND' | 'SELF' }

export async function addFriendByCode(
  userId: string,
  targetCode: string,
): Promise<AddFriendResult> {
  const target = await prisma.user.findUnique({ where: { friendCode: targetCode.toUpperCase() } })
  if (!target) return { ok: false, code: 'NOT_FOUND' }
  if (target.id === userId) return { ok: false, code: 'SELF' }

  const [a, b] = canonicalPair(userId, target.id)
  await prisma.friendship.upsert({
    where: { userAId_userBId: { userAId: a, userBId: b } },
    update: {},
    create: { userAId: a, userBId: b },
  })
  return {
    ok: true,
    friend: {
      id: target.id,
      nickname: target.nickname,
      friendCode: target.friendCode,
      tier: target.tier,
    },
  }
}

export async function removeFriend(userId: string, friendUserId: string) {
  const [a, b] = canonicalPair(userId, friendUserId)
  await prisma.friendship.deleteMany({
    where: { userAId: a, userBId: b },
  })
}

export async function listFriends(userId: string): Promise<FriendSummary[]> {
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { createdAt: 'desc' },
  })
  const ids = rows.map((r) => (r.userAId === userId ? r.userBId : r.userAId))
  if (ids.length === 0) return []
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true, nickname: true, friendCode: true, tier: true,
      totalXp: true, weeklyXp: true, currentStreak: true,
    },
  })
  return users.map((u) => ({ ...u }))
}

export async function isFriend(userId: string, otherId: string): Promise<boolean> {
  if (userId === otherId) return false
  const [a, b] = canonicalPair(userId, otherId)
  const row = await prisma.friendship.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  })
  return !!row
}

export async function getPublicProfileByCode(
  friendCode: string,
  viewerId: string | null,
): Promise<PublicProfile | null> {
  const user = await prisma.user.findUnique({
    where: { friendCode: friendCode.toUpperCase() },
    select: {
      id: true,
      nickname: true,
      friendCode: true,
      tier: true,
      totalXp: true,
      bestStreak: true,
      currentStreak: true,
    },
  })
  if (!user) return null

  const [clearsCount, badgeRows] = await Promise.all([
    prisma.lessonClear.count({ where: { userId: user.id } }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
      orderBy: { badge: { sortOrder: 'asc' } },
    }),
  ])

  let relation: 'self' | 'friend' | 'stranger' = 'stranger'
  if (viewerId) {
    if (viewerId === user.id) relation = 'self'
    else if (await isFriend(viewerId, user.id)) relation = 'friend'
  }

  return {
    ...user,
    lessonsClearedTotal: clearsCount,
    badges: badgeRows.map((r) => ({
      slug: r.badge.slug,
      title: r.badge.title,
      emoji: r.badge.emoji,
    })),
    relation,
  }
}
