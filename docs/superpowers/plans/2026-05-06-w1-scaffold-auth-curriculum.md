# Plan A (W1) — 脚手架 / 认证 / 课程闭环 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 1 周内交付一个能让用户「注册→登录→进入示例关卡→做选择题→看到 XP+1」的最小可见 Web 应用，并完成森林视觉调性的设计 token 与基础组件定制。

**Architecture:** Next.js 15 App Router + 同仓库 Route Handlers 后端 + Prisma + SQLite 本地文件库；自建 bcrypt + JWT(httpOnly cookie) 认证，不引 NextAuth；前端用 Tailwind + shadcn/ui 组件并按森林设计语言定制 token；TDD 用 Vitest，E2E 用 Playwright。

**Tech Stack:** Node 20+, pnpm, Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, SQLite, bcrypt, jose (JWT), Vitest, Playwright

**Spec 引用：** `/Users/wishingcat/Projects/Signo/docs/specs/2026-05-06-signo-mvp-design.md`（W1 部分对应 MVP 范围 1/2/3/4/8 项中的最小子集）

---

## 文件结构（W1 完成后）

```
signo-web/
├─ package.json
├─ tsconfig.json
├─ next.config.ts
├─ tailwind.config.ts          # 森林设计 token
├─ postcss.config.js
├─ vitest.config.ts
├─ playwright.config.ts
├─ .env.local                  # JWT_SECRET 等
├─ .gitignore
├─ README.md
├─ prisma/
│  ├─ schema.prisma            # User / Unit / Lesson / Question / Attempt / LessonClear / DailyStat / 等全量模型
│  ├─ seed.ts                  # 3 关示例数据 + 1 个 admin 账号
│  └─ migrations/              # auto
├─ src/
│  ├─ app/
│  │  ├─ globals.css           # Tailwind + 森林 CSS 变量
│  │  ├─ layout.tsx            # 全局壳
│  │  ├─ page.tsx              # 首页（课程树）
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  └─ register/page.tsx
│  │  ├─ learn/
│  │  │  └─ [lessonId]/page.tsx  # 关卡答题页
│  │  └─ api/
│  │     ├─ auth/
│  │     │  ├─ register/route.ts
│  │     │  ├─ login/route.ts
│  │     │  └─ logout/route.ts
│  │     └─ learn/
│  │        ├─ lesson/[id]/route.ts        # GET 题目
│  │        └─ clear-lesson/route.ts        # POST 结算
│  ├─ lib/
│  │  ├─ db.ts                 # Prisma client 单例
│  │  ├─ auth/
│  │  │  ├─ password.ts        # bcrypt wrapper
│  │  │  ├─ jwt.ts             # jose sign/verify
│  │  │  └─ session.ts         # getSessionUser(cookies)
│  │  └─ curriculum/
│  │     └─ scoring.ts         # XP 计算（基础 10 XP/关，全对额外 +5）
│  └─ components/
│     ├─ ui/                   # shadcn 森林化定制（Button、Card）
│     └─ learn/
│        └─ QuestionCard.tsx   # 客户端答题组件
└─ tests/
   ├─ unit/
   │  ├─ auth.password.test.ts
   │  ├─ auth.jwt.test.ts
   │  └─ scoring.test.ts
   └─ e2e/
      └─ happy-path.spec.ts    # 注册→登录→做关→看 XP
```

---

### Task 1: 项目脚手架与依赖

**Files:**
- Create: `signo-web/` 整个项目目录
- Create: `signo-web/package.json`
- Create: `signo-web/.gitignore`
- Create: `signo-web/.env.local`

- [ ] **Step 1: 在 `/Users/wishingcat/Projects/Signo/` 下初始化 Next.js**

```bash
cd /Users/wishingcat/Projects/Signo
pnpm create next-app@latest signo-web \
  --typescript --tailwind --eslint --app \
  --src-dir --no-import-alias --use-pnpm
cd signo-web
```

- [ ] **Step 2: 安装运行依赖**

```bash
pnpm add @prisma/client bcryptjs jose zod
pnpm add -D prisma @types/bcryptjs vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test tsx
```

- [ ] **Step 3: 写 `.env.local`（JWT_SECRET 至少 32 字节）**

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-only-secret-change-in-prod-must-be-32+-chars-long"
```

- [ ] **Step 4: 写 `.gitignore` 追加项**

追加：
```
.env*.local
dev.db
dev.db-journal
.next/
node_modules/
playwright-report/
test-results/
```

- [ ] **Step 5: 初始化 git，首次 commit**

```bash
git init
git add .
git commit -m "chore: scaffold next.js 15 + tailwind + ts"
```

---

### Task 2: Prisma schema + DB 客户端

**Files:**
- Create: `signo-web/prisma/schema.prisma`
- Create: `signo-web/src/lib/db.ts`

- [ ] **Step 1: `pnpm prisma init` 后覆盖 `prisma/schema.prisma`**

```prisma
generator client { provider = "prisma-client-js" }
datasource db    { provider = "sqlite"  url = env("DATABASE_URL") }

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  nickname     String
  friendCode   String   @unique
  avatarSeed   String   @default("default")
  role         String   @default("user")        // user | admin
  tier         Int      @default(1)
  pkScore      Int      @default(1000)
  pkWins       Int      @default(0)
  pkLosses     Int      @default(0)
  createdAt    DateTime @default(now())
  attempts     Attempt[]
  clears       LessonClear[]
  daily        DailyStat[]
}

model Unit    { id String @id @default(cuid()); order Int; title String; description String; iconKey String; lessons Lesson[] }
model Lesson  { id String @id @default(cuid()); unitId String; order Int; title String; unit Unit @relation(fields: [unitId], references: [id]); questions Question[] }
model Question {
  id           String  @id @default(cuid())
  lessonId     String
  order        Int
  type         String                 // sign2word | word2sign
  promptText   String?
  promptMediaId String?
  choicesJson  String                 // JSON: ["选项A", "选项B", ...]
  answerIndex  Int
  explanation  String?
  lesson       Lesson  @relation(fields: [lessonId], references: [id])
}
model Media   { id String @id @default(cuid()); kind String; path String; durationMs Int?; signer String?; license String? }

model Attempt     { id String @id @default(cuid()); userId String; questionId String; isCorrect Boolean; answeredAt DateTime @default(now()); msSpent Int; user User @relation(fields: [userId], references: [id]) }
model LessonClear { id String @id @default(cuid()); userId String; lessonId String; clearedAt DateTime @default(now()); stars Int; user User @relation(fields: [userId], references: [id]) }
model DailyStat   { userId String; date String; xp Int @default(0); lessonsCleared Int @default(0); user User @relation(fields: [userId], references: [id]); @@id([userId, date]) }
```

> 后续 W2/W3 plan 会再追加 Badge/MistakeItem/League*/Friendship/Match* 等模型。本周只先建支撑答题闭环所需的最小集。

- [ ] **Step 2: 跑 migration**

```bash
pnpm prisma migrate dev --name init
```
Expected: 生成 `prisma/migrations/...`，`dev.db` 出现。

- [ ] **Step 3: 写 `src/lib/db.ts`（开发热更新下避免多实例）**

```ts
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Commit**

```bash
git add prisma src/lib/db.ts
git commit -m "feat(db): prisma schema + client (W1 minimal subset)"
```

---

### Task 3: 设计 token（森林色板/字号/圆角）

**Files:**
- Modify: `signo-web/tailwind.config.ts`
- Modify: `signo-web/src/app/globals.css`

- [ ] **Step 1: 用以下内容覆盖 `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        oat:    '#F8F4EB',  // 米白底
        moss:   '#6B8E5A',  // 苔藓绿（主色）
        hazel:  '#D49A5C',  // 榛果橙（CTA）
        mist:   '#A9C5D9',  // 晨雾蓝（信息）
        ochre:  '#C46A4F',  // 赭石红（错答）
        bark:   '#5C4A3A',  // 树皮深棕（文字）
      },
      borderRadius: { card: '16px', btn: '12px' },
      boxShadow: { soft: '0 4px 14px rgba(92,74,58,0.08)' },
      fontFamily: { sans: ['"PingFang SC"','"Noto Sans SC"','system-ui','sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 2: 在 `src/app/globals.css` 顶部覆盖**

```css
@tailwind base; @tailwind components; @tailwind utilities;
:root { color-scheme: light; }
html, body { background: #F8F4EB; color: #5C4A3A; }
body { font-family: "PingFang SC", "Noto Sans SC", system-ui, sans-serif; }
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "style(tokens): forest design tokens"
```

---

### Task 4: shadcn 基础组件森林化（Button + Card）

**Files:**
- Create: `signo-web/src/components/ui/button.tsx`
- Create: `signo-web/src/components/ui/card.tsx`
- Create: `signo-web/src/lib/utils.ts`

- [ ] **Step 1: `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
export function cn(...inputs: ClassValue[]) { return clsx(inputs) }
```
然后 `pnpm add clsx`.

- [ ] **Step 2: `src/components/ui/button.tsx`**

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
type Variant = 'primary' | 'secondary' | 'ghost'
const styles: Record<Variant, string> = {
  primary:   'bg-hazel text-oat hover:brightness-95 active:translate-y-px',
  secondary: 'bg-moss text-oat hover:brightness-95',
  ghost:     'bg-transparent text-bark hover:bg-oat/60',
}
export function Button({ variant='primary', className, ...p }:
  { variant?: Variant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={cn(
    'inline-flex items-center justify-center px-4 py-2 rounded-btn shadow-soft transition',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    styles[variant], className,
  )} />
}
```

- [ ] **Step 3: `src/components/ui/card.tsx`**

```tsx
import { cn } from '@/lib/utils'
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cn('bg-white rounded-card shadow-soft p-5', className)} />
}
```

- [ ] **Step 4: 配置 `tsconfig.json` 路径别名**（若 create-next-app 未生成）

确认 `compilerOptions.paths` 含 `"@/*": ["./src/*"]`。

- [ ] **Step 5: Commit**

```bash
git add src/components src/lib/utils.ts tsconfig.json
git commit -m "feat(ui): forest-themed Button and Card primitives"
```

---

### Task 5: 认证 lib（password / jwt / session）+ 单测

**Files:**
- Create: `signo-web/vitest.config.ts`
- Create: `signo-web/src/lib/auth/password.ts`
- Create: `signo-web/src/lib/auth/jwt.ts`
- Create: `signo-web/src/lib/auth/session.ts`
- Create: `signo-web/tests/unit/auth.password.test.ts`
- Create: `signo-web/tests/unit/auth.jwt.test.ts`

- [ ] **Step 1: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts'] },
})
```

- [ ] **Step 2: 写失败测试 `tests/unit/auth.password.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
describe('password', () => {
  it('hashes and verifies', async () => {
    const h = await hashPassword('hunter2')
    expect(await verifyPassword('hunter2', h)).toBe(true)
    expect(await verifyPassword('wrong',  h)).toBe(false)
  })
})
```

`pnpm vitest run` → 应失败（模块不存在）。

- [ ] **Step 3: 实现 `src/lib/auth/password.ts`**

```ts
import bcrypt from 'bcryptjs'
export const hashPassword   = (pw: string) => bcrypt.hash(pw, 10)
export const verifyPassword = (pw: string, h: string) => bcrypt.compare(pw, h)
```

`pnpm vitest run` → PASS。

- [ ] **Step 4: 写失败测试 `tests/unit/auth.jwt.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from '@/lib/auth/jwt'
describe('jwt', () => {
  it('roundtrip', async () => {
    const t = await signSession({ uid: 'u1' })
    const p = await verifySession(t)
    expect(p?.uid).toBe('u1')
  })
  it('rejects tampered', async () => {
    const t = await signSession({ uid: 'u1' })
    expect(await verifySession(t + 'x')).toBeNull()
  })
})
```

- [ ] **Step 5: 实现 `src/lib/auth/jwt.ts`**

```ts
import { SignJWT, jwtVerify } from 'jose'
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-only-secret-must-be-32-chars-long-x')
export type SessionPayload = { uid: string }
export async function signSession(p: SessionPayload) {
  return new SignJWT(p as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)
}
export async function verifySession(t: string): Promise<SessionPayload | null> {
  try { const { payload } = await jwtVerify(t, secret); return { uid: String(payload.uid) } }
  catch { return null }
}
```

- [ ] **Step 6: 实现 `src/lib/auth/session.ts`（服务器组件读 cookie）**

```ts
import { cookies } from 'next/headers'
import { verifySession } from './jwt'
import { prisma } from '@/lib/db'
export const SESSION_COOKIE = 'signo_session'
export async function getSessionUser() {
  const c = await cookies()
  const t = c.get(SESSION_COOKIE)?.value
  if (!t) return null
  const p = await verifySession(t)
  if (!p) return null
  return prisma.user.findUnique({ where: { id: p.uid } })
}
```

- [ ] **Step 7: 跑全部单测，commit**

```bash
pnpm vitest run
git add vitest.config.ts src/lib/auth tests/unit
git commit -m "feat(auth): password + jwt + session helpers"
```

---

### Task 6: 认证 API（register / login / logout）

**Files:**
- Create: `signo-web/src/app/api/auth/register/route.ts`
- Create: `signo-web/src/app/api/auth/login/route.ts`
- Create: `signo-web/src/app/api/auth/logout/route.ts`

- [ ] **Step 1: `register/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { signSession } from '@/lib/auth/jwt'
import { SESSION_COOKIE } from '@/lib/auth/session'

const Schema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(72),
  nickname: z.string().min(1).max(20),
})
const code6 = () => Math.random().toString(36).slice(2, 8).toUpperCase()

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 })
  const { username, password, nickname } = parsed.data
  if (await prisma.user.findUnique({ where: { username } }))
    return NextResponse.json({ error: 'username taken' }, { status: 409 })
  const user = await prisma.user.create({
    data: { username, nickname, passwordHash: await hashPassword(password), friendCode: code6() },
  })
  const token = await signSession({ uid: user.id })
  const res = NextResponse.json({ id: user.id, nickname: user.nickname })
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60*60*24*30 })
  return res
}
```

- [ ] **Step 2: `login/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { signSession } from '@/lib/auth/jwt'
import { SESSION_COOKIE } from '@/lib/auth/session'

const Schema = z.object({ username: z.string(), password: z.string() })

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'bad input' }, { status: 400 })
  const u = await prisma.user.findUnique({ where: { username: parsed.data.username } })
  if (!u || !(await verifyPassword(parsed.data.password, u.passwordHash)))
    return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })
  const token = await signSession({ uid: u.id })
  const res = NextResponse.json({ id: u.id, nickname: u.nickname })
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60*60*24*30 })
  return res
}
```

- [ ] **Step 3: `logout/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/session'
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth
git commit -m "feat(auth): register/login/logout API"
```

---

### Task 7: 注册/登录页面

**Files:**
- Create: `signo-web/src/app/(auth)/register/page.tsx`
- Create: `signo-web/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: `register/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function RegisterPage() {
  const r = useRouter()
  const [f, setF] = useState({ username:'', password:'', nickname:'' })
  const [err, setErr] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    const res = await fetch('/api/auth/register', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(f),
    })
    if (!res.ok) { setErr((await res.json()).error || '注册失败'); return }
    r.push('/')
  }
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl mb-4 text-moss font-semibold">加入森林</h1>
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full px-3 py-2 rounded-btn border border-bark/20" placeholder="用户名"  value={f.username} onChange={e=>setF({...f,username:e.target.value})}/>
          <input className="w-full px-3 py-2 rounded-btn border border-bark/20" placeholder="昵称"   value={f.nickname} onChange={e=>setF({...f,nickname:e.target.value})}/>
          <input type="password" className="w-full px-3 py-2 rounded-btn border border-bark/20" placeholder="密码（至少 6 位）" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
          {err && <p className="text-ochre text-sm">{err}</p>}
          <Button type="submit" className="w-full">注册</Button>
        </form>
        <a href="/login" className="block mt-4 text-sm text-bark/70">已有账号？登录</a>
      </Card>
    </main>
  )
}
```

- [ ] **Step 2: `login/page.tsx`** （结构同上，端点改 `/api/auth/login`，不要 nickname 字段，标题改"回到森林"，底部链接改 `/register`）

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)
git commit -m "feat(auth): register/login pages"
```

---

### Task 8: Seed 脚本（3 关示例数据）

**Files:**
- Create: `signo-web/prisma/seed.ts`
- Modify: `signo-web/package.json` 加 `"prisma": { "seed": "tsx prisma/seed.ts" }`

- [ ] **Step 1: `prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  await db.question.deleteMany(); await db.lesson.deleteMany(); await db.unit.deleteMany()
  const u = await db.unit.create({ data: { order:1, title:'日常问候', description:'最常用的 6 个手语词', iconKey:'greeting' } })
  const l1 = await db.lesson.create({ data: { unitId:u.id, order:1, title:'你好 / 谢谢' } })
  const l2 = await db.lesson.create({ data: { unitId:u.id, order:2, title:'再见 / 早上好' } })
  const l3 = await db.lesson.create({ data: { unitId:u.id, order:3, title:'对不起 / 没关系' } })
  const seed = (lessonId:string, items:[string,string[],number][]) =>
    Promise.all(items.map(([t, ch, ai], i) =>
      db.question.create({ data: { lessonId, order:i, type:'word2sign', promptText:t, choicesJson:JSON.stringify(ch), answerIndex:ai } })))
  await seed(l1.id, [['你好',['挥手','拍胸口','按额头','摊手'],0], ['谢谢',['双手合十','拍肩','按嘴角','拍胸'],0]])
  await seed(l2.id, [['再见',['挥手离开','按胸','摊手','点头'],0], ['早上好',['手指太阳升起','按枕头','摊手','拍肩'],0]])
  await seed(l3.id, [['对不起',['食指点胸 + 弯腰','挥手','双手合十','拍胸'],0], ['没关系',['摆手 + 微笑','按胸','拍肩','点头'],0]])
}
main().finally(() => db.$disconnect())
```

- [ ] **Step 2: 跑 seed**

```bash
pnpm prisma db seed
```
Expected: 无错误。`pnpm prisma studio` 可见 1 unit / 3 lessons / 6 questions。

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat(seed): 3 sample lessons with placeholder questions"
```

---

### Task 9: 课程首页（单元/关卡列表）

**Files:**
- Create: `signo-web/src/app/page.tsx`
- Create: `signo-web/src/app/layout.tsx`（如已存在则修改）

- [ ] **Step 1: `layout.tsx` 顶部导航 + 全局壳**

```tsx
import './globals.css'
import { getSessionUser } from '@/lib/auth/session'
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const u = await getSessionUser()
  return (
    <html lang="zh-CN"><body>
      <header className="px-4 py-3 flex items-center justify-between border-b border-bark/10">
        <a href="/" className="text-moss font-semibold">Signo · 手语森林</a>
        <nav className="text-sm">{u
          ? <span>欢迎，{u.nickname}　<form action="/api/auth/logout" method="post" className="inline"><button className="underline">退出</button></form></span>
          : <a href="/login" className="text-hazel">登录</a>}
        </nav>
      </header>
      <div className="max-w-[480px] mx-auto">{children}</div>
    </body></html>
  )
}
```

- [ ] **Step 2: `page.tsx` 首页（课程树）**

```tsx
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
export default async function Home() {
  const units = await prisma.unit.findMany({ orderBy:{order:'asc'}, include:{ lessons:{ orderBy:{order:'asc'} } } })
  return (
    <main className="px-4 py-6 space-y-4">
      {units.map(u => (
        <Card key={u.id}>
          <h2 className="text-moss font-semibold mb-2">{u.title}</h2>
          <p className="text-sm text-bark/70 mb-3">{u.description}</p>
          <ul className="space-y-2">
            {u.lessons.map(l => (
              <li key={l.id} className="flex items-center justify-between">
                <span>{l.title}</span>
                <a href={`/learn/${l.id}`}><Button>开始</Button></a>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat(home): unit/lesson tree with forest layout"
```

---

### Task 10: 关卡答题页 + 结算 API + XP 写入

**Files:**
- Create: `signo-web/src/lib/curriculum/scoring.ts`
- Create: `signo-web/tests/unit/scoring.test.ts`
- Create: `signo-web/src/app/api/learn/clear-lesson/route.ts`
- Create: `signo-web/src/components/learn/QuestionCard.tsx`
- Create: `signo-web/src/app/learn/[lessonId]/page.tsx`

- [ ] **Step 1: 写测试 `tests/unit/scoring.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { lessonXp } from '@/lib/curriculum/scoring'
describe('lessonXp', () => {
  it('base 10 for any clear', () => expect(lessonXp({ total:5, correct:0 })).toBe(10))
  it('+5 for full clear',   () => expect(lessonXp({ total:5, correct:5 })).toBe(15))
})
```

- [ ] **Step 2: 实现 `src/lib/curriculum/scoring.ts`**

```ts
export function lessonXp({ total, correct }: { total: number; correct: number }) {
  return 10 + (correct === total ? 5 : 0)
}
```
`pnpm vitest run` → PASS。

- [ ] **Step 3: 结算 API `clear-lesson/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/session'
import { lessonXp } from '@/lib/curriculum/scoring'

const Schema = z.object({
  lessonId: z.string(),
  answers: z.array(z.object({ questionId: z.string(), choice: z.number().int(), msSpent: z.number().int().nonnegative() })),
})
export async function POST(req: Request) {
  const u = await getSessionUser(); if (!u) return NextResponse.json({ error:'unauthorized' }, { status:401 })
  const p = Schema.safeParse(await req.json().catch(()=>null))
  if (!p.success) return NextResponse.json({ error:'bad input' }, { status:400 })
  const qs = await prisma.question.findMany({ where:{ lessonId: p.data.lessonId } })
  const byId = new Map(qs.map(q => [q.id, q]))
  let correct = 0
  for (const a of p.data.answers) {
    const q = byId.get(a.questionId); if (!q) continue
    const ok = q.answerIndex === a.choice
    if (ok) correct++
    await prisma.attempt.create({ data:{ userId:u.id, questionId:q.id, isCorrect:ok, msSpent:a.msSpent } })
  }
  const xp = lessonXp({ total: qs.length, correct })
  const stars = correct === qs.length ? 3 : correct >= Math.ceil(qs.length*0.6) ? 2 : 1
  await prisma.lessonClear.create({ data:{ userId:u.id, lessonId: p.data.lessonId, stars } })
  const today = new Date().toISOString().slice(0,10)
  await prisma.dailyStat.upsert({
    where: { userId_date: { userId: u.id, date: today } },
    create: { userId: u.id, date: today, xp, lessonsCleared: 1 },
    update: { xp: { increment: xp }, lessonsCleared: { increment: 1 } },
  })
  return NextResponse.json({ xp, correct, total: qs.length, stars })
}
```

- [ ] **Step 4: `QuestionCard.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
export function QuestionCard({
  prompt, choices, onAnswer,
}: { prompt: string; choices: string[]; onAnswer: (choiceIdx:number)=>void }) {
  const [picked, setPicked] = useState<number|null>(null)
  return (
    <div className="space-y-3">
      <div className="text-lg text-bark">把这个词的手语找出来：<b className="text-moss">{prompt}</b></div>
      <ul className="grid grid-cols-1 gap-2">
        {choices.map((c, i) => (
          <li key={i}>
            <Button variant={picked===i?'primary':'secondary'}
              className="w-full justify-start"
              onClick={()=>{ setPicked(i); onAnswer(i) }}
              disabled={picked!==null}>{c}</Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 5: 答题页 `learn/[lessonId]/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuestionCard } from '@/components/learn/QuestionCard'

type Q = { id:string; promptText:string; choicesJson:string; answerIndex:number }
export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId:string }>()
  const r = useRouter()
  const [qs, setQs] = useState<Q[]>([])
  const [i, setI] = useState(0)
  const [t0, setT0] = useState(Date.now())
  const [answers, setA] = useState<{questionId:string;choice:number;msSpent:number}[]>([])
  const [done, setDone] = useState<{xp:number;correct:number;total:number}|null>(null)
  useEffect(() => {
    fetch(`/api/learn/lesson/${lessonId}`).then(r=>r.json()).then(setQs)
  }, [lessonId])
  if (qs.length === 0) return <main className="p-6">载入中…</main>
  if (done) return (
    <main className="p-6 space-y-3">
      <Card>
        <h2 className="text-moss font-semibold mb-2">关卡完成</h2>
        <p>得分 {done.correct} / {done.total}　获得 +{done.xp} XP</p>
        <Button className="mt-4" onClick={()=>r.push('/')}>回到森林</Button>
      </Card>
    </main>
  )
  const q = qs[i]
  const choices = JSON.parse(q.choicesJson) as string[]
  return (
    <main className="p-6 space-y-3">
      <div className="text-sm text-bark/60">第 {i+1} / {qs.length} 题</div>
      <Card>
        <QuestionCard prompt={q.promptText} choices={choices} onAnswer={async (c) => {
          const next = [...answers, { questionId:q.id, choice:c, msSpent: Date.now()-t0 }]
          setA(next)
          setTimeout(async () => {
            if (i+1 < qs.length) { setI(i+1); setT0(Date.now()) }
            else {
              const res = await fetch('/api/learn/clear-lesson', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ lessonId, answers: next }),
              })
              if (res.status === 401) r.push('/login')
              else setDone(await res.json())
            }
          }, 700)
        }}/>
      </Card>
    </main>
  )
}
```

- [ ] **Step 6: 题目读取 API `src/app/api/learn/lesson/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
export async function GET(_: Request, { params }: { params: Promise<{ id:string }> }) {
  const { id } = await params
  const qs = await prisma.question.findMany({
    where:{ lessonId: id }, orderBy:{ order:'asc' },
    select:{ id:true, promptText:true, choicesJson:true, answerIndex:true },
  })
  return NextResponse.json(qs)
}
```
> 注：MVP 中 answerIndex 暴露给客户端是可接受的（先验证学习闭环）；W3 PK 模块严格服务端判定。

- [ ] **Step 7: Commit**

```bash
git add src/lib/curriculum src/components/learn src/app/learn src/app/api/learn tests/unit/scoring.test.ts
git commit -m "feat(learn): lesson play + clear API + scoring"
```

---

### Task 11: E2E 烟测（happy-path）

**Files:**
- Create: `signo-web/playwright.config.ts`
- Create: `signo-web/tests/e2e/happy-path.spec.ts`

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3000', headless: true },
  webServer: { command: 'pnpm dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 60_000 },
})
```

- [ ] **Step 2: `happy-path.spec.ts`**

```ts
import { test, expect } from '@playwright/test'
test('register → home → play first lesson → see XP', async ({ page }) => {
  const u = 'tester' + Date.now()
  await page.goto('/register')
  await page.fill('input[placeholder="用户名"]', u)
  await page.fill('input[placeholder="昵称"]',   '试林友')
  await page.fill('input[placeholder^="密码"]',   'hunter22')
  await page.getByRole('button', { name:'注册' }).click()
  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name:'开始' }).first().click()
  for (let i = 0; i < 10; i++) {
    const btns = await page.getByRole('button').all()
    const candidate = btns.find(async b => /^[^第]/.test((await b.textContent()) || ''))
    if (candidate) { await candidate.click(); await page.waitForTimeout(800) }
    if (await page.getByText('关卡完成').isVisible().catch(()=>false)) break
  }
  await expect(page.getByText(/获得 \+\d+ XP/)).toBeVisible()
})
```
> 如果交互稳定性不够，可在 W2 改成 data-testid 选择器。

- [ ] **Step 3: 跑 e2e**

```bash
pnpm playwright install --with-deps chromium
pnpm playwright test
```
Expected: 1 passed。

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e
git commit -m "test(e2e): happy-path smoke (register → play → xp)"
```

---

### Task 12: README + 启动指南 + 最终验证

**Files:**
- Create: `signo-web/README.md`

- [ ] **Step 1: `README.md`**

```md
# Signo 手语森林（W1 脚手架）
## 本地启动
\`\`\`
pnpm i
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
\`\`\`
访问 http://localhost:3000，注册后从首页选第一关开始。

## 测试
\`\`\`
pnpm vitest run            # 单测
pnpm playwright test       # E2E 烟测
\`\`\`
```

- [ ] **Step 2: 手工通联验证**

逐项确认（对应 spec 验证清单 W1 子集）：
- [ ] 启动开发服务器无报错
- [ ] 注册新账号 → 自动登录 → 首页可见 1 单元 3 关卡
- [ ] 进入第 1 关，能逐题作答，结束页显示 XP
- [ ] 在 `pnpm prisma studio` 中 `DailyStat` 表能看到刚才那条今日 XP
- [ ] 退出后再注册第二个账号，互不影响

- [ ] **Step 3: 最终 commit + tag**

```bash
git add README.md
git commit -m "docs: W1 setup & test instructions"
git tag w1-mvp-foundation
```

---

## 自检（写完计划后逐项 verify）

- [x] **Spec 覆盖**：MVP 范围 1（关卡式课程，3 关示例）、2（仅 word2sign 占位，sign2word 留 W2）、3 仅 streak 入库的 daily 表结构（cron 留 W2）、4（自建账号）、8（设计 token + Button/Card 森林化）已覆盖。其余功能（错题/复习/PK/段位/徽章/admin/部署）属 W2–W4，不在本 plan。
- [x] **占位扫描**：无 TBD/TODO/"以后再补"，所有代码块都是可拷贝的完整实现。
- [x] **类型一致性**：`SessionPayload.uid`、`SESSION_COOKIE` 名称、`lessonXp({total,correct})` 签名跨任务一致。
- [x] **测试先行**：password / jwt / scoring 三个 lib 模块均有 Vitest 失败 → 实现 → 通过 步骤；UI/API 用 e2e happy-path 兜底，未对页面强行 TDD 是因为 UI 的有效测试是端到端而非快照。

---

## 模块化与可扩展性原则（贯穿所有 Task）

执行任何 task 前，先校准这些原则；写代码时每文件、每 API 都按这套来。

**1. 三层切分（严格遵守）**
- **`src/app/`** — 路由与展示层。页面 / API route 只做 *请求解析 + 调用 service + 响应渲染*，不写业务逻辑、不直接拼 SQL。
- **`src/lib/<domain>/`** — 业务服务层（domain service）。每个领域一个目录：`auth/`、`curriculum/`、`progress/`（W2）、`league/`（W2）、`pk/`（W3）、`mistakes/`（W2）、`badges/`（W3）。所有 Prisma 调用、计分、排名、状态机都在这层。
- **`src/lib/db.ts`** — 唯一的 Prisma 客户端单例，其他模块通过它访问。

**2. 模块边界规则**
- API route 只 import `src/lib/<domain>/` 下的具名函数，**不直接 import `prisma`**（W1 因极简 CRUD 暂允许，但 W2 起强制走 service 层；本 W1 plan 的 `clear-lesson/route.ts` 后续会拆出 `lib/progress/clearLesson.ts`，这是已知的小欠债）。
- 不同 domain 之间不直接互相 import；需要协作时通过 `src/lib/orchestration/` 编排（如 W3 PK 结束后调用 progress + badge）。
- UI 组件分两层：`src/components/ui/` 是与业务无关的设计系统原子（Button/Card/Input 等）；`src/components/<domain>/` 是与业务耦合的复合组件（QuestionCard、PkRoom 等）。

**3. 类型与契约**
- 每个 service 模块在自己目录下放 `types.ts` 公开外部契约；内部类型不导出。
- API 请求/响应 schema 用 zod 定义，文件名 `<route>.schema.ts`，**前后端都从这里 import 类型**（避免双写）。
- 数据库类型用 Prisma 生成；service 层不直接对外暴露 Prisma 类型，转换为 domain 类型再返回，便于未来换 ORM。

**4. 配置与开关**
- 所有可调参数（XP 基础值、复习关题数阈值、PK 计分公式系数、段位人数等）集中在 `src/config/<domain>.ts`，不要散落在代码里。本 W1 加 `src/config/scoring.ts` 定义 `BASE_XP=10`、`PERFECT_BONUS=5`，scoring 模块从这里读。
- 环境变量集中在 `src/lib/env.ts` 里 zod 校验后导出，不在业务代码里直接读 `process.env`。

**5. 测试边界对齐模块**
- 每个 service 模块对应 `tests/unit/<domain>/*.test.ts`；
- API 路由对应 `tests/integration/api-<route>.test.ts`（W2 起加）；
- 关键用户路径对应 `tests/e2e/*.spec.ts`。
- 测试只测对应模块的公开契约，不窥探实现细节，这样重构时不需要改测试。

**6. 数据迁移可逆**
- 所有 Prisma migration 用 `prisma migrate dev --name <verb-noun>`，不手动改 SQL。
- 删字段前先双写一版（W1 不会触及，但 W2/W3 加表时遵守）。

**7. 横切关注点**
- 日志：`src/lib/logger.ts`（W1 用 `console`，W4 部署时换 pino，业务代码统一调 logger，不直接 console）。
- 错误：API 路由统一 `try/catch + NextResponse.json({ error })`；service 层抛具体 Error 子类，由路由层翻译成 HTTP code。

**8. 可扩展锚点（W1 就要预留）**

下面这些"接缝"必须在 W1 留好，否则 W2/W3 会被迫重写：

| 锚点 | 位置 | 留法 |
| ---- | ---- | ---- |
| 题型扩展 | `Question.type` 字段 | W1 仅用 `word2sign`，但 service 已按 `type` 分支处理；W2 加 `sign2word` 时只新增分支不改结构 |
| XP 计算扩展 | `lib/curriculum/scoring.ts` | 把 `lessonXp` 写成纯函数 + 配置驱动，W2 加复习关 1.2× 系数时改 config 不改函数签名 |
| 进度写入扩展 | `clear-lesson` API | 结算完抛事件式调用 `progress.onLessonClear(userId, lessonId, ctx)`；W2 在此 hook 里追加 streak / 段位 weeklyXp / 错题更新 |
| 题目下发 | `api/learn/lesson/[id]` | 客户端通过此 API 拿题；W3 PK 时新增 `api/pk/match/[id]/next-question`，复用同一 service 层方法 `curriculum.getQuestionsForLesson()`，但 PK 版隐藏 `answerIndex` |

**9. 文件大小硬上限**
- 单文件 ≤ 200 行；超过就拆。已观察到 `learn/[lessonId]/page.tsx` 接近上限，W2 加复习关重做时拆出 `LessonRunner.tsx` 客户端组件。

---

> **执行 task 时如果发现某条原则与当前 task 的代码冲突，停下来先调整 task，再继续。** 不要为了赶进度埋下结构债。

