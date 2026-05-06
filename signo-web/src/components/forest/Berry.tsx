type BerryColor = 'red' | 'blue' | 'forest'

type Props = {
  color?: BerryColor
  className?: string
}

/** 浆果丛：3 颗带高光，顶端两片小叶。 */
export function Berry({ color = 'red', className }: Props) {
  const fill = color === 'red' ? '#9b3232' : color === 'blue' ? '#3a5273' : '#3d6135'
  return (
    <svg viewBox="0 0 60 70" className={className} aria-hidden>
      <path
        d="M 30 5 L 30 25 M 30 12 L 22 22 M 30 12 L 38 22"
        stroke="#5f7d4f"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 30 4 C 24 -2, 18 4, 24 10 C 28 12, 30 8, 30 4 Z" fill="#5f7d4f" />
      <path d="M 30 4 C 36 -2, 42 4, 36 10 C 32 12, 30 8, 30 4 Z" fill="#5f7d4f" />
      <circle cx="22" cy="35" r="9" fill={fill} stroke="#4a3a2c" strokeWidth="1" />
      <circle cx="38" cy="38" r="9" fill={fill} stroke="#4a3a2c" strokeWidth="1" />
      <circle cx="30" cy="55" r="10" fill={fill} stroke="#4a3a2c" strokeWidth="1" />
      <ellipse cx="20" cy="32" rx="2" ry="1.4" fill="#fbf5e3" opacity="0.55" />
      <ellipse cx="36" cy="35" rx="2" ry="1.4" fill="#fbf5e3" opacity="0.55" />
      <ellipse cx="28" cy="52" rx="2.4" ry="1.6" fill="#fbf5e3" opacity="0.55" />
    </svg>
  )
}
