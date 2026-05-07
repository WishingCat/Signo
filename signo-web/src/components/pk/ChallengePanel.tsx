'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Friend = { id: string; nickname: string; friendCode: string; tier: number }

const THEMES = ['常用语', '数字', '身体'] as const
const MODES = [
  { key: 'casual', label: '休闲', desc: '不计时 · 答对+1 / 答错-1' },
  { key: 'timed',  label: '限时', desc: '总时长内尽量答 · +1/-1' },
  { key: 'hell',   label: '地狱', desc: '每题 5s · 3s 内 +10 / 否则 +5 / 错或超 0' },
] as const
const TIMED_OPTIONS = [30, 60, 90] as const

export function ChallengePanel({ friends }: { friends: Friend[] }) {
  const router = useRouter()
  const [theme, setTheme] = useState<typeof THEMES[number]>('常用语')
  const [mode, setMode] = useState<typeof MODES[number]['key']>('casual')
  const [timedSec, setTimedSec] = useState<typeof TIMED_OPTIONS[number]>(60)
  const [friendCode, setFriendCode] = useState<string>(friends[0]?.friendCode ?? '')
  const [pending, setPending] = useState<{ inviteId: string; expiresAt: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (friends.length === 0) {
    return (
      <Card density="cozy" className="text-center text-[13px] text-bark/65">
        还没有林友 — 先去 <a href="/friends" className="text-moss underline">加林友</a>，回来才能开战。
      </Card>
    )
  }

  async function send() {
    if (!friendCode || busy) return
    setErr(null); setBusy(true)
    const modeConfig = mode === 'timed' ? { mode, totalSec: timedSec } : { mode }
    try {
      const res = await fetch('/api/pk/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendCode, theme, mode, modeConfig }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data?.error === 'PENDING_EXISTS' ? '已有一个等待中的邀请' :
               data?.error === 'NOT_FRIEND' ? '不是林友' :
               data?.error === 'NOT_FOUND' ? '林友不存在' : '发起失败')
        return
      }
      setPending({ inviteId: data.inviteId, expiresAt: data.expiresAt })
      // Poll until accepted (matchId returned via inbox watch on the inviter side
      // is not shown — we instead poll the invite status.)
      const start = Date.now()
      while (Date.now() - start < 65_000) {
        await new Promise((r) => setTimeout(r, 2000))
        const s = await fetch(`/api/pk/invite/status?inviteId=${data.inviteId}`)
        if (s.ok) {
          const sd = await s.json()
          if (sd.status === 'accepted' && sd.matchId) {
            router.push(`/pk/match/${sd.matchId}`)
            return
          }
          if (sd.status === 'declined' || sd.status === 'timeout') {
            setErr(sd.status === 'declined' ? '对方拒绝了挑战' : '邀请超时')
            setPending(null)
            return
          }
        }
      }
      setErr('邀请超时')
      setPending(null)
    } finally {
      setBusy(false)
    }
  }

  if (pending) {
    return (
      <Card density="cozy" className="text-center space-y-2">
        <p className="brush-text text-[16px] text-ink">等待对方接受...</p>
        <p className="text-[12px] text-bark/55">最长 60 秒，超时会自动取消</p>
        <Button variant="ink" size="md" onClick={() => { setPending(null); setErr(null) }}>
          取消等待
        </Button>
      </Card>
    )
  }

  return (
    <Card density="cozy" className="space-y-4">
      <div>
        <Label>主题</Label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {THEMES.map((t) => (
            <Chip key={t} active={theme === t} onClick={() => setTheme(t)} testid={`pk-theme-${t}`}>
              {t}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <Label>规则</Label>
        <div className="grid grid-cols-1 gap-1.5 mt-1.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              data-testid={`pk-mode-${m.key}`}
              onClick={() => setMode(m.key)}
              className={cn(
                'text-left rounded-[10px] border px-3 py-2 transition-colors',
                mode === m.key
                  ? 'border-hazel bg-hazel/10'
                  : 'border-bark/15 hover:border-hazel/40',
              )}
            >
              <div className="text-[13px] text-ink">{m.label}</div>
              <div className="text-[11px] text-bark/55 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
        {mode === 'timed' && (
          <div className="flex gap-2 mt-2">
            {TIMED_OPTIONS.map((s) => (
              <Chip key={s} active={timedSec === s} onClick={() => setTimedSec(s)}>
                {s}s
              </Chip>
            ))}
          </div>
        )}
      </div>
      <div>
        <Label>对手</Label>
        <select
          value={friendCode}
          onChange={(e) => setFriendCode(e.target.value)}
          className="mt-1.5 w-full rounded-[8px] border border-bark/20 bg-cream px-3 py-2 text-[14px] text-ink"
          data-testid="pk-friend-select"
        >
          {friends.map((f) => (
            <option key={f.id} value={f.friendCode}>{f.nickname} · {f.friendCode}</option>
          ))}
        </select>
      </div>
      {err && <p className="text-[12px] text-ochre">{err}</p>}
      <Button onClick={send} disabled={busy} className="w-full" data-testid="pk-send-invite">
        {busy ? '发送中...' : '发起挑战'}
      </Button>
    </Card>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] tracking-[0.25em] uppercase text-bark/55">{children}</span>
}

function Chip({
  children, active, onClick, testid,
}: { children: React.ReactNode; active: boolean; onClick: () => void; testid?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={cn(
        'rounded-full px-3 py-1 text-[12px] border transition-colors',
        active
          ? 'bg-hazel text-cream border-hazel'
          : 'bg-oat text-ink border-bark/15 hover:border-hazel/50',
      )}
    >
      {children}
    </button>
  )
}
