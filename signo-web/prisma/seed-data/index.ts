import { bodyChapter } from './body';
import { commonChapter } from './common';
import { numberChapter } from './number';
import type { ChapterSpec } from './types';

export const CHAPTERS: ChapterSpec[] = [commonChapter, numberChapter, bodyChapter];
