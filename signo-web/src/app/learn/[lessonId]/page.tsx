'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuestionCard } from '@/components/learn/QuestionCard'
import { Mascot } from '@/components/forest/Mascot'
import { Leaf } from '@/components/forest/Leaf'
import { Firefly } from '@/components/forest/Firefly'
import { cn } from '@/lib/utils'
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
    return (
      <div className="py-10"><Card><p className="text-bark/70">这关还没有叶子。</p></Card></div>
    )
  }

  if (done) return <CompletionScreen result={done} onBack={() => router.push('/')} />

  const q = questions[index]
  const finished = answers.length

  return (
    <div className="py-6 space-y-5 bloom-in">
      <PebbleProgress total={questions.length} completed={finished} current={index} />

      <Card tilt="left" density="cozy">
        <QuestionCard
          key={q.id}
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
                setIndex(index + 1)
                startRef.current = Date.now()
                return
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
        const state =
          i < completed ? 'done' : i === current ? 'now' : 'todo'
        return (
          <span
            key={i}
            aria-label={`第 ${i + 1} 题 ${state}`}
            className={cn(
              'transition-all duration-300',
              state === 'done' && 'h-2.5 w-2.5 rounded-full bg-moss',
              state === 'now' && 'h-3 w-8 rounded-full bg-hazel shadow-[0_0_0_4px_rgba(199,127,68,0.15)]',
              state === 'todo' && 'h-2.5 w-2.5 rounded-full bg-bark/15',
            )}
          />
        )
      })}
    </div>
  )
}

function CompletionScreen({ result, onBack }: { result: ClearLessonResult; onBack: () => void }) {
  const perfect = result.correct === result.total
  const mascotName = perfect ? 'fox' : 'squirrel'
  const streakMessage = streakBanner(result.streak)
  return (
    <div className="py-8 relative bloom-in" data-testid="lesson-complete">
      {[
        { left: '8%',  delay: '0s',   color: 'var(--color-moss)',  rotate: -20, size: 34 },
        { left: '24%', delay: '0.4s', color: 'var(--color-sage)',  rotate: 12,  size: 28 },
        { left: '74%', delay: '0.2s', color: 'var(--color-hazel)', rotate: -10, size: 30 },
        { left: '88%', delay: '0.8s', color: 'var(--color-moss)',  rotate: 30,  size: 26 },
      ].map((l, i) => (
        <div
          key={i}
          className="absolute top-0 pointer-events-none"
          style={{ left: l.left, animation: `celebrate-leaves 4.5s ${l.delay} cubic-bezier(.3,.5,.5,1) infinite` }}
        >
          <Leaf size={l.size} color={l.color} rotate={l.rotate} />
        </div>
      ))}

      <div className="text-center mb-5 relative">
        <div className="relative inline-block">
          <Firefly className="absolute -top-2 -left-4" intensity={1} />
          <Firefly className="absolute -top-1 -right-5" intensity={0.8} period={2.8} />
          <Firefly className="absolute top-8 left-12" intensity={0.6} period={4} />
          <Mascot name={mascotName} className="h-28 w-28 mx-auto text-bark" />
        </div>
        <h1 className="brush-text text-[28px] mt-2">
          {perfect ? '叶落满径' : '又有一片叶子落下'}
        </h1>
        <p className="text-[13px] text-bark/60 mt-1">
          {perfect ? '全部答对——林子给你鼓掌' : '慢慢来，树也没有一次就长高'}
        </p>
        {streakMessage && (
          <p className="mt-2 text-[13px] text-hazel">
            <span className="inline-block align-middle mr-1">🔥</span>
            {streakMessage}
          </p>
        )}
      </div>

      <Card tilt="right" density="loose" className="mx-2">
        <div className="flex justify-center gap-1 mb-4">
          {[1, 2, 3].map((s) => (
            <StarIcon key={s} lit={s <= result.stars} index={s} />
          ))}
        </div>

        <div className="flex items-end justify-center gap-6 mb-4">
          <Stat label="答对" value={`${result.correct} / ${result.total}`} />
          <Stat label="获得" value={`+${result.xp} XP`} accent testId="xp-gain" />
          <Stat label="连胜" value={`${result.streak.currentStreak} 天`} />
        </div>

        <Button size="lg" className="w-full" onClick={onBack}>
          回到森林
        </Button>
      </Card>
    </div>
  )
}

function streakBanner(s: ClearLessonResult['streak']): string | null {
  if (s.event === 'started') return '连胜第 1 天——林子记住了你的脚印。'
  if (s.event === 'continued') {
    if (s.currentStreak === s.bestStreak && s.currentStreak >= 3) return `连胜 ${s.currentStreak} 天！打破你自己最好成绩。`
    return `连胜 ${s.currentStreak} 天`
  }
  if (s.event === 'reset') return '重新点起火苗——从今天再数。'
  return null
}

function Stat({ label, value, accent = false, testId }: { label: string; value: string; accent?: boolean; testId?: string }) {
  return (
    <div className="text-center">
      <div
        data-testid={testId}
        className={cn(
          'font-[family-name:var(--font-latin)] leading-none',
          accent ? 'text-[30px] text-hazel' : 'text-[22px] text-ink',
        )}
      >
        {value}
      </div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-bark/50 mt-1">{label}</div>
    </div>
  )
}

function StarIcon({ lit, index }: { lit: boolean; index: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-9 w-9 transition-all', lit ? 'text-hazel' : 'text-bark/15')}
      style={{ animation: lit ? `bloom-in 500ms ${index * 140}ms both` : undefined }}
      fill="currentColor"
    >
      <path d="M12 2 L14.8 9 L22 9.6 L16.4 14.4 L18.2 21.4 L12 17.6 L5.8 21.4 L7.6 14.4 L2 9.6 L9.2 9 Z" />
    </svg>
  )
}
