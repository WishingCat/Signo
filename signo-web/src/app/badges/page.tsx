import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { getSessionUser } from '@/lib/auth/session'
import { getAllBadges, getUserBadges } from '@/lib/badges/service'

export default async function BadgesPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const [all, earned] = await Promise.all([
    getAllBadges(),
    getUserBadges(user.id),
  ])
  const earnedSlugs = new Set(earned.map((b) => b.slug))

  return (
    <div className="py-6 space-y-4 bloom-in">
      <div>
        <h1 className="brush-text text-[24px]">徽章馆</h1>
        <p className="text-[12px] text-bark/60">
          已收 <span className="text-hazel font-medium">{earned.length}</span> / {all.length} 枚
        </p>
      </div>

      <SketchDivider />

      <ul className="grid grid-cols-2 gap-3">
        {all.map((b) => {
          const got = earnedSlugs.has(b.slug)
          return (
            <li key={b.id}>
              <Card
                density="tight"
                className={`h-full flex flex-col items-center text-center ${got ? '' : 'opacity-55'}`}
              >
                <div
                  className={`h-14 w-14 rounded-full flex items-center justify-center text-[28px] mb-1.5 ${
                    got ? 'bg-hazel/15' : 'bg-bark/10 grayscale'
                  }`}
                >
                  {b.emoji}
                </div>
                <div className="text-[14px] font-medium text-ink">{b.title}</div>
                <div className="text-[11px] text-bark/55 mt-1 leading-5 px-1">
                  {b.description}
                </div>
                <div className="mt-2 text-[10px] tracking-[0.2em] uppercase">
                  {got ? (
                    <span className="text-moss">已获得</span>
                  ) : (
                    <span className="text-bark/40">未解锁</span>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      <div className="pt-4">
        <a href="/"><Button variant="ink" className="w-full">回到森林</Button></a>
      </div>
    </div>
  )
}
