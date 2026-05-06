import { z } from 'zod'

export const RegisterInput = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, 'username: letters/digits/underscore only'),
  password: z.string().min(6).max(72),
  nickname: z.string().min(1).max(20),
})

export const LoginInput = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof RegisterInput>
export type LoginInput = z.infer<typeof LoginInput>
