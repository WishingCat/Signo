import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getLessonTree } from '@/lib/curriculum/service'
import { getSessionUser } from '@/lib/auth/session'
import { getLessonProgressMap } from '@/lib/progress/service'
import { Mascot } from '@/components/forest/Mascot'
import { Leaf } from '@/components/forest/Leaf'
import { Fern } from '@/components/forest/Fern'
import { Berry } from '@/components/forest/Berry'
import { Mushroom } from '@/components/forest/Mushroom'
import { ForestPath } from '@/components/forest/ForestPath'

export default async function Home() {
  const [tree, user] = await Promise.all([getLessonTree(), getSessionUser()])
  const progress = user ? await getLessonProgressMap(user.id) : {}

  return (
    <div className="py-6 space-y-5 bloom-in">
      {user ? <QuickActions /> : <GuestInvite />}

      <PathHeading />

      {tree.length === 0 ? (
        <Card><p className="text-bark/70">森林里还没有课程，稍后再来。</p></Card>
      ) : (
        <ForestPath units={tree} progress={progress} />
      )}

      <FooterNote />
    </div>
  )
}

function PathHeading() {
  return (
    <div className="text-center pt-2 relative">
      <Berry className="absolute -top-1 left-2 w-10 h-12 opacity-85 -rotate-12 pointer-events-none" />
      <Berry className="absolute top-0 right-3 w-9 h-11 opacity-85 rotate-12 pointer-events-none" color="forest" />
      <h2 className="brush-text text-[20px]">森林之路</h2>
      <p className="text-[12px] text-bark/55 mt-0.5">点亮一只小动物，就是踏上一段新路</p>
    </div>
  )
}

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ActionTile href="/mistakes" accent="ochre" title="错题本" hint="被风吹落的叶子" icon={<IconBook />} />
      <ActionTile href="/review" accent="moss" title="今日复习" hint="把错过的拾起来" icon={<IconRefresh />} />
    </div>
  )
}

function ActionTile({
  href, accent, title, hint, icon,
}: {
  href: string
  accent: 'ochre' | 'moss'
  title: string
  hint: string
  icon: React.ReactNode
}) {
  const color: Record<typeof accent, string> = {
    ochre: 'bg-ochre/15 text-ochre',
    moss: 'bg-moss/15 text-moss',
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
    <div className="pt-6 text-center space-y-2 opacity-80 relative">
      <Fern className="absolute -bottom-2 -left-2 w-16 h-20 opacity-70 pointer-events-none" />
      <Mushroom variant="red" className="absolute -bottom-1 -right-1 w-12 h-14 opacity-80 pointer-events-none" />
      <div className="flex justify-center gap-4">
        <Leaf size={28} rotate={-20} color="var(--color-moss)" />
        <Leaf size={24} rotate={20} color="var(--color-hazel)" />
        <Leaf size={28} rotate={-8} color="var(--color-sage)" />
      </div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-bark/50">the forest speaks without sound</p>
    </div>
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
