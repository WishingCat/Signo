import type { Metadata } from 'next'
import { Ma_Shan_Zheng, Noto_Serif_SC, Fraunces } from 'next/font/google'
import './globals.css'
import { getSessionUser } from '@/lib/auth/session'
import { Firefly } from '@/components/forest/Firefly'
import { AntTrail } from '@/components/forest/AntTrail'
import { TierBadge } from '@/components/forest/TierBadge'

const maShan = Ma_Shan_Zheng({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-ma-shan',
  display: 'swap',
})
const notoSerif = Noto_Serif_SC({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif',
  display: 'swap',
})
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Signo · 手语森林',
  description: '一个温柔安静的手语练习场。',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser()

  return (
    <html
      lang="zh-CN"
      className={`h-full antialiased ${maShan.variable} ${notoSerif.variable} ${fraunces.variable}`}
    >
      <body className="min-h-full flex flex-col relative overflow-x-hidden">
        {/* 角落里三只萤火虫：固定位置 + 脉动 */}
        <Firefly className="fixed top-20 left-4 z-0" period={3.2} />
        <Firefly className="fixed top-40 right-6 z-0" period={4.4} intensity={0.7} />
        <Firefly className="fixed bottom-28 left-10 z-0" period={5} intensity={0.55} />

        <header className="relative z-10 px-5 pt-5 pb-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <LogoMark />
            <span className="flex flex-col leading-none">
              <span className="brush-text text-[22px] -mb-0.5 group-hover:text-moss transition-colors">
                手语森林
              </span>
              <span className="font-[family-name:var(--font-latin)] text-[10px] tracking-[0.3em] uppercase text-bark/55">
                Signo
              </span>
            </span>
          </a>
          <nav className="flex items-center gap-3 text-[13px]">
            {user ? (
              <>
                <TierBadge tier={user.tier} />
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="text-bark/55 hover:text-ochre font-[family-name:var(--font-book)] underline decoration-bark/20 underline-offset-4 decoration-wavy"
                  >
                    退出
                  </button>
                </form>
              </>
            ) : (
              <a
                href="/login"
                className="brush-text text-[17px] text-hazel hover:text-ochre transition-colors"
              >
                进入森林 →
              </a>
            )}
          </nav>
        </header>

        <main className="relative z-10 flex-1 w-full max-w-[520px] mx-auto px-4 pb-28">
          {children}
        </main>

        <AntTrail />
      </body>
    </html>
  )
}

/** 角落 logo 标记：水墨圆 + 三笔树冠 */
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
