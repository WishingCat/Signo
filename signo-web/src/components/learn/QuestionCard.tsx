'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Feedback = {
  picked: number
  isCorrect: boolean
  correctIndex: number
  explanation: string | null
}

type Props = {
  questionId: string
  type?: 'sign2word' | 'word2sign'
  promptText: string | null
  promptMediaPath: string | null
  choices: string[]
  questionIndex: number
  totalCount: number
  onAnswered: (choiceIdx: number, isCorrect: boolean) => void
}

export function QuestionCard({
  questionId,
  type = 'sign2word',
  promptText,
  promptMediaPath,
  choices,
  questionIndex,
  totalCount,
  onAnswered,
}: Props) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pending, setPending] = useState(false)
  const choicesAreImages = type === 'word2sign'
  const locked = feedback !== null || pending

  async function pick(i: number) {
    if (locked) return
    setPending(true)
    try {
      const res = await fetch('/api/learn/grade-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, choice: i }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'grade failed')
      setFeedback({ picked: i, ...data })
    } catch {
      setFeedback({ picked: i, isCorrect: false, correctIndex: -1, explanation: null })
    } finally {
      setPending(false)
    }
  }

  function onNext() {
    if (!feedback) return
    onAnswered(feedback.picked, feedback.isCorrect)
  }

  function choiceClass(i: number, base: string, pickedStyle: string, correctStyle: string, wrongStyle: string) {
    if (!feedback) return cn(base, pending && 'opacity-60')
    if (i === feedback.correctIndex) return cn(base, correctStyle)
    if (i === feedback.picked && !feedback.isCorrect) return cn(base, wrongStyle)
    return cn(base, 'opacity-45')
  }

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
                unoptimized
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
          {choices.map((src, i) => (
            <li key={i}>
              <button
                type="button"
                data-testid={`choice-${i}`}
                disabled={locked}
                onClick={() => pick(i)}
                className={choiceClass(
                  i,
                  'w-full paper rounded-[12px] p-2 transition-all',
                  'ring-2 ring-moss bg-moss/5',
                  'ring-2 ring-moss bg-moss/10',
                  'ring-2 ring-ochre bg-ochre/5',
                )}
              >
                <div className="relative w-full aspect-square rounded-[8px] overflow-hidden bg-oat">
                  <Image src={src} alt={`选项 ${String.fromCharCode(65 + i)}`} fill unoptimized className="object-contain" sizes="40vw" />
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[12px] tabular-nums font-medium', feedback?.correctIndex === i ? 'bg-moss text-cream' : feedback?.picked === i && !feedback.isCorrect ? 'bg-ochre text-cream' : 'bg-bark/10 text-bark/70')}>
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5">
          {choices.map((c, i) => (
            <li key={i}>
              <Button
                variant="ink"
                size="lg"
                className={choiceClass(
                  i,
                  'w-full justify-start transition-all duration-300',
                  'bg-moss text-cream border-moss shadow-[0_0_0_6px_rgba(95,125,79,0.12)]',
                  'bg-moss/90 text-cream border-moss shadow-[0_0_0_6px_rgba(95,125,79,0.14)]',
                  'bg-ochre/90 text-cream border-ochre shadow-[0_0_0_6px_rgba(183,87,63,0.14)]',
                )}
                onClick={() => pick(i)}
                disabled={locked}
                data-testid={`choice-${i}`}
              >
                <span className="flex items-center gap-3 w-full">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] tabular-nums font-medium', feedback?.correctIndex === i ? 'bg-cream/90 text-moss' : feedback?.picked === i && !feedback.isCorrect ? 'bg-cream/90 text-ochre' : 'bg-bark/10 text-bark/70')}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-left text-[15px]">{c}</span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {feedback && (
        <div
          data-testid="answer-feedback"
          className={cn(
            'paper rounded-[12px] p-4 space-y-2 border-2',
            feedback.isCorrect ? 'border-moss/40 bg-moss/5' : 'border-ochre/40 bg-ochre/5',
          )}
        >
          <p className={cn('brush-text text-[16px]', feedback.isCorrect ? 'text-moss' : 'text-ochre')}>
            {feedback.isCorrect ? '✓ 答对了' : `× 答错了，正解是 ${choices[feedback.correctIndex] ?? '?'}`}
          </p>
          {feedback.explanation && (
            <p className="text-[13px] leading-[1.65] text-bark/75">{feedback.explanation}</p>
          )}
          <Button variant="ink" size="lg" onClick={onNext} data-testid="next-question" className="w-full">
            {feedback.isCorrect ? '下一题 →' : '记住了，继续 →'}
          </Button>
        </div>
      )}
    </div>
  )
}
