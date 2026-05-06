import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SketchDivider } from '@/components/forest/SketchDivider'
import { Mascot, TIER_MASCOT } from '@/components/forest/Mascot'
import { getSessionUser } from '@/lib/auth/session'
import { buildChallenge, type ClearSnapshot } from '@/lib/social/challenge'
import { cn } from '@/lib/utils'

type PageProps = { params: Promise<{ lessonId: string; code: string }> }

export default async function PkPage({ params }: PageProps) {
  const { lessonId, code } = await params
  const viewer = await getSessionUser()
  const comparison = await buildChallenge({
    lessonId,
    challengerCode: code,
    opponentUserId: viewer?.id ?? null,
  })
  if (!comparison) notFound()

  const winnerRibbon = {
    challenger: { text: '挑战者胜', color: 'text-hazel' },
    opponent: { text: '你胜', color: 'text-moss' },
    tie: { text: '平手', color: 'text-mist' },
    incomplete: { text: '待完成', color: 'text-bark/60' },
  }[comparison.outcome]

  return (
    <div className="py-6 space-y-4 bloom-in">
      <div>
        <h1 className="brush-text text-[24px]">异步 PK</h1>
        <p className="text-[12px] text-bark/60">
          《{comparison.lessonTitle}》——比谁拿的星星多。
        </p>
      </div>

      <Card tilt="left" density="cozy">
        <div className="text-center py-2">
          <div className={cn('text-[10px] tracking-[0.3em] uppercase', winnerRibbon.color)}>
            {winnerRibbon.text}
          </div>
          <p className="mt-2 text-[15px] text-ink leading-6">{comparison.summary}</p>
        </div>

        <SketchDivider className="my-4" />

        <div className="grid grid-cols-2 gap-3">
          <PlayerSide snapshot={comparison.challenger} label="挑战者" wins={comparison.outcome === 'challenger'} />
          <PlayerSide snapshot={comparison.opponent} label="你" wins={comparison.outcome === 'opponent'} />
        </div>
      </Card>

      <div className="flex gap-2 pt-2">
        {!comparison.opponent && viewer && (
          <a href={`/learn/${lessonId}`} className="flex-1">
            <Button className="w-full">去应战</Button>
          </a>
        )}
        {!viewer && (
          <a href="/login" className="flex-1">
            <Button className="w-full">登录后应战</Button>
          </a>
        )}
        <a href="/friends" className="flex-1">
          <Button variant="ink" className="w-full">林友</Button>
        </a>
      </div>

      <p className="text-center text-[11px] text-bark/45 italic pt-2">
        MVP 的异步 PK 基于最新通关的星级比较 · 实时对战在 W3 接 WebSocket
      </p>
    </div>
  )
}

function PlayerSide({
  snapshot, label, wins,
}: {
  snapshot: ClearSnapshot | null
  label: string
  wins: boolean
}) {
  if (!snapshot) {
    return (
      <div className="rounded-[14px] border border-dashed border-bark/20 p-4 text-center">
        <div className="text-[10px] tracking-[0.25em] uppercase text-bark/40 mb-2">{label}</div>
        <div className="text-[13px] text-bark/45">还没开始</div>
      </div>
    )
  }
  const mascot = TIER_MASCOT[Math.min(Math.max(snapshot.tier, 1), 7)]
  return (
    <div
      className={cn(
        'rounded-[14px] p-4 text-center transition-all',
        wins
          ? 'bg-hazel/12 border-2 border-hazel shadow-[0_0_0_4px_rgba(199,127,68,0.15)]'
          : 'bg-cream border border-bark/10',
      )}
    >
      <div className="text-[10px] tracking-[0.25em] uppercase text-bark/55 mb-2">{label}</div>
      <Mascot name={mascot} className="h-14 w-14 mx-auto text-bark mb-1" />
      <div className="text-[14px] text-ink truncate">{snapshot.nickname}</div>
      <div className="mt-2 flex justify-center gap-0.5">
        {[1, 2, 3].map((s) => (
          <svg key={s} viewBox="0 0 24 24" className={cn('h-5 w-5', s <= snapshot.stars ? 'text-hazel' : 'text-bark/15')} fill="currentColor">
            <path d="M12 2 L14.8 9 L22 9.6 L16.4 14.4 L18.2 21.4 L12 17.6 L5.8 21.4 L7.6 14.4 L2 9.6 L9.2 9 Z" />
          </svg>
        ))}
      </div>
    </div>
  )
}
