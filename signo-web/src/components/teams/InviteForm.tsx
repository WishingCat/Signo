'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const inputCls =
  'flex-1 bg-transparent border border-dashed border-bark/30 rounded-[12px] px-3 py-2 text-[14px] tracking-[0.2em] uppercase text-ink placeholder:text-bark/35 focus:outline-none focus:border-moss focus:border-solid'

export function InviteForm({ teamId }: { teamId: string }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setOk(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendCode: code.trim().toUpperCase() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) {
        setErr(j.error || '邀请失败')
        return
      }
      setOk(`已向 ${j.invite.inviteeNickname} 发送邀请`)
      setCode('')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="relative">
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="林友的好友码"
          value={code}
          maxLength={12}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button type="submit" size="md" disabled={busy || !code}>
          {busy ? '邀请中' : '邀请'}
        </Button>
      </div>
      {err && <p className="mt-1 text-[12px] text-ochre">{err}</p>}
      {ok && <p className="mt-1 text-[12px] text-moss">{ok}</p>}
    </form>
  )
}
