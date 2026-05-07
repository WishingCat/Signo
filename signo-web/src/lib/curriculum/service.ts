import { prisma } from '@/lib/db'
import type { LearnQuestion, LessonTreeItem, MistakeItem } from './types'

export async function getLessonTree(): Promise<LessonTreeItem[]> {
  const units = await prisma.unit.findMany({
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { questions: true } } },
      },
    },
  })

  return units.map((u) => ({
    unit: {
      id: u.id,
      order: u.order,
      title: u.title,
      description: u.description,
      iconKey: u.iconKey,
    },
    lessons: u.lessons.map((l) => ({
      id: l.id,
      order: l.order,
      title: l.title,
      questionCount: l._count.questions,
    })),
  }))
}

export async function getQuestionsForLesson(
  lessonId: string,
): Promise<LearnQuestion[]> {
  const qs = await prisma.question.findMany({
    where: { lessonId },
    orderBy: { order: 'asc' },
    include: { promptMedia: true },
  })

  return qs.map(toLearnQuestion)
}

function toLearnQuestion(q: {
  id: string
  order: number
  type: string
  promptText: string | null
  promptMedia: { path: string } | null
  choicesJson: string
}): LearnQuestion {
  return {
    id: q.id,
    order: q.order,
    type: (q.type === 'word2sign' ? 'word2sign' : 'sign2word') as LearnQuestion['type'],
    promptText: q.promptText,
    promptMediaPath: q.promptMedia?.path ?? null,
    choices: safeParseChoices(q.choicesJson),
  }
}

export async function gradeAnswer(
  questionId: string,
  choiceIndex: number,
): Promise<{ correct: boolean }> {
  const q = await prisma.question.findUnique({ where: { id: questionId } })
  if (!q) return { correct: false }
  return { correct: q.answerIndex === choiceIndex }
}

/** 前端逐题反馈用：返回是否正确 + 正解索引 + 打法解释。
 *  不落 Attempt 行 —— Attempt 只在 onLessonClear / onReviewClear 写入。 */
export async function gradeQuestionDetailed(
  questionId: string,
  choiceIndex: number,
): Promise<{ isCorrect: boolean; correctIndex: number; explanation: string | null } | null> {
  const q = await prisma.question.findUnique({
    where: { id: questionId },
    select: { answerIndex: true, explanation: true },
  })
  if (!q) return null
  return {
    isCorrect: q.answerIndex === choiceIndex,
    correctIndex: q.answerIndex,
    explanation: q.explanation,
  }
}

export async function getQuestionsMapForLesson(lessonId: string) {
  const qs = await prisma.question.findMany({
    where: { lessonId },
    select: { id: true, answerIndex: true },
  })
  return new Map(qs.map((q) => [q.id, q.answerIndex]))
}

/** 用户最近的错题汇总，按最近一次错误时间倒序 */
export async function getRecentMistakes(
  userId: string,
  limit = 20,
): Promise<MistakeItem[]> {
  const wrongs = await prisma.attempt.findMany({
    where: { userId, isCorrect: false },
    orderBy: { answeredAt: 'desc' },
    take: limit * 4,
    include: {
      question: {
        include: { promptMedia: true, lesson: true },
      },
    },
  })
  const byQ = new Map<string, MistakeItem>()
  for (const w of wrongs) {
    const q = w.question
    const existing = byQ.get(q.id)
    if (existing) {
      existing.timesWrong += 1
      continue
    }
    byQ.set(q.id, {
      questionId: q.id,
      lessonId: q.lessonId,
      lessonTitle: q.lesson.title,
      promptText: q.promptText,
      promptMediaPath: q.promptMedia?.path ?? null,
      type: (q.type === 'word2sign' ? 'word2sign' : 'sign2word') as MistakeItem['type'],
      timesWrong: 1,
      lastWrongAt: w.answeredAt,
    })
    if (byQ.size >= limit) break
  }
  return Array.from(byQ.values())
}

/** 拼出复习关题目集：取用户最近 N 道错题（去重），补全为 LearnQuestion */
export async function getReviewSet(
  userId: string,
  size = 6,
): Promise<LearnQuestion[]> {
  const mistakes = await getRecentMistakes(userId, size)
  if (mistakes.length === 0) return []
  const ids = mistakes.map((m) => m.questionId)
  const qs = await prisma.question.findMany({
    where: { id: { in: ids } },
    include: { promptMedia: true },
  })
  const map = new Map(qs.map((q) => [q.id, q]))
  return mistakes
    .map((m, i) => {
      const q = map.get(m.questionId)
      if (!q) return null
      return { ...toLearnQuestion(q), order: i }
    })
    .filter((x): x is LearnQuestion => x !== null)
}

/** 只给 questionId → answerIndex 的映射（review 用，不依赖 lessonId） */
export async function getQuestionsMapByIds(questionIds: string[]) {
  const qs = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, answerIndex: true },
  })
  return new Map(qs.map((q) => [q.id, q.answerIndex]))
}

function safeParseChoices(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}
