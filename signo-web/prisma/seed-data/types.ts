export type LessonSpec = {
  order: number;
  title: string;
  /** Pool of sign_themed.db signIds; one Question per entry.
   * Distractors for each question are drawn from the OTHER signIds in this same pool. */
  signIds: number[];
};

export type ChapterSpec = {
  order: number;
  title: string;
  description: string;
  iconKey: string;
  lessons: LessonSpec[];
};
