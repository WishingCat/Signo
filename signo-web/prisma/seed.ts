import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
})
const db = new PrismaClient({ adapter })

type Item = { file: string; label: string }
type Category = { key: string; title: string; items: Item[] }

const CATALOG: Category[] = [
  {
    key: 'top',
    title: '上衣',
    items: [
      { file: 'top-1.jpg', label: '羽绒服' },
      { file: 'top-2.jpg', label: 'T 恤' },
      { file: 'top-3.jpg', label: '毛衣' },
      { file: 'top-4.jpg', label: '衬衫' },
    ],
  },
  {
    key: 'bottom',
    title: '下装',
    items: [
      { file: 'bottom-1.jpg', label: '牛仔裤' },
      { file: 'bottom-2.jpg', label: '毛裤' },
      { file: 'bottom-3.jpg', label: '短裤' },
      { file: 'bottom-4.jpg', label: '裙子' },
    ],
  },
  {
    key: 'shoe',
    title: '鞋类',
    items: [
      { file: 'shoe-1.jpg', label: '皮鞋' },
      { file: 'shoe-2.jpg', label: '高跟鞋' },
      { file: 'shoe-3.jpg', label: '拖鞋' },
      { file: 'shoe-4.png', label: '靴子' },
    ],
  },
]

async function resetCurriculum() {
  await db.attempt.deleteMany()
  await db.lessonClear.deleteMany()
  await db.question.deleteMany()
  await db.lesson.deleteMany()
  await db.unit.deleteMany()
  await db.media.deleteMany()
}

async function main() {
  await resetCurriculum()

  const unit = await db.unit.create({
    data: {
      order: 1,
      title: '日常穿搭',
      description: '入门常用服饰词（占位素材，待正式补拍）',
      iconKey: 'clothes',
    },
  })

  for (const [lessonOrder, category] of CATALOG.entries()) {
    const lesson = await db.lesson.create({
      data: {
        unitId: unit.id,
        order: lessonOrder + 1,
        title: category.title,
      },
    })

    const labels = category.items.map((i) => i.label)

    for (const [qOrder, item] of category.items.entries()) {
      const media = await db.media.create({
        data: {
          kind: 'image',
          path: `/signs/${item.file}`,
          license: '临时自用占位图，正式上线前替换',
        },
      })
      await db.question.create({
        data: {
          lessonId: lesson.id,
          order: qOrder,
          type: 'sign2word',
          promptText: null,
          promptMediaId: media.id,
          choicesJson: JSON.stringify(labels),
          answerIndex: qOrder,
        },
      })
    }
  }

  const unitCount = await db.unit.count()
  const lessonCount = await db.lesson.count()
  const questionCount = await db.question.count()
  console.log(
    `seed: ok (units=${unitCount}, lessons=${lessonCount}, questions=${questionCount})`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
