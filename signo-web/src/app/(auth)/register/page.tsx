'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { RegisterInput } from '@/lib/auth/auth.schema'

const inputClass =
  'w-full px-3 py-2 rounded-btn border border-bark/20 bg-white focus:outline-none focus:border-moss'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<RegisterInput>({
    username: '',
    password: '',
    nickname: '',
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErr(j.error || '注册失败')
        return
      }
      router.push('/')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl mb-4 text-moss font-semibold">加入森林</h1>
        <form onSubmit={submit} className="space-y-3">
          <input
            className={inputClass}
            placeholder="用户名"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="昵称"
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
          />
          <input
            type="password"
            className={inputClass}
            placeholder="密码（至少 6 位）"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {err && <p className="text-ochre text-sm">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? '注册中…' : '注册'}
          </Button>
        </form>
        <a href="/login" className="block mt-4 text-sm text-bark/70">
          已有账号？登录
        </a>
      </Card>
    </main>
  )
}
