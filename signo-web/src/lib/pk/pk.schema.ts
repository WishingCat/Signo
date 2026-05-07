import { z } from 'zod'

const TimedSec = z.union([z.literal(30), z.literal(60), z.literal(90)])

export const ModeConfigSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('casual') }),
  z.object({ mode: z.literal('timed'), totalSec: TimedSec }),
  z.object({ mode: z.literal('hell') }),
])

export const InviteInput = z.object({
  friendCode: z.string().min(1),
  theme: z.enum(['常用语', '数字', '身体']),
  mode: z.enum(['casual', 'timed', 'hell']),
  modeConfig: ModeConfigSchema,
})
export type InviteInput = z.infer<typeof InviteInput>

export const RespondInviteInput = z.object({
  inviteId: z.string().min(1),
  accept: z.boolean(),
})

export const AnswerInput = z.object({
  qIndex: z.number().int().min(0).max(14),
  choice: z.number().int().min(0).max(3),
})
