type Props = {
  className?: string
  mirror?: boolean
}

/** 从上方角落悬垂的藤蔓 + 4 片叶。mirror=true 翻转贴右上角。 */
export function Vine({ className, mirror = false }: Props) {
  return (
    <svg
      viewBox="0 0 70 180"
      className={className}
      style={mirror ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden
    >
      <path
        d="M 18 0 C 22 30, 38 40, 28 70 C 16 100, 40 120, 30 150 C 24 168, 36 180, 30 180"
        stroke="#5f7d4f"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 28 25 C 36 20, 44 26, 42 36 C 40 40, 32 36, 28 32 Z" fill="#5f7d4f" />
      <path d="M 32 70 C 22 64, 14 70, 18 80 C 22 84, 30 80, 32 76 Z" fill="#5f7d4f" />
      <path d="M 26 110 C 36 106, 44 114, 40 122 C 36 126, 28 120, 26 116 Z" fill="#5f7d4f" />
      <path d="M 34 150 C 24 146, 16 152, 20 162 C 24 166, 32 160, 34 156 Z" fill="#5f7d4f" />
    </svg>
  )
}
