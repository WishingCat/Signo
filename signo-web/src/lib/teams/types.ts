export type TeamSummary = {
  id: string
  name: string
  ownerId: string
  memberCount: number
  /** 今日完成每日任务的成员数 */
  todayCompletedCount: number
  /** 是否当日已结算过加成 */
  bonusSettledToday: boolean
  createdAt: Date
}

export type TeamMemberSummary = {
  userId: string
  nickname: string
  friendCode: string
  tier: number
  joinedAt: Date
  completedDailyQuestToday: boolean
}

export type TeamPendingInvite = {
  id: string
  inviteeNickname: string
  inviteeFriendCode: string
  createdAt: Date
}

export type TeamDetail = {
  id: string
  name: string
  ownerId: string
  createdAt: Date
  members: TeamMemberSummary[]
  pendingInvites: TeamPendingInvite[]
  bonusSettledToday: boolean
  todayBonusBps: number | null
  isMember: boolean
  isOwner: boolean
  memberCount: number
  bonusBps: number | null // eligible team bonus given current size (or null if not 2-4)
}

export type TeamInviteForMe = {
  id: string
  teamId: string
  teamName: string
  inviterNickname: string
  currentMemberCount: number
  createdAt: Date
}

/** 单次结算的每个队伍加成事件（返给调用用户视角） */
export type TeamBonusGrant = {
  teamId: string
  teamName: string
  pctBps: number // 1900 / 2000 / 2100
  /** 本次加成给 **调用者** 的 XP */
  xpCredited: number
  memberCount: number
}
