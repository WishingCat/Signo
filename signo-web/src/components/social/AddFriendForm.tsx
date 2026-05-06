'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { AddFriendInput } from '@/lib/social/friends.schema'

export function AddFriendForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setOk(null)
    setBusy(true)
    try {
      const payload: AddFriendInput = { code: code.trim().toUpperCase() }
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(j.error || '加不上')
        return
      }
      setOk(`${j.friend.nickname} 已经是你的林友`)
      setCode('')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="输入 6 位好友码"
        maxLength={12}
        className="flex-1 bg-transparent border border-dashed border-bark/30 rounded-[12px] px-3 py-2 text-[14px] tracking-[0.2em] uppercase text-ink placeholder:text-bark/35 focus:outline-none focus:border-moss focus:border-solid"
      />
      <Button type="submit" size="md" disabled={busy || !code}>
        {busy ? '加入中' : '加好友'}
      </Button>
      {err && <div className="absolute -bottom-6 text-[12px] text-ochre">{err}</div>}
      {ok && <div className="absolute -bottom-6 text-[12px] text-moss">{ok}</div>}
    </form>
  )
}
