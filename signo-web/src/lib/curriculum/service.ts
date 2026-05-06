import { prisma } from '@/lib/db'
import type { LearnQuestion, LessonTreeItem } from './types'

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

  return qs.map((q) => ({
    id: q.id,
    order: q.order,
    type: (q.type === 'word2sign' ? 'word2sign' : 'sign2word') as LearnQuestion['type'],
    promptText: q.promptText,
    promptMediaPath: q.promptMedia?.path ?? null,
    choices: safeParseChoices(q.choicesJson),
  }))
}

export async function gradeAnswer(
  questionId: string,
  choiceIndex: number,
): Promise<{ correct: boolean }> {
  const q = await prisma.question.findUnique({ where: { id: questionId } })
  if (!q) return { correct: false }
  return { correct: q.answerIndex === choiceIndex }
}

export async function getQuestionsMapForLesson(lessonId: string) {
  const qs = await prisma.question.findMany({
    where: { lessonId },
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
