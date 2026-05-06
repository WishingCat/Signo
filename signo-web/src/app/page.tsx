import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getLessonTree } from '@/lib/curriculum/service'
import { getSessionUser } from '@/lib/auth/session'

export default async function Home() {
  const [tree, user] = await Promise.all([getLessonTree(), getSessionUser()])

  if (tree.length === 0) {
    return (
      <main className="px-4 py-6">
        <Card>
          <p className="text-bark/70">森林里还没有课程，稍后再来。</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="px-4 py-6 space-y-4">
      {!user && (
        <Card className="text-sm text-bark/70">
          你还没有登录。
          <a href="/register" className="text-hazel underline ml-1">
            创建一个账号
          </a>
          就能在这片森林里留下脚印。
        </Card>
      )}

      {tree.map(({ unit, lessons }) => (
        <Card key={unit.id}>
          <h2 className="text-moss font-semibold mb-2">{unit.title}</h2>
          <p className="text-sm text-bark/70 mb-3">{unit.description}</p>
          <ul className="space-y-2">
            {lessons.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex-1">
                  {l.title}
                  <span className="text-bark/40 text-xs ml-2">
                    {l.questionCount} 题
                  </span>
                </span>
                <a href={`/learn/${l.id}`}>
                  <Button>开始</Button>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </main>
  )
}
