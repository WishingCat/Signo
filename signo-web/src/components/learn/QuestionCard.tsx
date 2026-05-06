'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  promptText: string | null
  promptMediaPath: string | null
  choices: string[]
  onAnswer: (choiceIdx: number) => void
}

export function QuestionCard({
  promptText,
  promptMediaPath,
  choices,
  onAnswer,
}: Props) {
  const [picked, setPicked] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {promptMediaPath && (
        <div className="relative w-full aspect-square rounded-card overflow-hidden bg-oat/50 border border-bark/10">
          <Image
            src={promptMediaPath}
            alt={promptText ?? '手语图'}
            fill
            className="object-contain"
            sizes="(max-width: 480px) 90vw, 400px"
            priority
            data-testid="question-image"
          />
        </div>
      )}
      <div className="text-lg text-bark">
        {promptMediaPath ? '这个手语表示哪个词？' : (
          <span>
            找出手语：<b className="text-moss">{promptText}</b>
          </span>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-2">
        {choices.map((c, i) => (
          <li key={i}>
            <Button
              variant={picked === i ? 'primary' : 'secondary'}
              className={cn('w-full justify-start')}
              onClick={() => {
                if (picked !== null) return
                setPicked(i)
                onAnswer(i)
              }}
              disabled={picked !== null}
              data-testid={`choice-${i}`}
            >
              {c}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
