import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot, TIER_MASCOT, MASCOT_LABEL } from '@/components/forest/Mascot'
import { getSessionUser } from '@/lib/auth/session'
import { listFriends } from '@/lib/social/service'
import { AddFriendForm } from '@/components/social/AddFriendForm'

export default async function FriendsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const friends = await listFriends(user.id)

  return (
    <div className="py-6 space-y-4 bloom-in">
      <div>
        <h1 className="brush-text text-[24px]">林友</h1>
        <p className="text-[12px] text-bark/60">
          把这片森林分享给信任的人。
        </p>
      </div>

      <Card tilt="left" density="cozy">
        <div className="text-[12px] tracking-[0.2em] uppercase text-bark/50 mb-1">你的好友码</div>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] tabular-nums tracking-[0.3em] text-ink font-medium">
            {user.friendCode}
          </span>
          <span className="text-[12px] text-bark/55">让朋友输入这段即可加你</span>
        </div>
        <SketchDivider className="my-4" />
        <div className="relative">
          <AddFriendForm />
        </div>
      </Card>

      <div>
        <h2 className="text-[13px] text-bark/70 mb-2 mt-6">
          你的林友 <span className="tabular-nums">({friends.length})</span>
        </h2>
        {friends.length === 0 ? (
          <Card className="text-center py-8">
            <Mascot name="firefly" className="h-16 w-16 mx-auto text-ink opacity-70" />
            <p className="text-[13px] text-bark/60 mt-2">还没有林友。</p>
            <p className="text-[12px] text-bark/45 mt-1">把你的好友码分享给身边的朋友。</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => {
              const mascot = TIER_MASCOT[Math.min(Math.max(f.tier, 1), 7)]
              return (
                <li key={f.id}>
                  <a
                    href={`/profile/${f.friendCode}`}
                    className="group flex items-center gap-3 rounded-[14px] px-3 py-2.5 bg-cream/70 hover:bg-cream hover:-translate-y-[1px] transition-all border border-bark/10 shadow-[0_2px_0_rgba(74,58,44,0.06)]"
                  >
                    <Mascot name={mascot} className="h-10 w-10 text-bark shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-ink truncate">{f.nickname}</div>
                      <div className="text-[11px] text-bark/55 mt-0.5">
                        {MASCOT_LABEL[mascot]} · L{f.tier} · 本周 {f.weeklyXp} XP
                      </div>
                    </div>
                    <div className="text-[14px] text-hazel group-hover:translate-x-0.5 transition-transform">
                      去 →
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="pt-4">
        <a href="/"><Button variant="ink" className="w-full">回到森林</Button></a>
      </div>
    </div>
  )
}
