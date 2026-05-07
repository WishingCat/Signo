'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type InboxItem = {
  id: string
  inviterId: string
  inviterNickname: string
  inviterFriendCode: string
  inviterTier: number
  theme: string
  mode: string
  modeConfig: string
  expiresAt: string
}

const MODE_LABEL: Record<string, string> = {
  casual: '休闲',
  timed: '限时',
  hell: '地狱',
}

export function InviteInbox() {
  const router = useRouter()
  const [items, setItems] = useState<InboxItem[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    const tick = async () => {
      try {
        const r = await fetch('/api/pk/invite/inbox', { cache: 'no-store' })
        if (!r.ok) return
        const data = await r.json()
        if (!cancel) setItems(data.invites ?? [])
      } catch {}
    }
    tick()
    const id = setInterval(tick, 2500)
    return () => { cancel = true; clearInterval(id) }
  }, [])

  if (items.length === 0) return null

  async function respond(inviteId: string, accept: boolean) {
    setBusyId(inviteId); setErr(null)
    try {
      const res = await fetch('/api/pk/invite/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, accept }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data?.error ?? '响应失败')
        return
      }
      if (data.matchId) {
        router.push(`/pk/match/${data.matchId}`)
        return
      }
      // Decline path → just refresh local list.
      setItems((xs) => xs.filter((x) => x.id !== inviteId))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card density="cozy" className="space-y-2">
      <p className="brush-text text-[16px] text-ink">来自林友的挑战</p>
      <ul className="space-y-2">
        {items.map((iv) => {
          const cfg = (() => { try { return JSON.parse(iv.modeConfig) } catch { return {} } })()
          const tail =
            iv.mode === 'timed' && cfg?.totalSec ? `${cfg.totalSec}s` : null
          return (
            <li
              key={iv.id}
              className="rounded-[10px] border border-bark/15 bg-cream px-3 py-2 flex items-center gap-3"
              data-testid={`invite-${iv.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-ink truncate">{iv.inviterNickname}</div>
                <div className="text-[11px] text-bark/55 mt-0.5">
                  {iv.theme} · {MODE_LABEL[iv.mode] ?? iv.mode}{tail ? ' · ' + tail : ''}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => respond(iv.id, true)}
                disabled={busyId === iv.id}
                data-testid="invite-accept"
              >
                接受
              </Button>
              <Button
                variant="ink"
                size="sm"
                onClick={() => respond(iv.id, false)}
                disabled={busyId === iv.id}
                data-testid="invite-decline"
              >
                拒绝
              </Button>
            </li>
          )
        })}
      </ul>
      {err && <p className="text-[12px] text-ochre">{err}</p>}
    </Card>
  )
}
