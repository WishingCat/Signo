type Variant = 'red' | 'gold' | 'cluster'

type Props = {
  variant?: Variant
  className?: string
}

/**
 * 森林蘑菇 SVG，三种花样：
 * - red：经典毒蝇伞，红帽白点
 * - gold：金顶单只
 * - cluster：三只一丛，红 + 金混搭
 */
export function Mushroom({ variant = 'red', className }: Props) {
  if (variant === 'gold') return <Gold className={className} />
  if (variant === 'cluster') return <ClusterGroup className={className} />
  return <Red className={className} />
}

function Red({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden>
      <path d="M 30 60 Q 28 80 26 95 L 54 95 Q 52 80 50 60 Z"
            fill="#fbf5e3" stroke="#4a3a2c" strokeWidth="1.4" strokeLinejoin="round" />
      <ellipse cx="40" cy="60" rx="14" ry="3" fill="#4a3a2c" opacity="0.18" />
      <path d="M 6 50 C 6 22, 74 22, 74 50 Q 70 60 40 60 Q 10 60 6 50 Z"
            fill="#a3402c" stroke="#4a3a2c" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="20" cy="40" r="3" fill="#fbf5e3" />
      <circle cx="35" cy="32" r="4" fill="#fbf5e3" />
      <circle cx="50" cy="38" r="2.6" fill="#fbf5e3" />
      <circle cx="58" cy="46" r="2" fill="#fbf5e3" />
      <circle cx="28" cy="50" r="1.8" fill="#fbf5e3" />
    </svg>
  )
}

function Gold({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 80" className={className} aria-hidden>
      <path d="M 22 50 Q 21 65 18 76 L 42 76 Q 39 65 38 50 Z"
            fill="#fbf5e3" stroke="#4a3a2c" strokeWidth="1.3" />
      <path d="M 6 42 C 6 22, 54 22, 54 42 Q 50 50 30 50 Q 10 50 6 42 Z"
            fill="#d4a548" stroke="#4a3a2c" strokeWidth="1.3" />
      <path d="M 14 48 Q 30 52 46 48" stroke="#4a3a2c" strokeWidth="0.7" fill="none" opacity="0.4" />
    </svg>
  )
}

function ClusterGroup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <g transform="translate(8 28)">
        <path d="M 15 28 L 13 42 L 25 42 L 23 28 Z" fill="#fbf5e3" stroke="#4a3a2c" strokeWidth="1.1" />
        <ellipse cx="19" cy="22" rx="14" ry="9" fill="#a3402c" stroke="#4a3a2c" strokeWidth="1.1" />
        <circle cx="14" cy="20" r="2" fill="#fbf5e3" />
        <circle cx="22" cy="17" r="2.4" fill="#fbf5e3" />
      </g>
      <g transform="translate(40 4)">
        <path d="M 18 36 Q 16 56 14 70 L 30 70 Q 28 56 26 36 Z"
              fill="#fbf5e3" stroke="#4a3a2c" strokeWidth="1.3" />
        <path d="M 2 30 C 2 12, 42 12, 42 30 Q 38 38 22 38 Q 6 38 2 30 Z"
              fill="#d4a548" stroke="#4a3a2c" strokeWidth="1.3" />
        <path d="M 8 35 Q 22 38 36 35" stroke="#4a3a2c" strokeWidth="0.6" fill="none" opacity="0.4" />
      </g>
      <g transform="translate(78 32)">
        <path d="M 14 22 L 12 36 L 22 36 L 20 22 Z" fill="#fbf5e3" stroke="#4a3a2c" strokeWidth="1.1" />
        <ellipse cx="17" cy="18" rx="13" ry="8" fill="#a3402c" stroke="#4a3a2c" strokeWidth="1.1" />
        <circle cx="13" cy="16" r="2" fill="#fbf5e3" />
        <circle cx="20" cy="14" r="2.4" fill="#fbf5e3" />
        <circle cx="17" cy="20" r="1.5" fill="#fbf5e3" />
      </g>
    </svg>
  )
}
