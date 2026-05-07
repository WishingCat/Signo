'use client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mascot, type MascotName } from '@/components/forest/Mascot'
import { Leaf } from '@/components/forest/Leaf'
import { Firefly } from '@/components/forest/Firefly'
import { LeafCoin } from '@/components/forest/LeafCoin'
import { cn } from '@/lib/utils'
import type { ClearLessonResult } from '@/lib/curriculum/learn.schema'

type Props = {
  result: ClearLessonResult
  onBack: () => void
  /** "关卡完成"或"复习完成"等标题覆盖 */
  perfectTitle?: string
  passingTitle?: string
  /** 按钮文案 */
  backLabel?: string
}

export function CompletionScreen({
  result,
  onBack,
  perfectTitle = '叶落满径',
  passingTitle = '又有一片叶子落下',
  backLabel = '回到森林',
}: Props) {
  const perfect = result.correct === result.total
  const mascot: MascotName = perfect ? 'fox' : 'squirrel'
  const streakMsg = streakBanner(result.streak)

  return (
    <div className="py-8 relative bloom-in" data-testid="lesson-complete">
      {[
        { left: '8%',  delay: '0s',   color: 'var(--color-moss)',  rotate: -20, size: 34 },
        { left: '24%', delay: '0.4s', color: 'var(--color-sage)',  rotate: 12,  size: 28 },
        { left: '74%', delay: '0.2s', color: 'var(--color-hazel)', rotate: -10, size: 30 },
        { left: '88%', delay: '0.8s', color: 'var(--color-moss)',  rotate: 30,  size: 26 },
      ].map((l, i) => (
        <div
          key={i}
          className="absolute top-0 pointer-events-none"
          style={{ left: l.left, animation: `celebrate-leaves 4.5s ${l.delay} cubic-bezier(.3,.5,.5,1) infinite` }}
        >
          <Leaf size={l.size} color={l.color} rotate={l.rotate} />
        </div>
      ))}

      <div className="text-center mb-5 relative">
        <div className="relative inline-block">
          <Firefly className="absolute -top-2 -left-4" intensity={1} />
          <Firefly className="absolute -top-1 -right-5" intensity={0.8} period={2.8} />
          <Firefly className="absolute top-8 left-12" intensity={0.6} period={4} />
          <Mascot name={mascot} className="h-28 w-28 mx-auto text-bark" />
        </div>
        <h1 className="brush-text text-[28px] mt-2">
          {perfect ? perfectTitle : passingTitle}
        </h1>
        <p className="text-[13px] text-bark/60 mt-1">
          {perfect ? '全部答对——林子给你鼓掌' : '慢慢来，树也没有一次就长高'}
        </p>
        {streakMsg && (
          <p className="mt-2 text-[13px] text-hazel">
            <span className="inline-block align-middle mr-1">🔥</span>
            {streakMsg}
          </p>
        )}
        {result.dailyQuest.event === 'just-crossed' && (
          <p className="mt-2 text-[13px] text-moss font-medium inline-flex items-center gap-1">
            <LeafCoin iconOnly size={16} />
            <span>每日任务达成 · +{result.dailyQuest.bonusXp} XP · +{result.dailyQuest.bonusLeaves} 落叶</span>
          </p>
        )}
      </div>

      <Card tilt="right" density="loose" className="mx-2">
        <div className="flex justify-center gap-1 mb-4">
          {[1, 2, 3].map((s) => <StarIcon key={s} lit={s <= result.stars} index={s} />)}
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Stat label="答对" value={`${result.correct} / ${result.total}`} />
          <Stat label="获得" value={`+${result.xp} XP`} accent testId="xp-gain" />
          <LeafStat earned={result.leavesEarned} />
          <Stat label="连胜" value={`${result.streak.currentStreak} 天`} />
        </div>
        <Button size="lg" className="w-full" onClick={onBack}>{backLabel}</Button>
      </Card>
    </div>
  )
}

function Stat({ label, value, accent = false, testId }: { label: string; value: string; accent?: boolean; testId?: string }) {
  return (
    <div className="text-center">
      <div
        data-testid={testId}
        className={cn('leading-none tabular-nums', accent ? 'text-[24px] text-hazel font-medium' : 'text-[18px] text-ink')}
      >
        {value}
      </div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-bark/50 mt-1">{label}</div>
    </div>
  )
}

function LeafStat({ earned }: { earned: number }) {
  return (
    <div className="text-center" data-testid="leaves-gain">
      <div className="leading-none tabular-nums text-[18px] text-ink inline-flex items-center justify-center gap-1">
        <span>+{earned}</span>
        <LeafCoin iconOnly size={18} />
      </div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-bark/50 mt-1">落叶</div>
    </div>
  )
}

function StarIcon({ lit, index }: { lit: boolean; index: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-9 w-9 transition-all', lit ? 'text-hazel' : 'text-bark/15')}
      style={{ animation: lit ? `bloom-in 500ms ${index * 140}ms both` : undefined }}
      fill="currentColor"
    >
      <path d="M12 2 L14.8 9 L22 9.6 L16.4 14.4 L18.2 21.4 L12 17.6 L5.8 21.4 L7.6 14.4 L2 9.6 L9.2 9 Z" />
    </svg>
  )
}

function streakBanner(s: ClearLessonResult['streak']): string | null {
  if (s.event === 'started') return '连胜第 1 天——林子记住了你的脚印。'
  if (s.event === 'continued') {
    if (s.currentStreak === s.bestStreak && s.currentStreak >= 3) return `连胜 ${s.currentStreak} 天！打破你自己最好成绩。`
    return `连胜 ${s.currentStreak} 天`
  }
  if (s.event === 'reset') return '重新点起火苗——从今天再数。'
  return null
}
