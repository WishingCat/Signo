import type { Metadata } from 'next'
import './globals.css'
import { getSessionUser } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Signo · 手语森林',
  description: '一个温柔安静的手语练习场。',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser()

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="px-4 py-3 flex items-center justify-between border-b border-bark/10">
          <a href="/" className="text-moss font-semibold">
            Signo · 手语森林
          </a>
          <nav className="text-sm">
            {user ? (
              <span className="flex items-center gap-3">
                <span className="text-bark/80">欢迎，{user.nickname}</span>
                <form action="/api/auth/logout" method="post">
                  <button className="text-bark/60 hover:text-ochre underline">
                    退出
                  </button>
                </form>
              </span>
            ) : (
              <a href="/login" className="text-hazel">
                登录
              </a>
            )}
          </nav>
        </header>
        <div className="flex-1 max-w-[480px] w-full mx-auto">{children}</div>
      </body>
    </html>
  )
}
