'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Tab = {
  href: string
  label: string
  match: (path: string) => boolean
  icon: React.ReactNode
}

const TABS: Tab[] = [
  {
    href: '/',
    label: '主线',
    match: (p) =>
      p === '/' ||
      p.startsWith('/learn') ||
      p === '/mistakes' ||
      p === '/review',
    icon: <IconLeaf />,
  },
  {
    href: '/pk',
    label: '知识竞赛',
    match: (p) => p.startsWith('/pk') || p === '/leaderboard',
    icon: <IconCrossSwords />,
  },
  {
    href: '/me',
    label: '个人',
    match: (p) =>
      p === '/me' ||
      p === '/badges' ||
      p === '/friends' ||
      p === '/teams' ||
      p.startsWith('/teams/') ||
      p.startsWith('/profile'),
    icon: <IconUser />,
  },
]

const HIDE_ON = new Set(['/login', '/register'])

export function BottomNav() {
  const pathname = usePathname() ?? '/'
  if (HIDE_ON.has(pathname)) return null

  return (
    <nav
      aria-label="底部导航"
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <div className="max-w-[520px] mx-auto px-4 pointer-events-auto">
        <div
          className="flex items-stretch gap-1 rounded-full p-1.5"
          style={{
            background: 'color-mix(in oklab, var(--color-cream) 95%, white)',
            border: '1px solid color-mix(in oklab, var(--color-bark) 14%, transparent)',
            boxShadow:
              '0 12px 28px -8px rgba(74,58,44,0.22), 0 2px 0 rgba(74,58,44,0.05)',
          }}
        >
          {TABS.map((t) => {
            const active = t.match(pathname)
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-full transition-all duration-200',
                  active
                    ? 'bg-hazel text-cream shadow-[0_2px_0_rgba(74,58,44,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]'
                    : 'text-bark/60 hover:text-bark/85',
                )}
              >
                <span className={cn('h-5 w-5 transition-transform', active && 'scale-105')}>
                  {t.icon}
                </span>
                <span className="text-[11px] leading-none font-medium tracking-[0.05em]">
                  {t.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function IconLeaf() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19 C 5 11, 12 4, 20 4 C 20 12, 13 19, 5 19 Z" />
      <path d="M5 19 L 12 12" />
    </svg>
  )
}

function IconCrossSwords() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4 L 14 13 L 11 16 L 4 9 L 4 5 L 5 4 Z" />
      <path d="M19 4 L 10 13 L 13 16 L 20 9 L 20 5 L 19 4 Z" />
      <path d="M14 17 L 18 21" />
      <path d="M10 17 L 6 21" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 C 4 16, 7.5 13, 12 13 C 16.5 13, 20 16, 20 21" />
    </svg>
  )
}
