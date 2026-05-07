'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Props = { inviteId: string }

export function RespondInviteButtons({ inviteId }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function respond(accept: boolean) {
    setErr(null)
    setBusy(accept ? 'accept' : 'decline')
    try {
      const res = await fetch('/api/teams/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, accept }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) {
        setErr(j.error || '操作失败')
        return
      }
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5 w-full sm:w-auto">
      <div className="flex gap-2">
        <Button size="sm" disabled={busy !== null} onClick={() => respond(true)}>
          {busy === 'accept' ? '加入中' : '加入'}
        </Button>
        <Button size="sm" variant="ink" disabled={busy !== null} onClick={() => respond(false)}>
          {busy === 'decline' ? '…' : '婉拒'}
        </Button>
      </div>
      {err && <p className="text-[11px] text-ochre">{err}</p>}
    </div>
  )
}
