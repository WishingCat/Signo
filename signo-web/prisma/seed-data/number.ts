import type { ChapterSpec } from './types';

/** 数字：theme='数字' 下 24 个手势（0-10, 20..100, 千/万/亿, 数/数量）。 */
export const numberChapter: ChapterSpec = {
  order: 2,
  title: '数字',
  description: '0-10、整十到亿的手势',
  iconKey: 'number',
  lessons: [
    {
      order: 1,
      title: '个位 1–5',
      signIds: [
        6670, // 1
        6671, // 2
        6672, // 3
        6673, // 4
        6674, // 5
        6669, // 0（做干扰/复习）
      ],
    },
    {
      order: 2,
      title: '个位 6–10',
      signIds: [
        6675, // 6
        6676, // 7
        6677, // 8
        6678, // 9
        6679, // 10
        6669, // 0
      ],
    },
    {
      order: 3,
      title: '整十 20–70',
      signIds: [
        6680, // 20
        6681, // 30
        6682, // 40
        6683, // 50
        6684, // 60
        6685, // 70
      ],
    },
    {
      order: 4,
      title: '大数 80–亿',
      signIds: [
        6686, // 80
        6687, // 90
        6688, // 100
        6689, // 千
        6690, // 万
        6691, // 亿
      ],
    },
    {
      order: 5,
      title: '综合复习',
      signIds: [
        6670, // 1
        6679, // 10
        6688, // 100
        6689, // 千
        6690, // 万
        4686, // 数
      ],
    },
  ],
};
