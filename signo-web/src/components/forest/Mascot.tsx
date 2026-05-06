import * as React from 'react'

export type MascotName =
  | 'ant'
  | 'firefly'
  | 'squirrel'
  | 'fox'
  | 'koala'
  | 'boar'
  | 'deer'

export const TIER_MASCOT: Record<number, MascotName> = {
  1: 'ant', 2: 'firefly', 3: 'squirrel', 4: 'fox',
  5: 'koala', 6: 'boar', 7: 'deer',
}

export const MASCOT_LABEL: Record<MascotName, string> = {
  ant: '小蚂蚁', firefly: '萤火虫', squirrel: '小松鼠', fox: '狐狸',
  koala: '考拉', boar: '大野猪', deer: '麋鹿神',
}

type Props = {
  name: MascotName
  className?: string
  /** 通过 currentColor 控制线稿色；传 color 覆盖 */
  color?: string
  title?: string
}

const SVG_PROPS = {
  viewBox: '0 0 120 120',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function Mascot({ name, className, color, title }: Props) {
  const style = color ? { color } : undefined
  return (
    <svg {...SVG_PROPS} className={className} style={style} role={title ? 'img' : 'presentation'} aria-label={title}>
      {title && <title>{title}</title>}
      {renderBody(name)}
    </svg>
  )
}

function renderBody(name: MascotName): React.ReactElement {
  switch (name) {
    case 'ant':       return <Ant />
    case 'firefly':   return <Firefly />
    case 'squirrel':  return <Squirrel />
    case 'fox':       return <Fox />
    case 'koala':     return <Koala />
    case 'boar':      return <Boar />
    case 'deer':      return <Deer />
  }
}

/* ——— L1 小蚂蚁：三节圆身 + 六足 + 触角 ——— */
function Ant() {
  return (
    <g>
      <circle cx="28" cy="62" r="10" fill="currentColor" />
      <ellipse cx="55" cy="62" rx="14" ry="11" fill="currentColor" />
      <ellipse cx="88" cy="62" rx="17" ry="13" fill="currentColor" />
      {/* 触角 */}
      <path d="M22 56 C 14 46, 12 40, 18 34" />
      <path d="M24 52 C 20 42, 22 36, 30 32" />
      {/* 六足：从中段伸出 */}
      <path d="M48 68 L 40 86" />
      <path d="M55 70 L 55 90" />
      <path d="M62 68 L 70 86" />
      <path d="M48 58 L 38 44" />
      <path d="M55 56 L 55 38" />
      <path d="M62 58 L 72 44" />
      {/* 眼神（小白点） */}
      <circle cx="25" cy="58" r="1.6" fill="#fbf5e3" stroke="none" />
    </g>
  )
}

/* ——— L2 萤火虫：椭圆身 + 双翼 + 发光尾 ——— */
function Firefly() {
  return (
    <g>
      {/* 光晕（在描边圈外的软黄） */}
      <circle cx="80" cy="78" r="22" fill="#f3c969" stroke="none" opacity="0.28" />
      <circle cx="80" cy="78" r="14" fill="#f3c969" stroke="none" opacity="0.55" />
      {/* 身体 */}
      <ellipse cx="58" cy="60" rx="22" ry="14" fill="currentColor" />
      <circle cx="38" cy="58" r="9" fill="currentColor" />
      {/* 翅膀（半透明，用白色填） */}
      <path d="M50 48 C 44 30, 66 24, 72 40 C 70 48, 58 50, 50 48 Z" fill="#fbf5e3" opacity="0.85" />
      <path d="M56 50 C 56 34, 78 32, 82 46 C 78 54, 64 54, 56 50 Z" fill="#fbf5e3" opacity="0.7" />
      {/* 发光尾点 */}
      <circle cx="80" cy="68" r="5.5" fill="#f3c969" stroke="none" />
      {/* 触角 */}
      <path d="M30 52 C 24 40, 28 34, 36 32" />
      {/* 眼 */}
      <circle cx="34" cy="58" r="1.6" fill="#fbf5e3" stroke="none" />
    </g>
  )
}

/* ——— L3 小松鼠：蜷尾 + 手捧橡果 ——— */
function Squirrel() {
  return (
    <g>
      {/* 蓬松大尾巴（画在身后） */}
      <path d="M82 80 C 110 78, 112 42, 86 34 C 72 32, 66 44, 74 54 C 82 60, 84 70, 82 80 Z"
            fill="currentColor" opacity="0.85" />
      <path d="M86 44 C 96 46, 98 60, 92 66" opacity="0.45" />
      {/* 身体 */}
      <path d="M42 88 C 36 66, 52 54, 66 54 C 78 54, 86 68, 82 88 Z" fill="currentColor" />
      {/* 头 */}
      <circle cx="58" cy="46" r="16" fill="currentColor" />
      {/* 耳朵 */}
      <path d="M46 36 L 42 22 L 54 32 Z" fill="currentColor" />
      <path d="M70 36 L 74 22 L 62 32 Z" fill="currentColor" />
      {/* 肚皮米色 */}
      <path d="M50 72 C 54 86, 72 86, 76 72 C 72 64, 54 64, 50 72 Z" fill="#fbf5e3" stroke="none" />
      {/* 脸部 */}
      <circle cx="52" cy="46" r="1.8" fill="#2b241e" stroke="none" />
      <circle cx="66" cy="46" r="1.8" fill="#2b241e" stroke="none" />
      <path d="M57 52 Q 59 54 61 52" />
      {/* 橡果 */}
      <ellipse cx="60" cy="78" rx="7" ry="8" fill="#c77f44" stroke="#4a3a2c" />
      <rect x="54" y="70" width="12" height="4" rx="2" fill="#4a3a2c" stroke="none" />
      <path d="M60 68 L 60 64" />
    </g>
  )
}

/* ——— L4 狐狸：侧坐 + 尖耳 + 白尾尖 ——— */
function Fox() {
  return (
    <g>
      {/* 尾巴（大弧从身后伸出） */}
      <path d="M32 88 C 10 88, 6 68, 18 56 C 28 50, 38 62, 36 76 Z" fill="currentColor" />
      <path d="M14 66 C 10 76, 14 86, 22 86" stroke="#fbf5e3" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.95" />
      {/* 身体 */}
      <path d="M42 90 C 38 70, 50 58, 66 58 C 82 58, 90 72, 86 90 Z" fill="currentColor" />
      {/* 胸腹白 */}
      <path d="M55 82 C 58 92, 72 92, 74 82 C 72 74, 58 74, 55 82 Z" fill="#fbf5e3" stroke="none" />
      {/* 头（三角脸） */}
      <path d="M46 54 L 56 32 L 70 42 L 82 34 L 84 56 Z" fill="currentColor" />
      {/* 内耳 */}
      <path d="M56 36 L 62 44 L 54 44 Z" fill="#fbf5e3" stroke="none" />
      <path d="M80 36 L 78 44 L 74 40 Z" fill="#fbf5e3" stroke="none" />
      {/* 脸白 */}
      <path d="M58 48 L 70 48 L 74 58 L 60 58 Z" fill="#fbf5e3" stroke="none" />
      {/* 眼鼻 */}
      <circle cx="60" cy="48" r="1.6" fill="#2b241e" stroke="none" />
      <circle cx="72" cy="48" r="1.6" fill="#2b241e" stroke="none" />
      <ellipse cx="66" cy="56" rx="2" ry="1.5" fill="#2b241e" stroke="none" />
    </g>
  )
}

/* ——— L5 考拉：圆脸 + 绒耳 + 抱树 ——— */
function Koala() {
  return (
    <g>
      {/* 背后树干 */}
      <rect x="12" y="20" width="12" height="90" rx="2" fill="#4a3a2c" stroke="none" opacity="0.7" />
      <path d="M24 40 C 34 38, 38 28, 46 30" stroke="#4a3a2c" opacity="0.6" />
      {/* 身体 */}
      <ellipse cx="62" cy="78" rx="28" ry="24" fill="currentColor" />
      {/* 头 */}
      <circle cx="62" cy="46" r="22" fill="currentColor" />
      {/* 绒耳（大圆） */}
      <circle cx="40" cy="34" r="12" fill="currentColor" />
      <circle cx="84" cy="34" r="12" fill="currentColor" />
      <circle cx="40" cy="34" r="7" fill="#fbf5e3" stroke="none" />
      <circle cx="84" cy="34" r="7" fill="#fbf5e3" stroke="none" />
      {/* 脸浅色 */}
      <ellipse cx="62" cy="52" rx="14" ry="10" fill="#fbf5e3" stroke="none" />
      {/* 大鼻头 */}
      <ellipse cx="62" cy="50" rx="7" ry="5" fill="#2b241e" stroke="none" />
      {/* 眼睛（小月牙） */}
      <path d="M50 42 q 2 -2 4 0" strokeWidth="2.4" />
      <path d="M70 42 q 2 -2 4 0" strokeWidth="2.4" />
      {/* 爪子抓树 */}
      <path d="M38 76 L 28 72" />
      <path d="M40 90 L 30 90" />
    </g>
  )
}

/* ——— L6 大野猪：厚身 + 獠牙 + 鬃毛 ——— */
function Boar() {
  return (
    <g>
      {/* 身体 */}
      <path d="M20 70 C 24 50, 56 44, 84 50 C 96 52, 100 62, 96 74 L 96 90 L 86 90 L 84 82 L 34 82 L 30 90 L 22 90 Z"
            fill="currentColor" />
      {/* 鬃毛（锯齿） */}
      <path d="M30 54 L 34 46 L 38 54 L 44 44 L 50 54 L 56 44 L 62 54 L 68 44 L 74 54" />
      {/* 头 + 吻 */}
      <ellipse cx="24" cy="64" rx="14" ry="12" fill="currentColor" />
      <ellipse cx="14" cy="66" rx="6" ry="4.5" fill="#2b241e" stroke="none" />
      {/* 鼻孔 */}
      <circle cx="11" cy="64" r="1.2" fill="#fbf5e3" stroke="none" />
      <circle cx="11" cy="68" r="1.2" fill="#fbf5e3" stroke="none" />
      {/* 獠牙 */}
      <path d="M18 68 L 14 76" strokeWidth="2.6" />
      <path d="M22 68 L 20 76" strokeWidth="2.6" />
      {/* 耳朵 */}
      <path d="M28 52 L 34 42 L 36 52 Z" fill="currentColor" />
      {/* 眼 */}
      <circle cx="28" cy="60" r="1.8" fill="#fbf5e3" stroke="none" />
      {/* 腿（短） */}
      <path d="M40 82 L 40 96" strokeWidth="3" />
      <path d="M58 82 L 58 96" strokeWidth="3" />
      <path d="M78 82 L 78 96" strokeWidth="3" />
    </g>
  )
}

/* ——— L7 麋鹿神：大角 + 背上苔藓 + 庄严姿态 ——— */
function Deer() {
  return (
    <g>
      {/* 大角（分叉） */}
      <path d="M44 26 C 42 16, 34 10, 26 6" />
      <path d="M42 18 C 38 14, 32 14, 28 10" />
      <path d="M44 22 C 40 18, 36 18, 30 14" />
      <path d="M70 26 C 72 16, 80 10, 88 6" />
      <path d="M72 18 C 76 14, 82 14, 86 10" />
      <path d="M70 22 C 74 18, 78 18, 84 14" />
      {/* 头 */}
      <ellipse cx="57" cy="38" rx="16" ry="14" fill="currentColor" />
      {/* 脖颈 + 身体 */}
      <path d="M46 48 C 40 60, 32 70, 34 88 L 44 88 L 48 70 L 76 70 L 80 88 L 90 88 C 92 70, 84 60, 78 48"
            fill="currentColor" />
      {/* 背上苔藓点缀 */}
      <circle cx="54" cy="58" r="3" fill="#5f7d4f" stroke="none" />
      <circle cx="60" cy="56" r="2.5" fill="#5f7d4f" stroke="none" />
      <circle cx="66" cy="58" r="3" fill="#5f7d4f" stroke="none" />
      <circle cx="72" cy="56" r="2.5" fill="#5f7d4f" stroke="none" />
      {/* 脸斑 */}
      <path d="M52 40 L 62 40" strokeWidth="1.6" opacity="0.55" />
      {/* 眼 */}
      <circle cx="52" cy="36" r="1.6" fill="#2b241e" stroke="none" />
      <circle cx="62" cy="36" r="1.6" fill="#2b241e" stroke="none" />
      {/* 鼻 */}
      <ellipse cx="57" cy="46" rx="2" ry="1.4" fill="#2b241e" stroke="none" />
      {/* 前蹄点 */}
      <path d="M44 88 L 44 96" strokeWidth="3" />
      <path d="M48 88 L 48 96" strokeWidth="3" />
      <path d="M76 88 L 76 96" strokeWidth="3" />
      <path d="M80 88 L 80 96" strokeWidth="3" />
    </g>
  )
}
