'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  type?: 'sign2word' | 'word2sign'
  promptText: string | null
  promptMediaPath: string | null
  choices: string[]
  questionIndex: number
  totalCount: number
  onAnswer: (choiceIdx: number) => void
}

export function QuestionCard({
  type = 'sign2word',
  promptText,
  promptMediaPath,
  choices,
  questionIndex,
  totalCount,
  onAnswer,
}: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const choicesAreImages = type === 'word2sign'

  return (
    <div className="space-y-5">
      {promptMediaPath && (
        <div className="relative mx-auto w-full max-w-[360px]">
          <span
            className="absolute z-20"
            style={{
              top: -10, left: '50%', transform: 'translateX(-50%) rotate(-4deg)',
              width: 90, height: 22,
              background: 'color-mix(in oklab, var(--color-hazel) 35%, #fff)',
              boxShadow: '0 2px 4px rgba(74,58,44,0.12)', opacity: 0.9,
            }}
            aria-hidden
          />
          <div className="paper rounded-[8px] p-3 pb-12" style={{ transform: 'rotate(-0.8deg)' }}>
            <div className="relative w-full aspect-square rounded-[6px] overflow-hidden bg-oat border border-bark/10">
              <Image
                src={promptMediaPath}
                alt={promptText ?? '手语图'}
                fill
                className="object-contain"
                sizes="(max-width: 480px) 90vw, 360px"
                priority
                data-testid="question-image"
              />
            </div>
            <div className="mt-3 text-center">
              <span className="text-[11px] tracking-[0.25em] uppercase text-bark/50 tabular-nums">
                No. {String(questionIndex + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="brush-text text-[20px] text-ink">
          {choicesAreImages ? (
            <>找出手语：<span className="text-moss">{promptText}</span></>
          ) : promptMediaPath ? (
            '这是哪一个？'
          ) : (
            <>找出手语：<span className="text-moss">{promptText}</span></>
          )}
        </p>
        <p className="text-[12px] text-bark/55">
          {choicesAreImages ? '从下面 4 张图里选一张' : '轻轻选一片叶子'}
        </p>
      </div>

      {choicesAreImages ? (
        <ul className="grid grid-cols-2 gap-3">
          {choices.map((src, i) => {
            const isPicked = picked === i
            const isDimmed = picked !== null && !isPicked
            return (
              <li key={i}>
                <button
                  type="button"
                  data-testid={`choice-${i}`}
                  disabled={picked !== null}
                  onClick={() => { if (picked !== null) return; setPicked(i); onAnswer(i) }}
                  className={cn(
                    'w-full paper rounded-[12px] p-2 transition-all',
                    isPicked && 'ring-2 ring-moss bg-moss/5',
                    isDimmed && 'opacity-40',
                    picked === null && 'hover:-translate-y-[1px]',
                  )}
                >
                  <div className="relative w-full aspect-square rounded-[8px] overflow-hidden bg-oat">
                    <Image
                      src={src}
                      alt={`选项 ${String.fromCharCode(65 + i)}`}
                      fill
                      className="object-contain"
                      sizes="40vw"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-[12px] tabular-nums font-medium transition-colors',
                        isPicked ? 'bg-moss text-cream' : 'bg-bark/10 text-bark/70',
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5">
          {choices.map((c, i) => {
            const isPicked = picked === i
            const isDimmed = picked !== null && !isPicked
            return (
              <li key={i}>
                <Button
                  variant="ink"
                  size="lg"
                  className={cn(
                    'w-full justify-start transition-all duration-300',
                    isPicked && 'bg-moss text-cream border-moss shadow-[0_0_0_6px_rgba(95,125,79,0.12)]',
                    isDimmed && 'opacity-45',
                  )}
                  onClick={() => { if (picked !== null) return; setPicked(i); onAnswer(i) }}
                  disabled={picked !== null}
                  data-testid={`choice-${i}`}
                >
                  <span className="flex items-center gap-3 w-full">
                    <span className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] tabular-nums font-medium transition-colors',
                      isPicked ? 'bg-cream/90 text-moss' : 'bg-bark/10 text-bark/70',
                    )}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 text-left text-[15px]">{c}</span>
                  </span>
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
