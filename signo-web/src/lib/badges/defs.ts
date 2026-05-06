export type BadgeDef = {
  slug: string
  title: string
  description: string
  emoji: string
  sortOrder: number
}

/**
 * W2 首批 5 枚徽章。新徽章只需在此追加 + 在 rules.ts 加一条判定。
 */
export const BADGES: BadgeDef[] = [
  {
    slug: 'first-clear',
    title: '第一片叶子',
    description: '完成了你的第一关。',
    emoji: '🍃',
    sortOrder: 1,
  },
  {
    slug: 'first-perfect',
    title: '三叶齐光',
    description: '首次满分通过一关。',
    emoji: '✨',
    sortOrder: 2,
  },
  {
    slug: 'streak-3',
    title: '三日不辍',
    description: '连续 3 天都走进了森林。',
    emoji: '🔥',
    sortOrder: 3,
  },
  {
    slug: 'xp-100',
    title: '百叶入怀',
    description: '累计获得 100 XP。',
    emoji: '🌿',
    sortOrder: 4,
  },
  {
    slug: 'reviewer',
    title: '拾叶者',
    description: '完成了一次复习关。',
    emoji: '🧺',
    sortOrder: 5,
  },
]
