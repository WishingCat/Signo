'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { LoginInput } from '@/lib/auth/auth.schema'

const inputClass =
  'w-full px-3 py-2 rounded-btn border border-bark/20 bg-white focus:outline-none focus:border-moss'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState<LoginInput>({ username: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErr(j.error || '登录失败')
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
        <h1 className="text-xl mb-4 text-moss font-semibold">回到森林</h1>
        <form onSubmit={submit} className="space-y-3">
          <input
            className={inputClass}
            placeholder="用户名"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            type="password"
            className={inputClass}
            placeholder="密码"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {err && <p className="text-ochre text-sm">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? '登录中…' : '登录'}
          </Button>
        </form>
        <a href="/register" className="block mt-4 text-sm text-bark/70">
          还没有账号？注册
        </a>
      </Card>
    </main>
  )
}
