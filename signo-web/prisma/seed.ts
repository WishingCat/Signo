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

const BADGES = [
  { slug: 'first-clear',   title: '第一片叶子', description: '完成了你的第一关。',         emoji: '🍃', sortOrder: 1 },
  { slug: 'first-perfect', title: '三叶齐光',   description: '首次满分通过一关。',         emoji: '✨', sortOrder: 2 },
  { slug: 'streak-3',      title: '三日不辍',   description: '连续 3 天都走进了森林。',    emoji: '🔥', sortOrder: 3 },
  { slug: 'xp-100',        title: '百叶入怀',   description: '累计获得 100 XP。',           emoji: '🌿', sortOrder: 4 },
  { slug: 'reviewer',      title: '拾叶者',     description: '完成了一次复习关。',         emoji: '🧺', sortOrder: 5 },
]

async function resetCurriculum() {
  await db.attempt.deleteMany()
  await db.lessonClear.deleteMany()
  await db.question.deleteMany()
  await db.lesson.deleteMany()
  await db.unit.deleteMany()
  await db.media.deleteMany()
}

async function seedBadges() {
  for (const b of BADGES) {
    await db.badge.upsert({
      where: { slug: b.slug },
      update: { title: b.title, description: b.description, emoji: b.emoji, sortOrder: b.sortOrder },
      create: b,
    })
  }
}

async function main() {
  await resetCurriculum()
  await seedBadges()

  const unit = await db.unit.create({
    data: {
      order: 1,
      title: '日常穿搭',
      description: '入门常用服饰词（占位素材，待正式补拍）',
      iconKey: 'clothes',
    },
  })

  // Lessons 1-3: sign2word（看手语选词）—— 上衣 / 下装 / 鞋类
  for (const [lessonOrder, category] of CATALOG.entries()) {
    const lesson = await db.lesson.create({
      data: { unitId: unit.id, order: lessonOrder + 1, title: category.title },
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

  // Lesson 4: word2sign（看词选手语）—— 使用"上衣"四张图作为选项
  const tops = CATALOG[0]
  const topPaths = tops.items.map((i) => `/signs/${i.file}`)
  const lesson4 = await db.lesson.create({
    data: { unitId: unit.id, order: 4, title: '反向练习 · 上衣' },
  })
  for (const [qOrder, item] of tops.items.entries()) {
    await db.question.create({
      data: {
        lessonId: lesson4.id,
        order: qOrder,
        type: 'word2sign',
        promptText: item.label,
        promptMediaId: null,
        choicesJson: JSON.stringify(topPaths),
        answerIndex: qOrder,
      },
    })
  }

  const unitCount = await db.unit.count()
  const lessonCount = await db.lesson.count()
  const questionCount = await db.question.count()
  const badgeCount = await db.badge.count()
  console.log(
    `seed: ok (units=${unitCount}, lessons=${lessonCount}, questions=${questionCount}, badges=${badgeCount})`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
