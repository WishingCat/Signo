import { cn } from '@/lib/utils'

type Props = {
  count?: number
  /** 单独图标（不带数字） */
  iconOnly?: boolean
  className?: string
  size?: number
}

/**
 * 落叶币：金叶轮廓 + 茎 + 叶脉 + 高光，带数字时形成 chip。
 */
export function LeafCoin({ count, iconOnly = false, className, size = 18 }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <svg viewBox="0 0 28 28" width={size} height={size} aria-hidden>
        <defs>
          <radialGradient id="leafCoinGrad" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#e5d36a" />
            <stop offset="0.55" stopColor="#bcc25a" />
            <stop offset="1" stopColor="#7ea255" />
          </radialGradient>
        </defs>
        {/* leaf body — slightly tilted teardrop */}
        <path
          d="M 14 3 C 22 6, 25 14, 21 22 C 17 25, 9 24, 5 18 C 3 12, 7 5, 14 3 Z"
          fill="url(#leafCoinGrad)"
          stroke="#4a3a2c"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* central vein */}
        <path
          d="M 14 4 C 15 11, 14 18, 13 24"
          stroke="#4a3a2c"
          strokeWidth="0.9"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* side veins */}
        <path d="M 13 9 L 7 11" stroke="#4a3a2c" strokeWidth="0.6" fill="none" opacity="0.5" />
        <path d="M 14 14 L 21 14" stroke="#4a3a2c" strokeWidth="0.6" fill="none" opacity="0.5" />
        <path d="M 13 19 L 8 19" stroke="#4a3a2c" strokeWidth="0.6" fill="none" opacity="0.5" />
        {/* highlight */}
        <ellipse cx="11" cy="9" rx="2.4" ry="1.4" fill="#fbf5e3" opacity="0.55" transform="rotate(-30 11 9)" />
      </svg>
      {!iconOnly && count !== undefined && (
        <span className="tabular-nums">{count}</span>
      )}
    </span>
  )
}
