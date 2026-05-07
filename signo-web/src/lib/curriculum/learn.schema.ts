import { z } from 'zod'

export const ClearLessonInput = z.object({
  lessonId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        choice: z.number().int().min(0),
        msSpent: z.number().int().nonnegative(),
      }),
    )
    .min(1),
})

export type ClearLessonInput = z.infer<typeof ClearLessonInput>

export const ClearReviewInput = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        choice: z.number().int().min(0),
        msSpent: z.number().int().nonnegative(),
      }),
    )
    .min(1),
})

export type ClearReviewInput = z.infer<typeof ClearReviewInput>

export const ClearLessonResult = z.object({
  xp: z.number().int(),
  correct: z.number().int(),
  total: z.number().int(),
  stars: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  totalXp: z.number().int(),
  leavesEarned: z.number().int(),
  totalLeaves: z.number().int(),
  streak: z.object({
    currentStreak: z.number().int(),
    bestStreak: z.number().int(),
    lastClearDate: z.string(),
    event: z.enum(['continued', 'reset', 'started', 'same-day']),
  }),
  dailyQuest: z.object({
    event: z.enum(['already-claimed', 'not-yet', 'just-crossed']),
    bonusXp: z.number().int(),
    bonusLeaves: z.number().int(),
    todayXp: z.number().int(),
    threshold: z.number().int(),
  }),
  teamBonuses: z.array(z.object({
    teamId: z.string(),
    teamName: z.string(),
    pctBps: z.number().int(),
    xpCredited: z.number().int(),
    memberCount: z.number().int(),
  })),
  badgesEarned: z.array(z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    emoji: z.string(),
  })).optional(),
})

export type ClearLessonResult = z.infer<typeof ClearLessonResult>
