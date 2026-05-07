'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuestionCard } from '@/components/learn/QuestionCard'
import { CompletionScreen } from '@/components/learn/CompletionScreen'
import { Mascot } from '@/components/forest/Mascot'
import { cn } from '@/lib/utils'
import { advanceQueue, correctCount } from '@/lib/curriculum/lessonQueue'
import type { LearnQuestion } from '@/lib/curriculum/types'
import type { ClearLessonResult } from '@/lib/curriculum/learn.schema'

type FinalAnswer = { choice: number; msSpent: number }

export default function ReviewPage() {
  const router = useRouter()
  const [queue, setQueue] = useState<LearnQuestion[] | null>(null)
  const [total, setTotal] = useState(0)
  const finalAnswersRef = useRef<Map<string, FinalAnswer>>(new Map())
  const startRef = useRef(0)
  const submittingRef = useRef(false)
  const [done, setDone] = useState<ClearLessonResult | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    fetch('/api/learn/review')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.ok ? r.json() : Promise.reject(new Error(String(r.status)))
      })
      .then((data: LearnQuestion[] | null) => {
        if (cancel || !data) return
        setQueue(data)
        setTotal(data.length)
        finalAnswersRef.current = new Map()
        startRef.current = Date.now()
      })
      .catch(() => { if (!cancel) setErr('复习加载失败') })
    return () => { cancel = true }
  }, [router])

  const completed = useMemo(
    () => (queue ? correctCount(total, queue.length) : 0),
    [queue, total],
  )

  if (err) {
    return <div className="py-10"><Card><p className="text-ochre">{err}</p></Card></div>
  }
  if (!queue) return <div className="py-10 text-center text-bark/55">松鼠正在翻出那些藏起来的叶子…</div>

  if (total === 0) {
    return (
      <div className="py-10">
        <Card className="text-center">
          <Mascot name="squirrel" className="h-24 w-24 mx-auto text-moss opacity-80" />
          <h1 className="brush-text text-[22px] mt-2">今天没有叶子要复习</h1>
          <p className="text-[13px] text-bark/60 mt-1">全都被你收进兜里了——或是还没开始撒。</p>
          <div className="mt-5 flex justify-center gap-2">
            <a href="/"><Button>回到森林</Button></a>
            <a href="/mistakes"><Button variant="ink">看错题本</Button></a>
          </div>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <CompletionScreen
        result={done}
        onBack={() => router.push('/')}
        perfectTitle="把所有叶子捡回来了"
        passingTitle="又拾起一些叶子"
        backLabel="回到森林"
      />
    )
  }

  const q = queue[0]

  async function onAnswered(choice: number, isCorrect: boolean) {
    const msSpent = Date.now() - startRef.current
    finalAnswersRef.current.set(q.id, { choice, msSpent })
    const nextQueue = advanceQueue(queue!, isCorrect)
    if (nextQueue.length > 0) {
      setQueue(nextQueue)
      startRef.current = Date.now()
      return
    }
    if (submittingRef.current) return
    submittingRef.current = true
    const payload = {
      answers: Array.from(finalAnswersRef.current.entries()).map(
        ([questionId, a]) => ({ questionId, choice: a.choice, msSpent: a.msSpent }),
      ),
    }
    const res = await fetch('/api/learn/clear-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.status === 401) { router.push('/login'); return }
    if (!res.ok) { setErr('结算失败'); submittingRef.current = false; return }
    setDone(await res.json())
  }

  return (
    <div className="py-6 space-y-5 bloom-in">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] text-bark/60">复习关</span>
        <span className="text-[12px] text-bark/60 tabular-nums">
          {completed + 1} / {total}
        </span>
      </div>
      <PebbleProgress total={total} completed={completed} current={completed} />
      <Card tilt="right" density="cozy">
        <QuestionCard
          key={`${q.id}-${queue!.length}`}
          questionId={q.id}
          type={q.type}
          promptText={q.promptText}
          promptMediaPath={q.promptMediaPath}
          choices={q.choices}
          questionIndex={completed}
          totalCount={total}
          onAnswered={onAnswered}
        />
      </Card>
    </div>
  )
}

function PebbleProgress({ total, completed, current }: { total: number; completed: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const state = i < completed ? 'done' : i === current ? 'now' : 'todo'
        return (
          <span
            key={i}
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
