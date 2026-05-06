import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot, TIER_MASCOT, MASCOT_LABEL } from '@/components/forest/Mascot'
import { StreakFlame } from '@/components/forest/StreakFlame'
import { getSessionUser } from '@/lib/auth/session'
import { getPublicProfileByCode } from '@/lib/social/service'
import { AddProfileButton } from '@/components/social/AddProfileButton'

export default async function ProfilePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const viewer = await getSessionUser()
  const profile = await getPublicProfileByCode(code, viewer?.id ?? null)
  if (!profile) notFound()

  const mascot = TIER_MASCOT[Math.min(Math.max(profile.tier, 1), 7)]
  const isSelf = profile.relation === 'self'
  const isFriend = profile.relation === 'friend'

  return (
    <div className="py-6 space-y-4 bloom-in">
      <Card tilt="left" density="cozy">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <span
              className="absolute inset-0 rounded-full -z-0"
              style={{ background: 'radial-gradient(circle, rgba(143,166,127,0.35) 0%, transparent 70%)' }}
            />
            <Mascot name={mascot} className="h-24 w-24 text-bark relative" />
          </div>
          <h1 className="brush-text text-[28px] mt-2 leading-tight">{profile.nickname}</h1>
          <p className="text-[12px] text-bark/60 mt-1">
            <span className="text-moss font-medium">{MASCOT_LABEL[mascot]}</span> · L{profile.tier}
          </p>
          <div className="mt-2 rounded-full bg-oat border border-bark/15 px-3 py-1 inline-flex items-center gap-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-bark/50">好友码</span>
            <span className="text-[13px] tracking-[0.25em] text-ink font-medium tabular-nums">{profile.friendCode}</span>
          </div>
        </div>

        <SketchDivider className="my-5" />

        <div className="grid grid-cols-2 gap-3 text-center">
          <ProfileStat label="累计 XP" value={profile.totalXp.toString()} />
          <ProfileStat label="通关数" value={profile.lessonsClearedTotal.toString()} />
          <ProfileStat label="最长连胜" value={`${profile.bestStreak} 天`} />
          <div className="rounded-[12px] bg-oat/50 border border-bark/10 px-2 py-3 flex flex-col items-center justify-center">
            <div className="text-[10px] tracking-[0.2em] uppercase text-bark/50">当前连胜</div>
            <div className="mt-1"><StreakFlame days={profile.currentStreak} /></div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-[13px] text-bark/70 mb-2">徽章收藏 ({profile.badges.length})</h2>
        {profile.badges.length === 0 ? (
          <Card density="tight" className="text-center text-[13px] text-bark/55 py-6">
            还没有采到任何徽章。
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((b) => (
              <span
                key={b.slug}
                className="inline-flex items-center gap-1.5 rounded-full bg-hazel/12 border border-hazel/40 px-3 py-1.5"
              >
                <span className="text-[16px]">{b.emoji}</span>
                <span className="text-[13px] text-ink">{b.title}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        {isSelf ? (
          <a href="/friends" className="flex-1">
            <Button className="w-full">管理林友</Button>
          </a>
        ) : isFriend ? (
          <div className="flex-1">
            <Button variant="ink" className="w-full" disabled>
              已是林友 ✓
            </Button>
          </div>
        ) : viewer ? (
          <div className="flex-1">
            <AddProfileButton friendCode={profile.friendCode} />
          </div>
        ) : (
          <a href="/login" className="flex-1">
            <Button className="w-full">登录后加为林友</Button>
          </a>
        )}
        <a href="/">
          <Button variant="ink">回森林</Button>
        </a>
      </div>
    </div>
  )
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-oat/50 border border-bark/10 px-2 py-3">
      <div className="text-[10px] tracking-[0.2em] uppercase text-bark/50">{label}</div>
      <div className="mt-1 text-[20px] text-ink tabular-nums font-medium">{value}</div>
    </div>
  )
}
