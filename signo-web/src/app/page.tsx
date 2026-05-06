import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getLessonTree } from '@/lib/curriculum/service'
import { getSessionUser } from '@/lib/auth/session'
import { getUserProgress } from '@/lib/progress/service'
import { Mascot, TIER_MASCOT, MASCOT_LABEL } from '@/components/forest/Mascot'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Leaf } from '@/components/forest/Leaf'
import { UnitClearing } from '@/components/home/UnitClearing'

export default async function Home() {
  const [tree, user] = await Promise.all([getLessonTree(), getSessionUser()])
  const progress = user ? await getUserProgress(user.id) : null

  return (
    <div className="py-6 space-y-5 bloom-in">
      {user && progress ? (
        <>
          <Dashboard nickname={user.nickname} progress={progress} />
          <QuickActions />
        </>
      ) : (
        <GuestInvite />
      )}

      {tree.length === 0 ? (
        <Card><p className="text-bark/70">森林里还没有课程，稍后再来。</p></Card>
      ) : (
        <div className="space-y-7 relative">
          <div className="absolute left-[22px] top-6 bottom-6 border-l-2 border-dashed border-bark/15 pointer-events-none" aria-hidden />
          {tree.map((node, i) => (
            <UnitClearing key={node.unit.id} index={i} unit={node.unit} lessons={node.lessons} />
          ))}
        </div>
      )}

      <FooterNote />
    </div>
  )
}

function Dashboard({
  nickname,
  progress,
}: {
  nickname: string
  progress: Awaited<ReturnType<typeof getUserProgress>>
}) {
  const name = TIER_MASCOT[Math.min(Math.max(progress.tier, 1), 7)]
  return (
    <Card tilt="left" tape density="cozy" className="mx-1">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <span
            className="absolute inset-0 rounded-full -z-0"
            style={{ background: 'radial-gradient(circle, rgba(143,166,127,0.35) 0%, transparent 70%)' }}
          />
          <Mascot name={name} className="h-16 w-16 text-bark relative" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-bark/60">清晨好，</p>
          <h2 className="brush-text text-[22px] leading-tight truncate">{nickname}</h2>
          <p className="text-[12px] text-bark/55 mt-0.5">
            你是一只<span className="text-moss font-medium mx-0.5">{MASCOT_LABEL[name]}</span>
            · L{progress.tier}
          </p>
        </div>
      </div>

      <SketchDivider className="my-4" />

      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="今日" value={`+${progress.todayXp}`} hint="XP" accent />
        <Metric label="累计" value={progress.totalXp.toString()} hint="XP" />
        <Metric label="连胜" value={progress.currentStreak.toString()} hint={progress.currentStreak > 0 ? '天' : '等你'} />
      </div>
    </Card>
  )
}

function Metric({ label, value, hint, accent = false }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div className="rounded-[12px] bg-oat/50 border border-bark/10 px-2 py-3">
      <div className="text-[10px] tracking-[0.2em] uppercase text-bark/50">{label}</div>
      <div className={`mt-1 leading-none tabular-nums font-medium ${accent ? 'text-[22px] text-hazel' : 'text-[20px] text-ink'}`}>
        {value}
      </div>
      <div className="text-[10px] text-bark/45 mt-1">{hint}</div>
    </div>
  )
}

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ActionTile href="/mistakes" accent="ochre" title="错题本" hint="被风吹落的叶子" icon={<IconBook />} />
      <ActionTile href="/review" accent="moss" title="今日复习" hint="把错过的拾起来" icon={<IconRefresh />} />
      <ActionTile href="/badges" accent="hazel" title="徽章馆" hint="藏在林中的奖章" icon={<IconMedal />} />
      <ActionTile href="/leaderboard" accent="mist" title="本周排行" hint="谁走得最远" icon={<IconLeaderboard />} />
    </div>
  )
}

function ActionTile({
  href, accent, title, hint, icon,
}: {
  href: string
  accent: 'ochre' | 'moss' | 'hazel' | 'mist'
  title: string
  hint: string
  icon: React.ReactNode
}) {
  const color: Record<typeof accent, string> = {
    ochre: 'bg-ochre/15 text-ochre',
    moss: 'bg-moss/15 text-moss',
    hazel: 'bg-hazel/15 text-hazel',
    mist: 'bg-mist/25 text-ink',
  }
  return (
    <a href={href} className="group">
      <Card density="tight" className="flex items-center gap-3 group-hover:-translate-y-[1px] transition-transform h-full">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${color[accent]}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-ink truncate">{title}</div>
          <div className="text-[11px] text-bark/55 truncate">{hint}</div>
        </div>
      </Card>
    </a>
  )
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M4 4 L 20 4 L 20 20 L 4 20 Z M 4 9 L 20 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="6.5" r="0.8" />
      <path d="M8 12 L 16 12 M 8 15 L 14 15" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}
function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M4 12 a 8 8 0 0 1 14 -5" />
      <path d="M20 12 a 8 8 0 0 1 -14 5" />
      <path d="M18 4 L 18 7 L 15 7" />
      <path d="M6 20 L 6 17 L 9 17" />
    </svg>
  )
}
function IconMedal() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="15" r="5.5" />
      <path d="M9 3 L 12 10 L 15 3" />
      <path d="M11 13.5 L 12 12 L 13 13.5 L 14.5 14 L 13.2 15.2 L 13.5 17 L 12 16 L 10.5 17 L 10.8 15.2 L 9.5 14 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconLeaderboard() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="14" width="4" height="7" rx="1" />
    </svg>
  )
}

function GuestInvite() {
  return (
    <Card tilt="right" tape density="loose" className="mx-1 overflow-hidden">
      <Leaf size={56} rotate={-14} className="absolute -top-3 -right-3 opacity-70" />
      <div className="flex items-start gap-4">
        <Mascot name="squirrel" className="h-20 w-20 text-hazel shrink-0" />
        <div className="flex-1">
          <h2 className="brush-text text-[22px] leading-tight">
            林子里<span className="text-moss">留一把椅子</span>给你
          </h2>
          <p className="text-[13px] text-bark/70 leading-6 mt-2">
            起个名字，就能看见属于你的小动物。每学会一个手语，就有一片叶子为你落下。
          </p>
          <div className="mt-4 flex gap-2">
            <a href="/register"><Button size="md">创建小屋</Button></a>
            <a href="/login"><Button size="md" variant="ink">已经有名字</Button></a>
          </div>
        </div>
      </div>
    </Card>
  )
}

function FooterNote() {
  return (
    <div className="pt-6 text-center space-y-2 opacity-70">
      <div className="flex justify-center gap-4">
        <Leaf size={28} rotate={-20} color="var(--color-moss)" />
        <Leaf size={24} rotate={20} color="var(--color-hazel)" />
        <Leaf size={28} rotate={-8} color="var(--color-sage)" />
      </div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-bark/50">the forest speaks without sound</p>
    </div>
  )
}
