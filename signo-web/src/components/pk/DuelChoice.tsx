'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Props = {
  signId: number
  choices: string[]
  questionIndex: number
  total: number
  deadlineMs: number | null
  picked: number | null
  locked: boolean
  onPick: (i: number) => void
}

export function DuelChoice({
  signId, choices, questionIndex, total, deadlineMs, picked, locked, onPick,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center text-[12px] text-bark/55 tabular-nums">
        第 {questionIndex + 1} / {total} 题
        {deadlineMs !== null && <DeadlineCountdown deadlineMs={deadlineMs} />}
      </div>
      <div className="relative mx-auto w-full max-w-[340px]">
        <div className="paper rounded-[8px] p-3">
          <div className="relative w-full aspect-square rounded-[6px] overflow-hidden bg-oat border border-bark/10">
            <Image
              src={`/api/signs/image/${signId}`}
              alt="手语图"
              fill
              unoptimized
              className="object-contain"
              sizes="(max-width: 480px) 90vw, 340px"
              priority
              data-testid="duel-question"
            />
          </div>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-2">
        {choices.map((c, i) => (
          <li key={i}>
            <Button
              variant="ink"
              size="lg"
              className={cn(
                'w-full justify-start',
                picked === i && 'bg-moss text-cream border-moss',
              )}
              data-testid={`duel-choice-${i}`}
              disabled={locked}
              onClick={() => onPick(i)}
            >
              <span className="flex items-center gap-3 w-full">
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] tabular-nums font-medium',
                  picked === i ? 'bg-cream/90 text-moss' : 'bg-bark/10 text-bark/70',
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-left text-[15px]">{c}</span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeadlineCountdown({ deadlineMs }: { deadlineMs: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])
  const remain = Math.max(0, deadlineMs - now)
  const sec = Math.ceil(remain / 1000)
  return (
    <span className={cn('ml-2', sec <= 1 ? 'text-ochre' : 'text-bark/65')} data-testid="duel-deadline">
      · {sec}s
    </span>
  )
}

export function DuelHud({
  selfName, oppName, selfScore, oppScore,
}: {
  selfName: string; oppName: string; selfScore: number; oppScore: number
}) {
  return (
    <Card density="tight">
      <div className="flex items-center justify-between gap-2">
        <ScoreCol label={selfName} score={selfScore} testid="duel-score-self" mine />
        <span className="text-[14px] text-bark/45">vs</span>
        <ScoreCol label={oppName} score={oppScore} testid="duel-score-opponent" />
      </div>
    </Card>
  )
}

function ScoreCol({
  label, score, testid, mine,
}: { label: string; score: number; testid: string; mine?: boolean }) {
  return (
    <div className={cn('flex-1', mine ? 'text-left' : 'text-right')}>
      <div className="text-[12px] text-bark/55 truncate">{label}</div>
      <div
        className={cn(
          'text-[24px] tabular-nums font-medium leading-tight',
          mine ? 'text-hazel' : 'text-ink',
        )}
        data-testid={testid}
      >
        {score}
      </div>
    </div>
  )
}
