'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DuelChoice, DuelHud } from '@/components/pk/DuelChoice'
import { CompletionDuel } from '@/components/pk/CompletionDuel'

type StateEvent = {
  type: 'state'
  phase: 'countdown' | 'in-progress' | 'finished'
  questionIndex: number
  scores: Record<string, number>
  countdownRemainingMs: number
  currentQuestion: { signId: number; choices: string[] } | null
  questionDeadlineMs: number | null
  endReason?: 'finished' | 'quit-a' | 'quit-b' | 'timeout'
  winnerId?: string | null
}

type Meta = {
  matchId: string; theme: string; mode: string; modeConfig: string
  aId: string; bId: string; selfId: string
}

export default function PkMatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const router = useRouter()
  const [meta, setMeta] = useState<Meta | null>(null)
  const [state, setState] = useState<StateEvent | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [oppNick, setOppNick] = useState<string>('对手')
  const submittingRef = useRef(false)

  useEffect(() => {
    let cancel = false
    fetch(`/api/pk/match/${matchId}/state`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((data: { meta: Meta; state: StateEvent }) => {
        if (cancel) return
        setMeta(data.meta)
        setState(data.state)
      })
      .catch(() => { if (!cancel) setErr('对局加载失败') })
    return () => { cancel = true }
  }, [matchId])

  // SSE subscription
  useEffect(() => {
    if (!meta || state?.phase === 'finished') return
    const es = new EventSource(`/api/pk/match/${matchId}/events`)
    es.addEventListener('state', (e) => {
      try { setState(JSON.parse((e as MessageEvent).data)) } catch {}
    })
    es.addEventListener('countdown', () => {
      // countdown ticks update via state snapshot too; ignore for now
    })
    es.addEventListener('question', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as {
          index: number; signId: number; choices: string[]; deadlineMs: number | null
        }
        setPicked(null)
        setState((prev) => prev ? {
          ...prev,
          phase: 'in-progress',
          questionIndex: data.index,
          currentQuestion: { signId: data.signId, choices: data.choices },
          questionDeadlineMs: data.deadlineMs,
          countdownRemainingMs: 0,
        } : prev)
      } catch {}
    })
    es.addEventListener('answered', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as {
          userId: string; scores: Record<string, number>
        }
        setState((prev) => prev ? { ...prev, scores: data.scores } : prev)
      } catch {}
    })
    es.addEventListener('finished', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as {
          reason: 'finished' | 'quit-a' | 'quit-b' | 'timeout'
          scores: Record<string, number>
          winnerId: string | null
        }
        setState((prev) => prev ? {
          ...prev, phase: 'finished',
          scores: data.scores, winnerId: data.winnerId, endReason: data.reason,
        } : prev)
      } catch {}
      es.close()
    })
    es.onerror = () => { /* let auto-reconnect handle it */ }
    return () => es.close()
  }, [meta, matchId, state?.phase])

  // Lookup opponent nickname (best-effort — uses public profile by friend code via a lightweight endpoint).
  useEffect(() => {
    if (!meta) return
    const oppId = meta.selfId === meta.aId ? meta.bId : meta.aId
    fetch(`/api/pk/who?userId=${oppId}`).then(async (r) => {
      if (r.ok) {
        const j = await r.json()
        if (j?.nickname) setOppNick(j.nickname)
      }
    }).catch(() => {})
  }, [meta])

  if (err) {
    return (
      <div className="py-10">
        <Card className="text-center">
          <p className="text-ochre mb-3">{err}</p>
          <Button onClick={() => router.push('/pk')}>回到知识竞赛</Button>
        </Card>
      </div>
    )
  }
  if (!meta || !state) {
    return <div className="py-10 text-center text-bark/55">对局准备中…</div>
  }

  const selfScore = state.scores[meta.selfId] ?? 0
  const oppId = meta.selfId === meta.aId ? meta.bId : meta.aId
  const oppScore = state.scores[oppId] ?? 0

  if (state.phase === 'finished') {
    return (
      <div className="py-6 space-y-3">
        <CompletionDuel
          reason={(state.endReason ?? 'finished')}
          selfId={meta.selfId}
          aId={meta.aId}
          bId={meta.bId}
          scores={state.scores}
          winnerId={state.winnerId ?? null}
          onBack={() => router.push('/pk')}
        />
      </div>
    )
  }

  if (state.phase === 'countdown') {
    const sec = Math.ceil(state.countdownRemainingMs / 1000)
    return (
      <div className="py-10 text-center space-y-3 bloom-in" data-testid="duel-countdown">
        <p className="text-[13px] text-bark/55">即将开始</p>
        <div className="brush-text text-[72px] text-hazel tabular-nums leading-none">
          {sec > 0 ? sec : '开始'}
        </div>
        <p className="text-[12px] text-bark/45">两人都已就位，倒计时 3 秒</p>
      </div>
    )
  }

  // in-progress
  const q = state.currentQuestion
  if (!q) {
    return <div className="py-10 text-center text-bark/55">等待下一题…</div>
  }

  async function pick(i: number) {
    if (submittingRef.current || picked !== null) return
    submittingRef.current = true
    setPicked(i)
    try {
      const res = await fetch(`/api/pk/match/${matchId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qIndex: state!.questionIndex, choice: i }),
      })
      if (!res.ok) {
        // server rejected (e.g. round already advanced); unlock for next question
        setPicked(null)
      }
    } finally {
      submittingRef.current = false
    }
  }

  async function quit() {
    await fetch(`/api/pk/match/${matchId}/quit`, { method: 'POST' })
  }

  return (
    <div className="py-5 space-y-4 bloom-in">
      <DuelHud
        selfName="你"
        oppName={oppNick}
        selfScore={selfScore}
        oppScore={oppScore}
      />
      <DuelChoice
        signId={q.signId}
        choices={q.choices}
        questionIndex={state.questionIndex}
        total={15}
        deadlineMs={state.questionDeadlineMs}
        picked={picked}
        locked={picked !== null}
        onPick={pick}
      />
      <button
        onClick={quit}
        className="block mx-auto text-[12px] text-bark/45 hover:text-ochre underline-offset-2 hover:underline"
      >
        弃权
      </button>
    </div>
  )
}
