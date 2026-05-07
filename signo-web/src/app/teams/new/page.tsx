import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot } from '@/components/forest/Mascot'
import { getSessionUser } from '@/lib/auth/session'
import { CreateTeamForm } from '@/components/teams/CreateTeamForm'

export default async function NewTeamPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return (
    <div className="py-8 space-y-5 bloom-in">
      <div className="text-center">
        <Mascot name="fox" className="h-20 w-20 mx-auto text-bark" />
        <h1 className="brush-text text-[26px] mt-2">开辟新队伍</h1>
        <p className="text-[12px] text-bark/60 mt-1">
          邀请 1–3 位林友一同赶路。
        </p>
      </div>

      <Card tilt="left" density="cozy">
        <CreateTeamForm />
        <SketchDivider className="my-4 opacity-60" />
        <ul className="text-[12px] text-bark/60 space-y-1.5 leading-5">
          <li>· 队伍最多 4 人，你作为队长自动加入</li>
          <li>· 队员每日任务（100 XP）全员达成 → 触发团队加成</li>
          <li>· 2 人 +19% · 3 人 +20% · 4 人 +21%，按各自当天 XP 计算</li>
          <li>· 每支队伍每天只结算一次，不会重复发放</li>
        </ul>
      </Card>

      <div className="pt-2">
        <Link href="/teams">
          <Button variant="ink" className="w-full">回到队伍列表</Button>
        </Link>
      </div>
    </div>
  )
}
