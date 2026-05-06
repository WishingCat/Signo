import { cn } from '@/lib/utils'

type Props = {
  className?: string
  /** 填色（默认 苔藓绿） */
  color?: string
  /** 旋转角度 */
  rotate?: number
  /** 尺寸 px */
  size?: number
}

/** 装饰性银杏/柳叶形小叶片 */
export function Leaf({ className, color = 'var(--color-sage)', rotate = 0, size = 40 }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('leaf-breathe', className)}
      style={{ transform: `rotate(${rotate}deg)`, color }}
      aria-hidden
    >
      <path
        d="M32 4 C 46 16, 54 32, 32 60 C 10 32, 18 16, 32 4 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M32 8 L 32 58" stroke="#fbf5e3" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M32 18 Q 22 22 20 28" stroke="#fbf5e3" strokeWidth="0.9" fill="none" opacity="0.55" />
      <path d="M32 18 Q 42 22 44 28" stroke="#fbf5e3" strokeWidth="0.9" fill="none" opacity="0.55" />
      <path d="M32 32 Q 22 36 22 42" stroke="#fbf5e3" strokeWidth="0.9" fill="none" opacity="0.55" />
      <path d="M32 32 Q 42 36 42 42" stroke="#fbf5e3" strokeWidth="0.9" fill="none" opacity="0.55" />
    </svg>
  )
}
