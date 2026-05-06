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
  choices: string[]
}
