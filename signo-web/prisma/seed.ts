import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { CHAPTERS } from './seed-data'
import { getMeanings, getSign, getImageAbsolutePath } from '../src/lib/signDb/service'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
})
const db = new PrismaClient({ adapter })

const BADGES = [
  { slug: 'first-clear',   title: '第一片叶子', description: '完成了你的第一关。',         emoji: '🍃', sortOrder: 1 },
  { slug: 'first-perfect', title: '三叶齐光',   description: '首次满分通过一关。',         emoji: '✨', sortOrder: 2 },
  { slug: 'streak-3',      title: '三日不辍',   description: '连续 3 天都走进了森林。',    emoji: '🔥', sortOrder: 3 },
  { slug: 'xp-100',        title: '百叶入怀',   description: '累计获得 100 XP。',           emoji: '🌿', sortOrder: 4 },
  { slug: 'reviewer',      title: '拾叶者',     description: '完成了一次复习关。',         emoji: '🧺', sortOrder: 5 },
]

const LICENSE = '改编自《国家通用手语词典》· 非商用'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickN<T>(pool: T[], n: number, rand: () => number): T[] {
  const copy = pool.slice()
  const out: T[] = []
  while (out.length < n && copy.length) {
    const i = Math.floor(rand() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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

/** Resolve a signId → its primary label (first meaning).
 *  Fail-fast if sign missing or image missing — never silently ship a broken question. */
function labelOf(signId: number): string {
  const sign = getSign(signId)
  if (!sign) throw new Error(`seed: signId ${signId} not found in sign_themed.db`)
  if (!getImageAbsolutePath(signId)) {
    throw new Error(`seed: image missing for signId ${signId} (${sign.imagePath})`)
  }
  const meanings = getMeanings(signId)
  if (meanings.length === 0) throw new Error(`seed: signId ${signId} has no meanings`)
  return meanings[0].text
}

async function seedChapters() {
  const rand = mulberry32(Number(process.env.SEED_SEED ?? 42))
  for (const chapter of CHAPTERS) {
    const unit = await db.unit.create({
      data: {
        order: chapter.order,
        title: chapter.title,
        description: chapter.description,
        iconKey: chapter.iconKey,
      },
    })
    for (const lessonSpec of chapter.lessons) {
      const lesson = await db.lesson.create({
        data: { unitId: unit.id, order: lessonSpec.order, title: lessonSpec.title },
      })
      const poolLabels = new Map<number, string>()
      for (const id of lessonSpec.signIds) poolLabels.set(id, labelOf(id))
      for (const [qOrder, signId] of lessonSpec.signIds.entries()) {
        const sign = getSign(signId)!
        const correct = poolLabels.get(signId)!
        const distractorCandidates = [...poolLabels.entries()]
          .filter(([id, text]) => id !== signId && text !== correct)
          .map(([, text]) => text)
        const uniqueDistractors = Array.from(new Set(distractorCandidates))
        if (uniqueDistractors.length < 3) {
          throw new Error(
            `seed: lesson "${lessonSpec.title}" not enough unique distractors for "${correct}" (have ${uniqueDistractors.length})`,
          )
        }
        const distractors = pickN(uniqueDistractors, 3, rand)
        const choices = shuffle([correct, ...distractors], rand)
        const answerIndex = choices.indexOf(correct)
        const media = await db.media.create({
          data: {
            kind: 'image',
            path: `/api/signs/image/${signId}`,
            license: LICENSE,
            signer: sign.sourceEntry ?? null,
          },
        })
        await db.question.create({
          data: {
            lessonId: lesson.id,
            order: qOrder,
            type: 'sign2word',
            promptText: null,
            promptMediaId: media.id,
            choicesJson: JSON.stringify(choices),
            answerIndex,
            explanation: sign.description,
          },
        })
      }
    }
  }
}

async function main() {
  await resetCurriculum()
  await seedBadges()
  await seedChapters()
  const [u, l, q, m, b] = await Promise.all([
    db.unit.count(), db.lesson.count(), db.question.count(), db.media.count(), db.badge.count(),
  ])
  console.log(`seed: ok (units=${u}, lessons=${l}, questions=${q}, media=${m}, badges=${b})`)
}

main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => db.$disconnect())
