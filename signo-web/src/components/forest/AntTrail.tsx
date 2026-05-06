import { Mascot } from './Mascot'

/** 装饰用蚂蚁队列。父容器决定定位（fixed / absolute），本组件只负责水平爬行动画。 */
export function AntTrail() {
  return (
    <div
      aria-hidden
      className="pointer-events-none w-full h-10 overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div
        className="flex items-end gap-8 pb-1"
        style={{
          width: 'max-content',
          animation: 'ant-march 48s linear infinite',
          color: 'var(--color-bark)',
        }}
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <Mascot
            key={i}
            name="ant"
            className="h-5 w-5 shrink-0"
            title={i === 0 ? '蚂蚁队列' : undefined}
          />
        ))}
      </div>
    </div>
  )
}
