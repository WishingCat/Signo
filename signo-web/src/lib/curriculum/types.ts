export type UnitSummary = {
  id: string
  order: number
  title: string
  description: string
  iconKey: string
}

export type LessonSummary = {
  id: string
  order: number
  title: string
  questionCount: number
}

export type LessonTreeItem = {
  unit: UnitSummary
  lessons: LessonSummary[]
}

export type LearnQuestion = {
  id: string
  order: number
  type: 'sign2word' | 'word2sign'
  promptText: string | null
  promptMediaPath: string | null
  /** sign2word 为文字标签；word2sign 为图片路径 */
  choices: string[]
}

export type MistakeItem = {
  questionId: string
  lessonId: string
  lessonTitle: string
  promptText: string | null
  promptMediaPath: string | null
  type: 'sign2word' | 'word2sign'
  timesWrong: number
  lastWrongAt: Date
}
