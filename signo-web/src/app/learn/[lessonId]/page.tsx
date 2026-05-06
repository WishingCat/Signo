'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuestionCard } from '@/components/learn/QuestionCard'
import type { LearnQuestion } from '@/lib/curriculum/types'
import type { ClearLessonResult } from '@/lib/curriculum/learn.schema'

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const router = useRouter()

  const [questions, setQuestions] = useState<LearnQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const startRef = useRef(Date.now())
  const [answers, setAnswers] = useState<
    { questionId: string; choice: number; msSpent: number }[]
  >([])
  const [done, setDone] = useState<ClearLessonResult | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    fetch(`/api/learn/lesson/${lessonId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: LearnQuestion[]) => {
        if (!cancel) {
          setQuestions(data)
          startRef.current = Date.now()
        }
      })
      .catch(() => {
        if (!cancel) setErr('关卡加载失败')
      })
    return () => {
      cancel = true
    }
  }, [lessonId])

  if (err) {
    return (
      <main className="p-6">
        <Card>
          <p className="text-ochre">{err}</p>
          <Button className="mt-4" onClick={() => router.push('/')}>
            回到森林
          </Button>
        </Card>
      </main>
    )
  }
  if (!questions) return <main className="p-6 text-bark/60">载入中…</main>
  if (questions.length === 0) {
    return (
      <main className="p-6">
        <Card>
          <p className="text-bark/70">这关还没有题目。</p>
        </Card>
      </main>
    )
  }

  if (done) {
    return (
      <main className="p-6 space-y-3">
        <Card>
          <h2 className="text-moss font-semibold mb-2">关卡完成</h2>
          <p>
            得分 {done.correct} / {done.total} · 星级{' '}
            {'★'.repeat(done.stars)}
            {'☆'.repeat(3 - done.stars)}
          </p>
          <p className="mt-1 text-hazel">获得 +{done.xp} XP</p>
          <Button className="mt-4" onClick={() => router.push('/')}>
            回到森林
          </Button>
        </Card>
      </main>
    )
  }

  const q = questions[index]

  return (
    <main className="p-6 space-y-3">
      <div className="text-sm text-bark/60">
        第 {index + 1} / {questions.length} 题
      </div>
      <Card>
        <QuestionCard
          key={q.id}
          promptText={q.promptText}
          promptMediaPath={q.promptMediaPath}
          choices={q.choices}
          onAnswer={(choice) => {
            const msSpent = Date.now() - startRef.current
            const nextAnswers = [
              ...answers,
              { questionId: q.id, choice, msSpent },
            ]
            setAnswers(nextAnswers)

            setTimeout(async () => {
              if (index + 1 < questions.length) {
                setIndex(index + 1)
                startRef.current = Date.now()
                return
              }
              const res = await fetch('/api/learn/clear-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, answers: nextAnswers }),
              })
              if (res.status === 401) {
                router.push('/login')
                return
              }
              if (!res.ok) {
                setErr('结算失败')
                return
              }
              setDone(await res.json())
            }, 500)
          }}
        />
      </Card>
    </main>
  )
}
