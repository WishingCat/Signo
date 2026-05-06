import { prisma } from '@/lib/db'

export type ClearSnapshot = {
  nickname: string
  friendCode: string
  tier: number
  stars: number
  clearedAt: Date
}

export type ChallengeComparison = {
  lessonId: string
  lessonTitle: string
  challenger: ClearSnapshot | null
  opponent: ClearSnapshot | null
  /** 'challenger' | 'opponent' | 'tie' | 'incomplete' */
  outcome: 'challenger' | 'opponent' | 'tie' | 'incomplete'
  /** 对应 outcome 的说明 */
  summary: string
}

async function latestClear(userId: string, lessonId: string) {
  const clear = await prisma.lessonClear.findFirst({
    where: { userId, lessonId },
    orderBy: [{ stars: 'desc' }, { clearedAt: 'asc' }],
  })
  if (!clear) return null
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true, friendCode: true, tier: true },
  })
  if (!user) return null
  return {
    nickname: user.nickname,
    friendCode: user.friendCode,
    tier: user.tier,
    stars: clear.stars,
    clearedAt: clear.clearedAt,
  }
}

export async function buildChallenge(args: {
  lessonId: string
  challengerCode: string
  opponentUserId: string | null
}): Promise<ChallengeComparison | null> {
  const [lesson, challenger] = await Promise.all([
    prisma.lesson.findUnique({ where: { id: args.lessonId } }),
    prisma.user.findUnique({
      where: { friendCode: args.challengerCode.toUpperCase() },
      select: { id: true },
    }),
  ])
  if (!lesson || !challenger) return null

  const [challengerClear, opponentClear] = await Promise.all([
    latestClear(challenger.id, args.lessonId),
    args.opponentUserId ? latestClear(args.opponentUserId, args.lessonId) : Promise.resolve(null),
  ])

  let outcome: ChallengeComparison['outcome']
  let summary: string
  if (!challengerClear && !opponentClear) {
    outcome = 'incomplete'
    summary = '你们两个都还没打过这一关。'
  } else if (!opponentClear) {
    outcome = 'incomplete'
    summary = `${challengerClear!.nickname} 已经拿到 ${challengerClear!.stars} 星——换你了。`
  } else if (!challengerClear) {
    outcome = 'incomplete'
    summary = `你已经拿到 ${opponentClear.stars} 星。等对方先来挑战。`
  } else if (challengerClear.stars === opponentClear.stars) {
    outcome = 'tie'
    summary = `两人都是 ${challengerClear.stars} 星——平手。`
  } else if (challengerClear.stars > opponentClear.stars) {
    outcome = 'challenger'
    summary = `${challengerClear.nickname} 略胜一筹：${challengerClear.stars} vs ${opponentClear.stars}。`
  } else {
    outcome = 'opponent'
    summary = `你赢了：${opponentClear.stars} vs ${challengerClear.stars}。`
  }

  return {
    lessonId: args.lessonId,
    lessonTitle: lesson.title,
    challenger: challengerClear,
    opponent: opponentClear,
    outcome,
    summary,
  }
}
