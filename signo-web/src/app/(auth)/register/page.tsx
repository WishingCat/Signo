'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mascot } from '@/components/forest/Mascot'
import { Fern } from '@/components/forest/Fern'
import { Mushroom } from '@/components/forest/Mushroom'
import { Berry } from '@/components/forest/Berry'
import { Vine } from '@/components/forest/Vine'
import { SketchDivider } from '@/components/forest/SketchDivider'
import type { RegisterInput } from '@/lib/auth/auth.schema'

const inputClass =
  'w-full bg-transparent border-0 border-b border-dashed border-bark/30 px-1 py-2 ' +
  'text-[15px] font-[family-name:var(--font-book)] text-ink placeholder:text-bark/40 ' +
  'focus:outline-none focus:border-moss focus:border-solid transition-colors'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<RegisterInput>({ username: '', password: '', nickname: '' })
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
        setErr(j.error === 'username taken' ? '这个名字已有人用了' : j.error || '注册失败')
        return
      }
      router.push('/')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="py-8 bloom-in relative">
      {/* corner decorations */}
      <Vine className="absolute -top-2 right-1 w-12 h-32 opacity-85 pointer-events-none" mirror />
      <Berry className="absolute top-32 -left-2 w-12 h-14 opacity-85 pointer-events-none -rotate-12" />
      <Fern className="absolute -bottom-4 -left-4 w-24 h-32 opacity-90 pointer-events-none" />
      <Mushroom variant="red" className="absolute bottom-2 right-2 w-14 h-16 opacity-90 pointer-events-none" />

      <div className="text-center mb-6 relative">
        <div className="relative inline-block">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(243,201,105,0.28) 0%, transparent 65%)',
            }}
          />
          <Mascot name="ant" className="h-20 w-20 mx-auto text-bark" title="小蚂蚁欢迎你" />
        </div>
        <h1 className="brush-text text-[34px] mt-2">走进森林</h1>
        <p className="text-[13px] text-bark/60 italic mt-1">
          一只小蚂蚁探出触角，用沉默的方式打招呼。
        </p>
      </div>

      <Card tilt="left" tape density="loose" className="mx-2">
        <form onSubmit={submit} className="space-y-5">
          <Field label="你想在林子里叫什么">
            <input
              className={inputClass}
              placeholder="用户名（字母 / 数字 / 下划线）"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
          </Field>
          <Field label="同伴们会看到的昵称">
            <input
              className={inputClass}
              placeholder="昵称"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
          </Field>
          <Field label="一把只有你知道的钥匙">
            <input
              type="password"
              className={inputClass}
              placeholder="密码，至少 6 位"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
          </Field>

          {err && (
            <div className="text-[13px] text-ochre bg-ochre/10 border border-ochre/30 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={busy} data-testid="register-submit">
            {busy ? '正在为你开辟一条小径…' : '进入森林'}
          </Button>
        </form>

        <SketchDivider className="my-5" />

        <a href="/login" className="block text-center text-[13px] text-bark/60 hover:text-moss">
          这已经是<span className="ink-underline mx-1">我的森林</span>·回去继续
        </a>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] tracking-[0.2em] uppercase text-bark/50 font-[family-name:var(--font-latin)] mb-1">
        {label}
      </span>
      {children}
    </label>
  )
}
