'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mascot } from '@/components/forest/Mascot'

type Props = {
  reason: 'finished' | 'quit-a' | 'quit-b' | 'timeout'
  selfId: string
  aId: string
  bId: string
  scores: Record<string, number>
  winnerId: string | null
  onBack: () => void
  selfXp?: number
}

export function CompletionDuel({
  reason, selfId, aId, bId, scores, winnerId, onBack, selfXp,
}: Props) {
  const oppId = selfId === aId ? bId : aId
  const self = scores[selfId] ?? 0
  const opp = scores[oppId] ?? 0
  const isWin = winnerId === selfId
  const isDraw = winnerId === null && reason === 'finished'
  const oppQuit = (reason === 'quit-a' && selfId !== aId) || (reason === 'quit-b' && selfId !== bId)
  const selfQuit = (reason === 'quit-a' && selfId === aId) || (reason === 'quit-b' && selfId === bId)
  const title = selfQuit ? '你已退出'
    : oppQuit ? '对方退出，你获胜'
    : isDraw ? '平局'
    : isWin ? '获胜'
    : '惜败'
  const mascot = isWin || oppQuit ? 'fox' : isDraw ? 'koala' : 'squirrel'
  return (
    <Card density="cozy" className="text-center space-y-3" data-testid="duel-finished">
      <Mascot name={mascot} className="h-24 w-24 mx-auto text-moss" />
      <h2 className="brush-text text-[26px] text-ink">{title}</h2>
      <div className="text-[28px] tabular-nums font-medium text-hazel">
        {self} <span className="text-bark/40 mx-1">:</span> {opp}
      </div>
      {typeof selfXp === 'number' && selfXp > 0 ? (
        <p className="text-[13px] text-moss" data-testid="duel-xp-gain">+{selfXp} XP</p>
      ) : (
        <p className="text-[12px] text-bark/55">本场未计入 XP（今日已封顶或未达条件）</p>
      )}
      <Button variant="ink" onClick={onBack} className="w-full">回到知识竞赛</Button>
    </Card>
  )
}
