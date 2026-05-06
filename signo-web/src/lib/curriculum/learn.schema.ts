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

export const ClearLessonResult = z.object({
  xp: z.number().int(),
  correct: z.number().int(),
  total: z.number().int(),
  stars: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

export type ClearLessonResult = z.infer<typeof ClearLessonResult>
