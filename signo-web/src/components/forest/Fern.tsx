type Props = {
  className?: string
  mirror?: boolean
}

/** 蕨类叶片，曲茎 + 11 对羽叶 + 卷曲尖端，向上挺伸。mirror=true 翻转用作右侧装饰。 */
export function Fern({ className, mirror = false }: Props) {
  return (
    <svg
      viewBox="0 0 100 140"
      className={className}
      style={mirror ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden
    >
      <path
        d="M 50 138 C 48 110, 42 70, 28 18"
        stroke="#5f7d4f"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* paired leaflets, decreasing toward the tip */}
      <ellipse cx="32" cy="120" rx="22" ry="6.5" fill="#5f7d4f" transform="rotate(-22 32 120)" />
      <ellipse cx="68" cy="120" rx="22" ry="6.5" fill="#5f7d4f" transform="rotate(22 68 120)" />
      <ellipse cx="32" cy="100" rx="20" ry="6" fill="#5f7d4f" transform="rotate(-26 32 100)" />
      <ellipse cx="68" cy="100" rx="20" ry="6" fill="#5f7d4f" transform="rotate(26 68 100)" />
      <ellipse cx="34" cy="78" rx="17" ry="5.5" fill="#5f7d4f" transform="rotate(-30 34 78)" />
      <ellipse cx="66" cy="78" rx="17" ry="5.5" fill="#5f7d4f" transform="rotate(30 66 78)" />
      <ellipse cx="36" cy="58" rx="13" ry="5" fill="#5f7d4f" transform="rotate(-34 36 58)" />
      <ellipse cx="60" cy="58" rx="13" ry="5" fill="#5f7d4f" transform="rotate(34 60 58)" />
      <ellipse cx="36" cy="40" rx="10" ry="4" fill="#5f7d4f" transform="rotate(-38 36 40)" />
      <ellipse cx="54" cy="38" rx="10" ry="4" fill="#5f7d4f" transform="rotate(38 54 38)" />
      <ellipse cx="36" cy="24" rx="6" ry="3" fill="#5f7d4f" transform="rotate(-42 36 24)" />
      <ellipse cx="46" cy="22" rx="6" ry="3" fill="#5f7d4f" transform="rotate(42 46 22)" />
      <circle cx="30" cy="14" r="3" fill="none" stroke="#5f7d4f" strokeWidth="1.6" />
    </svg>
  )
}
