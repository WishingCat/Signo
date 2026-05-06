import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot, TIER_MASCOT, MASCOT_LABEL } from '@/components/forest/Mascot'
import { StreakFlame } from '@/components/forest/StreakFlame'
import { getSessionUser } from '@/lib/auth/session'
import { getUserProgress } from '@/lib/progress/service'
import { listFriends } from '@/lib/social/service'

export default async function MePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const [progress, friends] = await Promise.all([
    getUserProgress(user.id),
    listFriends(user.id),
  ])

  const mascot = TIER_MASCOT[Math.min(Math.max(progress.tier, 1), 7)]

  return (
    <div className="py-6 space-y-5 bloom-in">
      <Card tilt="left" tape density="cozy">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <span
              className="absolute inset-0 rounded-full -z-0"
              style={{ background: 'radial-gradient(circle, rgba(143,166,127,0.4) 0%, transparent 70%)' }}
            />
            <Mascot name={mascot} className="h-20 w-20 text-bark relative" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="brush-text text-[24px] leading-tight truncate">{user.nickname}</h1>
            <p className="text-[12px] text-bark/60 mt-0.5">
              <span className="text-moss font-medium">{MASCOT_LABEL[mascot]}</span> · L{progress.tier}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-oat border border-bark/15 px-3 py-1">
              <span className="text-[10px] tracking-[0.2em] uppercase text-bark/50">好友码</span>
              <span className="text-[12px] tracking-[0.25em] text-ink font-medium tabular-nums">
                {user.friendCode}
              </span>
            </div>
          </div>
        </div>

        <SketchDivider className="my-4" />

        <div className="grid grid-cols-3 gap-2">
          <Stat label="今日" value={`+${progress.todayXp}`} unit="XP" accent />
          <Stat label="累计" value={progress.totalXp.toString()} unit="XP" />
          <Stat label="本周" value={progress.weeklyXp.toString()} unit="XP" />
          <FlameStat days={progress.currentStreak} />
          <Stat label="最长" value={`${progress.bestStreak}`} unit="天" />
          <Stat label="通关" value={progress.lessonsClearedTotal.toString()} unit="次" />
        </div>
      </Card>

      <Section
        title="林友"
        hint={`已加 ${friends.length}`}
        href="/friends"
        hrefLabel="管理林友 →"
      >
        {friends.length === 0 ? (
          <Card density="tight" className="text-center text-[13px] text-bark/60 py-3">
            还没有林友。把好友码分享给身边的朋友。
          </Card>
        ) : (
          <ul className="space-y-2">
            {friends.slice(0, 3).map((f) => {
              const m = TIER_MASCOT[Math.min(Math.max(f.tier, 1), 7)]
              return (
                <li key={f.id}>
                  <Link
                    href={`/profile/${f.friendCode}`}
                    className="group flex items-center gap-3 rounded-[14px] px-3 py-2 bg-cream/70 hover:bg-cream hover:-translate-y-[1px] transition-all border border-bark/10"
                  >
                    <Mascot name={m} className="h-8 w-8 text-bark shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-ink truncate">{f.nickname}</div>
                      <div className="text-[10px] text-bark/55">本周 {f.weeklyXp} XP</div>
                    </div>
                    <span className="text-[12px] text-hazel">→</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <SketchDivider className="opacity-50" />

      <div className="grid grid-cols-2 gap-2">
        <Link href={`/profile/${user.friendCode}`}>
          <Button variant="ink" className="w-full">公开主页</Button>
        </Link>
        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="ink" className="w-full text-ochre border-ochre/40">
            退出登录
          </Button>
        </form>
      </div>
    </div>
  )
}

function Section({
  title, hint, href, hrefLabel, children,
}: {
  title: string
  hint?: string
  href?: string
  hrefLabel?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-[14px] font-medium text-ink">
          {title}
          {hint && <span className="ml-2 text-[11px] text-bark/45 font-normal">{hint}</span>}
        </h2>
        {href && hrefLabel && (
          <Link href={href} className="text-[12px] text-moss hover:text-hazel">{hrefLabel}</Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Stat({ label, value, unit, accent = false }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="rounded-[12px] bg-oat/50 border border-bark/10 px-2 py-2.5 text-center">
      <div className="text-[10px] tracking-[0.2em] uppercase text-bark/50">{label}</div>
      <div className={`mt-1 leading-none tabular-nums font-medium ${accent ? 'text-[20px] text-hazel' : 'text-[18px] text-ink'}`}>
        {value}
      </div>
      <div className="text-[10px] text-bark/45 mt-0.5">{unit}</div>
    </div>
  )
}

function FlameStat({ days }: { days: number }) {
  return (
    <div className="rounded-[12px] bg-oat/50 border border-bark/10 px-2 py-2.5 flex flex-col items-center justify-center">
      <div className="text-[10px] tracking-[0.2em] uppercase text-bark/50">连胜</div>
      <div className="mt-1 flex items-center justify-center"><StreakFlame days={days} /></div>
    </div>
  )
}
