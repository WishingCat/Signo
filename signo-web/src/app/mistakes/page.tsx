import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSessionUser } from '@/lib/auth/session'
import { getRecentMistakes } from '@/lib/curriculum/service'
import { Mascot } from '@/components/forest/Mascot'
import { SketchDivider } from '@/components/forest/SketchDivider'

export default async function MistakesPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const mistakes = await getRecentMistakes(user.id, 30)

  return (
    <div className="py-6 space-y-4 bloom-in">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="brush-text text-[24px]">错题本</h1>
          <p className="text-[12px] text-bark/60">被风吹落的叶子在这里。</p>
        </div>
        {mistakes.length > 0 && (
          <a href="/review">
            <Button size="md">去复习 →</Button>
          </a>
        )}
      </div>

      {mistakes.length === 0 ? (
        <Card className="text-center py-10">
          <Mascot name="squirrel" className="h-20 w-20 mx-auto text-moss opacity-80" />
          <p className="brush-text text-[20px] mt-3">还没有叶子飘落</p>
          <p className="text-[13px] text-bark/60 mt-1">继续练习，答错的题会被松鼠悄悄藏到这里。</p>
          <a href="/" className="inline-block mt-5">
            <Button>回到森林</Button>
          </a>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {mistakes.map((m, i) => (
            <li key={m.questionId}>
              <Card density="tight" className="flex items-center gap-3">
                <span className="text-[11px] tabular-nums text-bark/40 w-6">{String(i + 1).padStart(2, '0')}</span>

                <div className="h-14 w-14 shrink-0 rounded-[10px] bg-oat border border-bark/10 overflow-hidden relative">
                  {m.promptMediaPath ? (
                    <Image src={m.promptMediaPath} alt={m.promptText ?? ''} fill className="object-contain" sizes="56px" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[15px] text-moss font-medium">
                      {m.promptText?.slice(0, 2) ?? '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-ink truncate">
                    {m.type === 'word2sign' ? `找出"${m.promptText}"` : m.promptText ?? '手语图题'}
                  </div>
                  <div className="text-[11px] text-bark/55 mt-0.5 flex items-center gap-2">
                    <span>{m.lessonTitle}</span>
                    <span>·</span>
                    <span>错 {m.timesWrong} 次</span>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <SketchDivider className="mt-8 opacity-50" />
      <p className="text-center text-[11px] text-bark/50 tracking-[0.2em] uppercase">
        recent · top 30
      </p>
    </div>
  )
}
