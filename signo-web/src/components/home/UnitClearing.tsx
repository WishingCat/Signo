import { SketchDivider } from '@/components/forest/SketchDivider'

type Props = {
  index: number
  unit: { id: string; order: number; title: string; description: string }
  lessons: { id: string; order: number; title: string; questionCount: number }[]
}

export function UnitClearing({ unit, lessons, index }: Props) {
  const unitNumber = String(index + 1).padStart(2, '0')
  return (
    <section className="relative pl-12">
      <div className="absolute left-0 top-1 h-11 w-11 rounded-full bg-cream border-2 border-moss shadow-[var(--shadow-soft)] flex items-center justify-center">
        <span className="text-[15px] font-semibold text-moss tabular-nums">{unitNumber}</span>
      </div>

      <div className="mb-3">
        <h3 className="brush-text text-[20px] leading-tight">{unit.title}</h3>
        <p className="text-[12px] text-bark/60 mt-0.5">{unit.description}</p>
        <SketchDivider className="mt-2" />
      </div>

      <ul className="space-y-2.5">
        {lessons.map((l, li) => (
          <li key={l.id}>
            <a
              href={`/learn/${l.id}`}
              data-testid="lesson-link"
              className="group flex items-center gap-3 rounded-[14px] px-3 py-2.5 bg-cream/70 hover:bg-cream hover:-translate-y-[1px] transition-all border border-bark/10 shadow-[0_2px_0_rgba(74,58,44,0.06)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-oat border border-bark/15">
                <span className="text-[13px] text-bark/70 tabular-nums">{li + 1}</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] text-ink">{l.title}</span>
                <span className="block text-[11px] text-bark/50">{l.questionCount} 片叶子</span>
              </span>
              <span className="text-[15px] font-medium text-hazel group-hover:translate-x-0.5 transition-transform">
                去 →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
