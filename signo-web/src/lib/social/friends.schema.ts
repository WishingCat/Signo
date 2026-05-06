import { z } from 'zod'

export const AddFriendInput = z.object({
  code: z.string().min(1).max(12),
})

export type AddFriendInput = z.infer<typeof AddFriendInput>
