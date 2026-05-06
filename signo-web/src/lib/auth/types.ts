export type SessionPayload = { uid: string }

export type SessionUser = {
  id: string
  username: string
  nickname: string
  friendCode: string
  tier: number
  role: 'user' | 'admin'
}
