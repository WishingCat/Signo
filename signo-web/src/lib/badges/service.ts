import { prisma } from '@/lib/db'
import { BADGES } from './defs'
import { evaluateBadgeRules, type BadgeContext } from './rules'

export type EarnedBadge = {
  slug: string
  title: string
  description: string
  emoji: string
}

/** 确保 Badge 表里有这 5 枚（幂等；每次调用会 upsert）。 */
export async function ensureBadgesSeeded() {
  for (const b of BADGES) {
    await prisma.badge.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        description: b.description,
        emoji: b.emoji,
        sortOrder: b.sortOrder,
      },
      create: b,
    })
  }
}

/**
 * 根据上下文给用户颁发徽章，返回本次新解锁的徽章。已有的徽章会被跳过（@@unique 保障）。
 */
export async function awardBadges(
  userId: string,
  ctx: BadgeContext,
): Promise<EarnedBadge[]> {
  const candidateSlugs = evaluateBadgeRules(ctx)
  if (candidateSlugs.length === 0) return []

  const candidates = await prisma.badge.findMany({
    where: { slug: { in: candidateSlugs } },
  })
  if (candidates.length === 0) return []

  const existing = await prisma.userBadge.findMany({
    where: { userId, badgeId: { in: candidates.map((b) => b.id) } },
    select: { badgeId: true },
  })
  const have = new Set(existing.map((e) => e.badgeId))

  const toAward = candidates.filter((b) => !have.has(b.id))
  if (toAward.length === 0) return []

  await prisma.userBadge.createMany({
    data: toAward.map((b) => ({ userId, badgeId: b.id })),
  })

  return toAward.map((b) => ({
    slug: b.slug,
    title: b.title,
    description: b.description,
    emoji: b.emoji,
  }))
}

export async function getUserBadges(userId: string): Promise<EarnedBadge[]> {
  const rows = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { unlockedAt: 'desc' },
  })
  return rows.map((r) => ({
    slug: r.badge.slug,
    title: r.badge.title,
    description: r.badge.description,
    emoji: r.badge.emoji,
  }))
}

export async function getAllBadges() {
  return prisma.badge.findMany({ orderBy: { sortOrder: 'asc' } })
}
