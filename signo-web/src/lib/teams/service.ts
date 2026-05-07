import { prisma } from '@/lib/db'
import { teamBonusBps } from './bonus'
import type {
  TeamDetail,
  TeamInviteForMe,
  TeamMemberSummary,
  TeamSummary,
} from './types'

const MAX_TEAM_SIZE = 4
const MAX_TEAMS_PER_USER = 5

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export type CreateTeamError = 'TOO_MANY_TEAMS'
export type CreateTeamResult =
  | { ok: true; team: { id: string; name: string } }
  | { ok: false; code: CreateTeamError }

export async function createTeam(ownerId: string, name: string): Promise<CreateTeamResult> {
  const existingCount = await prisma.teamMember.count({ where: { userId: ownerId } })
  if (existingCount >= MAX_TEAMS_PER_USER) return { ok: false, code: 'TOO_MANY_TEAMS' }
  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      ownerId,
      members: { create: { userId: ownerId } },
    },
    select: { id: true, name: true },
  })
  return { ok: true, team }
}

export type InviteResultCode =
  | 'TEAM_NOT_FOUND' | 'NOT_MEMBER' | 'TEAM_FULL'
  | 'USER_NOT_FOUND' | 'SELF' | 'ALREADY_MEMBER'

export type InviteResult =
  | { ok: true; invite: { id: string; inviteeNickname: string } }
  | { ok: false; code: InviteResultCode }

export async function inviteByFriendCode(
  teamId: string, inviterId: string, friendCode: string,
): Promise<InviteResult> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  })
  if (!team) return { ok: false, code: 'TEAM_NOT_FOUND' }
  const inviterInTeam = team.members.some((m) => m.userId === inviterId)
  if (!inviterInTeam) return { ok: false, code: 'NOT_MEMBER' }
  if (team.members.length >= MAX_TEAM_SIZE) return { ok: false, code: 'TEAM_FULL' }
  const target = await prisma.user.findUnique({
    where: { friendCode: friendCode.toUpperCase() },
  })
  if (!target) return { ok: false, code: 'USER_NOT_FOUND' }
  if (target.id === inviterId) return { ok: false, code: 'SELF' }
  if (team.members.some((m) => m.userId === target.id)) {
    return { ok: false, code: 'ALREADY_MEMBER' }
  }
  const invite = await prisma.teamInvite.upsert({
    where: { teamId_inviteeId: { teamId, inviteeId: target.id } },
    update: { status: 'pending', inviterId, respondedAt: null, createdAt: new Date() },
    create: { teamId, inviteeId: target.id, inviterId, status: 'pending' },
    select: { id: true },
  })
  return { ok: true, invite: { id: invite.id, inviteeNickname: target.nickname } }
}

export type RespondResultCode = 'INVITE_NOT_FOUND' | 'NOT_YOU' | 'TEAM_FULL' | 'NOT_PENDING'
export type RespondResult = { ok: true } | { ok: false; code: RespondResultCode }

export async function respondInvite(
  userId: string, inviteId: string, accept: boolean,
): Promise<RespondResult> {
  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
    include: { team: { include: { members: true } } },
  })
  if (!invite) return { ok: false, code: 'INVITE_NOT_FOUND' }
  if (invite.inviteeId !== userId) return { ok: false, code: 'NOT_YOU' }
  if (invite.status !== 'pending') return { ok: false, code: 'NOT_PENDING' }
  if (!accept) {
    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: 'declined', respondedAt: new Date() },
    })
    return { ok: true }
  }
  if (invite.team.members.length >= MAX_TEAM_SIZE) {
    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: 'declined', respondedAt: new Date() },
    })
    return { ok: false, code: 'TEAM_FULL' }
  }
  await prisma.$transaction([
    prisma.teamMember.create({ data: { teamId: invite.teamId, userId } }),
    prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: 'accepted', respondedAt: new Date() },
    }),
  ])
  return { ok: true }
}

export async function leaveTeam(userId: string, teamId: string): Promise<void> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { orderBy: { joinedAt: 'asc' } } },
  })
  if (!team) return
  const isMember = team.members.some((m) => m.userId === userId)
  if (!isMember) return
  await prisma.teamMember.deleteMany({ where: { teamId, userId } })
  const remaining = team.members.filter((m) => m.userId !== userId)
  if (remaining.length === 0) {
    // 没人了，清理
    await prisma.teamInvite.deleteMany({ where: { teamId } })
    await prisma.teamBonusEvent.deleteMany({ where: { teamId } })
    await prisma.team.delete({ where: { id: teamId } })
    return
  }
  // 如果 owner 退出，转给最早加入的剩余成员
  if (team.ownerId === userId) {
    await prisma.team.update({
      where: { id: teamId },
      data: { ownerId: remaining[0].userId },
    })
  }
}

export async function listMyTeams(userId: string): Promise<TeamSummary[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          members: true,
          bonuses: { where: { date: todayIso() } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })
  if (memberships.length === 0) return []
  const today = todayIso()
  const allMemberIds = Array.from(
    new Set(memberships.flatMap((m) => m.team.members.map((x) => x.userId))),
  )
  const claimed = await prisma.dailyStat.findMany({
    where: {
      userId: { in: allMemberIds },
      date: today,
      NOT: { dailyQuestClaimedAt: null },
    },
    select: { userId: true },
  })
  const claimedSet = new Set(claimed.map((c) => c.userId))
  return memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    ownerId: m.team.ownerId,
    memberCount: m.team.members.length,
    todayCompletedCount: m.team.members.filter((x) => claimedSet.has(x.userId)).length,
    bonusSettledToday: m.team.bonuses.length > 0,
    createdAt: m.team.createdAt,
  }))
}

export async function getTeam(
  teamId: string, viewerId: string,
): Promise<TeamDetail | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: { user: { select: { id: true, nickname: true, friendCode: true, tier: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      invites: {
        where: { status: 'pending' },
        include: { team: false },
        orderBy: { createdAt: 'desc' },
      },
      bonuses: { where: { date: todayIso() } },
    },
  })
  if (!team) return null
  const today = todayIso()
  const memberIds = team.members.map((m) => m.userId)
  const stats = await prisma.dailyStat.findMany({
    where: { userId: { in: memberIds }, date: today },
    select: { userId: true, dailyQuestClaimedAt: true },
  })
  const claimedSet = new Set(
    stats.filter((s) => s.dailyQuestClaimedAt != null).map((s) => s.userId),
  )
  const members: TeamMemberSummary[] = team.members.map((m) => ({
    userId: m.userId,
    nickname: m.user.nickname,
    friendCode: m.user.friendCode,
    tier: m.user.tier,
    joinedAt: m.joinedAt,
    completedDailyQuestToday: claimedSet.has(m.userId),
  }))

  // pending invites — need invitee nicknames
  const inviteeIds = team.invites.map((i) => i.inviteeId)
  const invitees = inviteeIds.length
    ? await prisma.user.findMany({
        where: { id: { in: inviteeIds } },
        select: { id: true, nickname: true, friendCode: true },
      })
    : []
  const inviteeMap = new Map(invitees.map((u) => [u.id, u]))
  const pendingInvites = team.invites.map((i) => ({
    id: i.id,
    inviteeNickname: inviteeMap.get(i.inviteeId)?.nickname ?? '？',
    inviteeFriendCode: inviteeMap.get(i.inviteeId)?.friendCode ?? '',
    createdAt: i.createdAt,
  }))

  const isMember = members.some((m) => m.userId === viewerId)
  const isOwner = team.ownerId === viewerId
  const todayBonus = team.bonuses[0] ?? null
  return {
    id: team.id,
    name: team.name,
    ownerId: team.ownerId,
    createdAt: team.createdAt,
    members,
    pendingInvites,
    bonusSettledToday: !!todayBonus,
    todayBonusBps: todayBonus?.pctBps ?? null,
    isMember,
    isOwner,
    memberCount: members.length,
    bonusBps: teamBonusBps(members.length),
  }
}

export async function pendingInvitesForUser(userId: string): Promise<TeamInviteForMe[]> {
  const invites = await prisma.teamInvite.findMany({
    where: { inviteeId: userId, status: 'pending' },
    include: {
      team: { include: { members: { select: { userId: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  const inviterIds = Array.from(new Set(invites.map((i) => i.inviterId)))
  const inviters = await prisma.user.findMany({
    where: { id: { in: inviterIds } },
    select: { id: true, nickname: true },
  })
  const inviterMap = new Map(inviters.map((u) => [u.id, u.nickname]))
  return invites.map((i) => ({
    id: i.id,
    teamId: i.teamId,
    teamName: i.team.name,
    inviterNickname: inviterMap.get(i.inviterId) ?? '？',
    currentMemberCount: i.team.members.length,
    createdAt: i.createdAt,
  }))
}
