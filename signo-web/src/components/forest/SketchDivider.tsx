import { cn } from '@/lib/utils'

/** 手绘墨迹分割线：波浪笔触 + 两端收笔 */
export function SketchDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 14"
      preserveAspectRatio="none"
      className={cn('h-3 w-full text-moss', className)}
      aria-hidden
    >
      <path
        d="M4 7 C 40 2, 80 12, 120 6 C 160 1, 200 11, 240 7 C 272 4, 300 9, 316 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <circle cx="4" cy="7" r="1.6" fill="currentColor" opacity="0.7" />
      <circle cx="316" cy="7" r="1.6" fill="currentColor" opacity="0.7" />
    </svg>
  )
}
