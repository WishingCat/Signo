'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mascot } from '@/components/forest/Mascot'
import { SketchDivider } from '@/components/forest/SketchDivider'
import type { LoginInput } from '@/lib/auth/auth.schema'

const inputClass =
  'w-full bg-transparent border-0 border-b border-dashed border-bark/30 px-1 py-2 ' +
  'text-[15px] font-[family-name:var(--font-book)] text-ink placeholder:text-bark/40 ' +
  'focus:outline-none focus:border-moss focus:border-solid transition-colors'

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
        setErr(j.error === 'invalid credentials' ? '名字或钥匙对不上' : j.error || '登录失败')
        return
      }
      router.push('/')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="py-10 bloom-in">
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <div
            className="absolute -inset-4 -z-10 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 62% 60%, rgba(243,201,105,0.45) 0%, rgba(243,201,105,0.08) 45%, transparent 70%)',
              filter: 'blur(2px)',
            }}
          />
          <Mascot name="firefly" className="h-24 w-24 mx-auto text-ink" title="萤火虫在等你" />
        </div>
        <h1 className="brush-text text-[34px] mt-1">归来啊</h1>
        <p className="text-[13px] text-bark/60 italic mt-1">
          林间的那盏小灯<span className="mx-1 brush-text text-moss">还亮着</span>。
        </p>
      </div>

      <Card tilt="right" density="loose" className="mx-2">
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="block text-[12px] tracking-[0.2em] uppercase text-bark/50 font-[family-name:var(--font-latin)] mb-1">
              你的林中名字
            </span>
            <input
              className={inputClass}
              placeholder="用户名"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="block text-[12px] tracking-[0.2em] uppercase text-bark/50 font-[family-name:var(--font-latin)] mb-1">
              钥匙
            </span>
            <input
              type="password"
              className={inputClass}
              placeholder="密码"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
          </label>

          {err && (
            <div className="text-[13px] text-ochre bg-ochre/10 border border-ochre/30 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? '为你拨开树叶…' : '点亮这盏灯'}
          </Button>
        </form>

        <SketchDivider className="my-5" />

        <a href="/register" className="block text-center text-[13px] text-bark/60 hover:text-moss">
          还没有<span className="ink-underline mx-1">林间小屋</span>·先来盖一间
        </a>
      </Card>
    </div>
  )
}
