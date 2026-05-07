'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const inputCls =
  'w-full bg-transparent border border-dashed border-bark/30 rounded-[12px] px-3 py-2 text-[14px] text-ink placeholder:text-bark/35 focus:outline-none focus:border-moss focus:border-solid'

export function CreateTeamForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) {
        setErr(j.error || '创建失败')
        return
      }
      router.push(`/teams/${j.team.id}`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="block text-[11px] tracking-[0.2em] uppercase text-bark/50 mb-1">队名</span>
        <input
          className={inputCls}
          placeholder="取一个林间的名字"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </label>
      {err && <p className="text-[12px] text-ochre">{err}</p>}
      <Button type="submit" size="md" className="w-full" disabled={busy || !name.trim()}>
        {busy ? '创建中…' : '创建队伍'}
      </Button>
    </form>
  )
}
