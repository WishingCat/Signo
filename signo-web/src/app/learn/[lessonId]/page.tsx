'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuestionCard } from '@/components/learn/QuestionCard'
import { CompletionScreen } from '@/components/learn/CompletionScreen'
import { cn } from '@/lib/utils'
import type { LearnQuestion } from '@/lib/curriculum/types'
import type { ClearLessonResult } from '@/lib/curriculum/learn.schema'

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const router = useRouter()

  const [questions, setQuestions] = useState<LearnQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const startRef = useRef(Date.now())
  const [answers, setAnswers] = useState<{ questionId: string; choice: number; msSpent: number }[]>([])
  const [done, setDone] = useState<ClearLessonResult | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    fetch(`/api/learn/lesson/${lessonId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: LearnQuestion[]) => {
        if (!cancel) { setQuestions(data); startRef.current = Date.now() }
      })
      .catch(() => { if (!cancel) setErr('关卡加载失败') })
    return () => { cancel = true }
  }, [lessonId])

  if (err) {
    return (
      <div className="py-10">
        <Card className="text-center">
          <p className="text-ochre mb-4">{err}</p>
          <Button onClick={() => router.push('/')}>回到森林</Button>
        </Card>
      </div>
    )
  }
  if (!questions) return <div className="py-10 text-center text-bark/55">林叶正在翻开…</div>
  if (questions.length === 0) {
    return <div className="py-10"><Card><p className="text-bark/70">这关还没有叶子。</p></Card></div>
  }
  if (done) return <CompletionScreen result={done} onBack={() => router.push('/')} />

  const q = questions[index]

  return (
    <div className="py-6 space-y-5 bloom-in">
      <PebbleProgress total={questions.length} completed={answers.length} current={index} />
      <Card tilt="left" density="cozy">
        <QuestionCard
          key={q.id}
          type={q.type}
          promptText={q.promptText}
          promptMediaPath={q.promptMediaPath}
          choices={q.choices}
          questionIndex={index}
          totalCount={questions.length}
          onAnswer={(choice) => {
            const msSpent = Date.now() - startRef.current
            const next = [...answers, { questionId: q.id, choice, msSpent }]
            setAnswers(next)
            setTimeout(async () => {
              if (index + 1 < questions.length) {
                setIndex(index + 1); startRef.current = Date.now(); return
              }
              const res = await fetch('/api/learn/clear-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, answers: next }),
              })
              if (res.status === 401) { router.push('/login'); return }
              if (!res.ok) { setErr('结算失败'); return }
              setDone(await res.json())
            }, 650)
          }}
        />
      </Card>
    </div>
  )
}

function PebbleProgress({ total, completed, current }: { total: number; completed: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      {Array.from({ length: total }).map((_, i) => {
        const state = i < completed ? 'done' : i === current ? 'now' : 'todo'
        return (
          <span
            key={i}
            aria-label={`第 ${i + 1} 题 ${state}`}
            className={cn(
              'transition-all duration-300',
              state === 'done' && 'h-2.5 w-2.5 rounded-full bg-moss',
              state === 'now' && 'h-3 w-8 rounded-full bg-hazel shadow-[0_0_0_4px_rgba(126,162,85,0.15)]',
              state === 'todo' && 'h-2.5 w-2.5 rounded-full bg-bark/15',
            )}
          />
        )
      })}
    </div>
  )
}
