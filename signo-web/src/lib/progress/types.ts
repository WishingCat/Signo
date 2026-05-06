export type GradedAnswer = {
  questionId: string
  choice: number
  msSpent: number
  isCorrect: boolean
}

export type ClearResult = {
  xp: number
  correct: number
  total: number
  stars: 1 | 2 | 3
}

export type OnLessonClearArgs = {
  userId: string
  lessonId: string
  graded: GradedAnswer[]
  totalInLesson: number
}
