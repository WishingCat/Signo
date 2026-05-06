import Link from 'next/link'
import type { LessonTreeItem } from '@/lib/curriculum/types'
import type { LessonProgressMap } from '@/lib/progress/service'
import { cn } from '@/lib/utils'

const X_POSITIONS = [32, 70, 26, 64, 38, 76, 24, 60, 48]
const STEP_Y = 130
const TOP_PADDING = 56

type Props = {
  units: LessonTreeItem[]
  progress: LessonProgressMap
}

export function ForestPath({ units, progress }: Props) {
  return (
    <div className="space-y-8">
      {units.map((u, ui) => (
        <UnitPath
          key={u.unit.id}
          unit={u.unit}
          lessons={u.lessons}
          progress={progress}
          unitIndex={ui}
        />
      ))}
    </div>
  )
}

function UnitPath({
  unit, lessons, progress, unitIndex,
}: {
  unit: LessonTreeItem['unit']
  lessons: LessonTreeItem['lessons']
  progress: LessonProgressMap
  unitIndex: number
}) {
  const nodes = lessons.map((l, i) => ({
    lesson: l,
    x: X_POSITIONS[i % X_POSITIONS.length],
    y: TOP_PADDING + i * STEP_Y,
  }))
  const height = nodes.length === 0
    ? 0
    : TOP_PADDING + (nodes.length - 1) * STEP_Y + 96
  const pathD = buildPath(nodes)
  const cleared = lessons.filter((l) => progress[l.id]).length
  const firstUnclearedIdx = lessons.findIndex((l) => !progress[l.id])
  const currentIdx = firstUnclearedIdx === -1 ? lessons.length : firstUnclearedIdx

  return (
    <section>
      <UnitSign unit={unit} cleared={cleared} total={lessons.length} index={unitIndex} />
      {nodes.length > 0 && (
        <div className="relative" style={{ height }}>
          <svg
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full text-moss/55"
            aria-hidden
          >
            <path
              d={pathD}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 7"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {nodes.map((n, i) => (
            <LessonNode
              key={n.lesson.id}
              x={n.x}
              y={n.y}
              order={i + 1}
              lesson={n.lesson}
              stars={progress[n.lesson.id]?.stars ?? 0}
              state={
                progress[n.lesson.id]
                  ? 'cleared'
                  : i === currentIdx
                    ? 'current'
                    : 'future'
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}

function buildPath(nodes: { x: number; y: number }[]): string {
  if (nodes.length === 0) return ''
  let d = `M ${nodes[0].x} ${nodes[0].y}`
  for (let i = 1; i < nodes.length; i++) {
    const p = nodes[i - 1]
    const c = nodes[i]
    const midY = (p.y + c.y) / 2
    d += ` C ${p.x} ${midY + 22}, ${c.x} ${midY - 22}, ${c.x} ${c.y}`
  }
  return d
}

function UnitSign({
  unit, cleared, total, index,
}: {
  unit: LessonTreeItem['unit']
  cleared: number
  total: number
  index: number
}) {
  return (
    <div className="text-center mb-1">
      <div className="inline-flex items-center gap-2 rounded-full bg-moss/10 border border-moss/30 px-3.5 py-1.5">
        <span className="text-[11px] tracking-[0.2em] uppercase text-moss/80 tabular-nums">
          ch.{String(index + 1).padStart(2, '0')}
        </span>
        <span className="brush-text text-[16px] text-ink leading-none">{unit.title}</span>
        <span className="text-[10px] text-bark/55 tabular-nums">{cleared}/{total}</span>
      </div>
      <p className="text-[12px] text-bark/55 mt-1.5">{unit.description}</p>
    </div>
  )
}

function LessonNode({
  x, y, order, lesson, stars, state,
}: {
  x: number
  y: number
  order: number
  lesson: LessonTreeItem['lessons'][number]
  stars: number
  state: 'cleared' | 'current' | 'future'
}) {
  return (
    <Link
      href={`/learn/${lesson.id}`}
      data-testid="lesson-link"
      aria-label={`第 ${order} 关：${lesson.title}`}
      className="absolute group"
      style={{ left: `${x}%`, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {state === 'current' && (
        <span
          className="absolute inset-0 -m-2 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(199,127,68,0.4) 0%, rgba(199,127,68,0) 70%)',
            animation: 'firefly-pulse 2.6s ease-in-out infinite',
          }}
          aria-hidden
        />
      )}
      <div
        className={cn(
          'relative w-[68px] h-[68px] rounded-full flex items-center justify-center transition-transform group-hover:-translate-y-[2px]',
          state === 'cleared' &&
            'bg-cream border-[2.5px] border-moss shadow-[0_4px_12px_-4px_rgba(95,125,79,0.45)]',
          state === 'current' &&
            'bg-cream border-[2.5px] border-hazel shadow-[0_6px_14px_-4px_rgba(199,127,68,0.5)]',
          state === 'future' &&
            'paper border-2 border-bark/15',
        )}
      >
        {state === 'cleared' ? (
          <CheckMark />
        ) : (
          <span className={cn(
            'text-[20px] font-semibold tabular-nums',
            state === 'current' ? 'text-hazel' : 'text-bark/55',
          )}>
            {order}
          </span>
        )}
      </div>
      <div className="absolute left-1/2 top-[78px] -translate-x-1/2 w-[110px] text-center">
        <div className={cn(
          'text-[12.5px] leading-tight truncate',
          state === 'future' ? 'text-bark/65' : 'text-ink',
        )}>
          {lesson.title}
        </div>
        {state === 'cleared' ? (
          <div className="flex justify-center gap-0.5 mt-1">
            {[1, 2, 3].map((s) => (
              <svg key={s} viewBox="0 0 24 24" className={cn('h-3 w-3', s <= stars ? 'text-hazel' : 'text-bark/15')} fill="currentColor">
                <path d="M12 2 L14.8 9 L22 9.6 L16.4 14.4 L18.2 21.4 L12 17.6 L5.8 21.4 L7.6 14.4 L2 9.6 L9.2 9 Z" />
              </svg>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-bark/45 tabular-nums mt-0.5">{lesson.questionCount} 题</div>
        )}
      </div>
    </Link>
  )
}

function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-moss" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12 L 10 17 L 19 7" />
    </svg>
  )
}
