import { z } from 'zod'

export const CreateTeamInput = z.object({
  name: z.string().min(1, '队名不能为空').max(20, '队名最长 20 字'),
})
export type CreateTeamInput = z.infer<typeof CreateTeamInput>

export const InviteByCodeInput = z.object({
  friendCode: z.string().min(1).max(12),
})
export type InviteByCodeInput = z.infer<typeof InviteByCodeInput>

export const RespondInviteInput = z.object({
  inviteId: z.string().min(1),
  accept: z.boolean(),
})
export type RespondInviteInput = z.infer<typeof RespondInviteInput>
