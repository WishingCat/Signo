type Props = {
  side?: 'left' | 'right'
  delay?: string
}

/**
 * 林间斜射光柱：从顶角斜入的暖黄光梯度，缓慢呼吸。
 * 固定全屏背景层 z-0，与萤火虫共处。
 */
export function LightShaft({ side = 'left', delay = '0s' }: Props) {
  const isLeft = side === 'left'
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 z-0"
      style={{
        [isLeft ? 'left' : 'right']: '-15%',
        width: '70%',
        height: '120vh',
        background: isLeft
          ? 'linear-gradient(150deg, rgba(243, 201, 105, 0.20) 0%, rgba(243, 201, 105, 0.06) 25%, transparent 52%)'
          : 'linear-gradient(210deg, rgba(243, 201, 105, 0.16) 0%, rgba(243, 201, 105, 0.04) 22%, transparent 50%)',
        animation: `light-pulse 8s ease-in-out ${delay} infinite alternate`,
        filter: 'blur(3px)',
      }}
    />
  )
}
