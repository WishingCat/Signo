import { Mascot } from './Mascot'

/** 页脚爬行的蚂蚁队列。CSS 动画持续向右行进。 */
export function AntTrail() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-0 left-0 right-0 h-10 overflow-hidden"
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
