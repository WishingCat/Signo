import type { Metadata } from 'next'
import './globals.css'
import { getSessionUser } from '@/lib/auth/session'
import { Firefly } from '@/components/forest/Firefly'
import { TierBadge } from '@/components/forest/TierBadge'
import { BottomNav } from '@/components/nav/BottomNav'
import { LightShaft } from '@/components/forest/LightShaft'
import { MossGround } from '@/components/forest/MossGround'

export const metadata: Metadata = {
  title: '手诺 · Signo',
  description: '一个温柔安静的手语练习场。',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser()

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col relative overflow-x-hidden">
        {/* 林间斜射光柱（左 + 右），柔和脉动 */}
        <LightShaft side="left" delay="0s" />
        <LightShaft side="right" delay="2.5s" />

        {/* 角落里的萤火虫 */}
        <Firefly className="fixed top-24 left-3 z-0" period={3.2} />
        <Firefly className="fixed top-44 right-5 z-0" period={4.4} intensity={0.7} />
        <Firefly className="fixed top-80 left-8 z-0" period={5} intensity={0.55} />
        <Firefly className="fixed bottom-40 right-12 z-0" period={3.8} intensity={0.6} />
        <Firefly className="fixed bottom-56 left-6 z-0" period={4.7} intensity={0.5} />

        <header className="relative z-10 px-5 pt-5 pb-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <LogoMark />
            <span className="flex flex-col leading-none">
              <span className="text-[20px] font-bold text-ink -mb-0.5 group-hover:text-moss transition-colors tracking-[0.05em]">
                手诺
              </span>
              <span className="text-[10px] tracking-[0.32em] uppercase text-bark/55">
                Signo
              </span>
            </span>
          </a>
          <nav className="flex items-center gap-3 text-[13px]">
            {user ? (
              <a href={`/profile/${user.friendCode}`} className="hover:opacity-90 transition-opacity">
                <TierBadge tier={user.tier} />
              </a>
            ) : (
              <a
                href="/login"
                className="text-[15px] font-medium text-hazel hover:text-ochre transition-colors"
              >
                进入森林 →
              </a>
            )}
          </nav>
        </header>

        <main className="relative z-10 flex-1 w-full max-w-[520px] mx-auto px-4 pb-32">
          {children}
        </main>

        {/* 森林地面（底栏正上方）：苔藓 + 鹅卵石 + 散叶 + 蕨叶 + 蘑菇丛 */}
        <div className="fixed bottom-[78px] left-0 right-0 z-10 pointer-events-none px-2">
          <div className="max-w-[520px] mx-auto">
            <MossGround />
          </div>
        </div>

        <BottomNav />
      </body>
    </html>
  )
}

function LogoMark() {
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11" aria-hidden>
      <circle cx="22" cy="22" r="20" fill="var(--color-cream)" stroke="var(--color-ink)" strokeWidth="1.4" />
      <path
        d="M14 30 Q 22 18 30 30"
        stroke="var(--color-moss)"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M17 26 Q 22 20 27 26"
        stroke="var(--color-moss)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M22 30 L 22 36" stroke="var(--color-bark)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="18" r="2" fill="var(--color-firefly)" />
    </svg>
  )
}
