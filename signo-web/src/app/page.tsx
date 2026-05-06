import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getLessonTree } from '@/lib/curriculum/service'
import { getSessionUser } from '@/lib/auth/session'
import { getTodayXp } from '@/lib/progress/service'
import { Mascot, TIER_MASCOT, MASCOT_LABEL } from '@/components/forest/Mascot'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Leaf } from '@/components/forest/Leaf'

export default async function Home() {
  const [tree, user] = await Promise.all([getLessonTree(), getSessionUser()])
  const todayXp = user ? await getTodayXp(user.id) : 0

  return (
    <div className="py-6 space-y-6 bloom-in">
      {user ? <WelcomeStrip nickname={user.nickname} tier={user.tier} xp={todayXp} /> : <GuestInvite />}

      {tree.length === 0 ? (
        <Card><p className="text-bark/70">森林里还没有课程，稍后再来。</p></Card>
      ) : (
        <div className="space-y-7 relative">
          {/* 左侧竖向虚线"小径" */}
          <div className="absolute left-[22px] top-6 bottom-6 border-l-2 border-dashed border-bark/15 pointer-events-none" aria-hidden />
          {tree.map((node, i) => (
            <UnitClearing key={node.unit.id} index={i} {...node} />
          ))}
        </div>
      )}

      <FooterNote />
    </div>
  )
}

function WelcomeStrip({ nickname, tier, xp }: { nickname: string; tier: number; xp: number }) {
  const name = TIER_MASCOT[Math.min(Math.max(tier, 1), 7)]
  return (
    <Card tilt="left" tape density="cozy" className="mx-1">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <span
            className="absolute inset-0 rounded-full -z-0"
            style={{
              background: 'radial-gradient(circle, rgba(143,166,127,0.35) 0%, transparent 70%)',
            }}
          />
          <Mascot name={name} className="h-16 w-16 text-bark relative" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] text-bark/60 italic">清晨好，</p>
          <h2 className="brush-text text-[26px] leading-tight">{nickname}</h2>
          <p className="text-[12px] text-bark/55 mt-0.5">
            你是一只<span className="text-moss brush-text text-[14px] mx-0.5">{MASCOT_LABEL[name]}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-latin)] text-[28px] text-hazel leading-none">+{xp}</div>
          <div className="text-[10px] tracking-[0.25em] text-bark/50 uppercase mt-1">Today · XP</div>
        </div>
      </div>
    </Card>
  )
}

function GuestInvite() {
  return (
    <Card tilt="right" tape density="loose" className="mx-1 overflow-hidden">
      <Leaf size={56} rotate={-14} className="absolute -top-3 -right-3 opacity-70" />
      <div className="flex items-start gap-4">
        <Mascot name="squirrel" className="h-20 w-20 text-hazel shrink-0" />
        <div className="flex-1">
          <h2 className="brush-text text-[24px] leading-tight">
            林子里<span className="text-moss">留一把椅子</span>给你
          </h2>
          <p className="text-[13px] text-bark/70 leading-6 mt-2">
            起个名字，就能看见属于你的小动物。每学会一个手语，
            就有一片叶子为你落下。
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

function UnitClearing({
  unit,
  lessons,
  index,
}: {
  unit: { id: string; order: number; title: string; description: string }
  lessons: { id: string; order: number; title: string; questionCount: number }[]
  index: number
}) {
  const unitNumber = String(index + 1).padStart(2, '0')
  return (
    <section className="relative pl-12">
      {/* 单元序号圆牌 */}
      <div className="absolute left-0 top-1 h-11 w-11 rounded-full bg-cream border-2 border-moss shadow-[var(--shadow-soft)] flex items-center justify-center">
        <span className="font-[family-name:var(--font-latin)] text-[15px] text-moss">{unitNumber}</span>
      </div>

      <div className="mb-3">
        <h3 className="brush-text text-[22px] leading-tight">{unit.title}</h3>
        <p className="text-[12px] text-bark/60 italic mt-0.5">{unit.description}</p>
        <SketchDivider className="mt-2" />
      </div>

      <ul className="space-y-2.5">
        {lessons.map((l, li) => (
          <li key={l.id}>
            <a
              href={`/learn/${l.id}`}
              data-testid="lesson-link"
              className="group flex items-center gap-3 rounded-[14px] px-3 py-2.5 bg-cream/70 hover:bg-cream hover:-translate-y-[1px] transition-all border border-bark/10 shadow-[0_2px_0_rgba(74,58,44,0.06)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-oat border border-bark/15">
                <span className="font-[family-name:var(--font-latin)] text-[13px] text-bark/70">{li + 1}</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] text-ink font-[family-name:var(--font-book)]">{l.title}</span>
                <span className="block text-[11px] text-bark/50">{l.questionCount} 片叶子</span>
              </span>
              <span className="brush-text text-[16px] text-hazel group-hover:translate-x-0.5 transition-transform">
                去 →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
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
      <p className="font-[family-name:var(--font-latin)] text-[11px] tracking-[0.3em] uppercase text-bark/50">
        the forest speaks without sound
      </p>
    </div>
  )
}
