import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { CreateTeamInput } from '@/lib/teams/team.schema'
import { createTeam } from '@/lib/teams/service'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const parsed = CreateTeamInput.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 })
  try {
    const result = await createTeam(user.id, parsed.data.name)
    if (!result.ok) {
      if (result.code === 'TOO_MANY_TEAMS') {
        return NextResponse.json({ error: '最多同时在 5 个队伍中' }, { status: 409 })
      }
    }
    return NextResponse.json(result)
  } catch (err) {
    logger.error({ err }, 'teams/create: failed')
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
