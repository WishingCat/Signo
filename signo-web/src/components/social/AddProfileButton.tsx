'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function AddProfileButton({ friendCode }: { friendCode: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function add() {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: friendCode }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErr(j.error || '加不上')
        return
      }
      setDone(true)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Button variant="ink" className="w-full" disabled>
        已加为林友 ✓
      </Button>
    )
  }

  return (
    <div className="w-full">
      <Button className="w-full" onClick={add} disabled={busy}>
        {busy ? '添加中…' : '加为林友'}
      </Button>
      {err && <p className="text-[12px] text-ochre mt-1 text-center">{err}</p>}
    </div>
  )
}
