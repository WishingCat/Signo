import { Mushroom } from './Mushroom'
import { Fern } from './Fern'

/**
 * 森林地面：苔藓起伏 + 鹅卵石 + 散落叶 + 蕨叶 + 蘑菇丛。
 * 替代旧的 AntTrail，作为底栏正上方的自然结尾。
 */
export function MossGround() {
  return (
    <div className="relative h-16 w-full pointer-events-none" aria-hidden>
      <svg
        viewBox="0 0 600 64"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {/* moss waves */}
        <path
          d="M 0 64 L 0 40 C 30 30, 60 36, 100 32 C 140 28, 180 38, 220 30 C 260 22, 300 32, 340 28 C 380 24, 420 34, 460 30 C 500 26, 540 32, 600 28 L 600 64 Z"
          fill="#5f7d4f"
          opacity="0.5"
        />
        <path
          d="M 0 64 L 0 50 C 40 44, 90 48, 140 44 C 200 40, 260 50, 320 46 C 380 42, 440 48, 500 44 C 540 42, 580 46, 600 44 L 600 64 Z"
          fill="#5f7d4f"
          opacity="0.7"
        />
        {/* pebbles */}
        <ellipse cx="120" cy="48" rx="10" ry="5" fill="#a09483" />
        <ellipse cx="380" cy="46" rx="8" ry="4" fill="#8a7e6f" />
        <ellipse cx="520" cy="50" rx="6" ry="3" fill="#9c8e7d" />
        {/* fallen leaves */}
        <path d="M 60 50 C 70 44, 80 50, 74 56 C 64 58, 56 54, 60 50 Z" fill="#3d6135" opacity="0.7" />
        <path d="M 280 52 C 290 46, 300 52, 294 58 C 284 60, 276 56, 280 52 Z" fill="#7da155" opacity="0.6" />
        <path d="M 460 48 C 470 42, 478 48, 472 54 C 462 56, 456 52, 460 48 Z" fill="#5f7d4f" opacity="0.7" />
      </svg>
      {/* fern (left) */}
      <div className="absolute left-1 bottom-0" style={{ width: 36, height: 60 }}>
        <Fern className="w-full h-full" />
      </div>
      {/* mushroom cluster (right) */}
      <div className="absolute right-2 bottom-1" style={{ width: 56, height: 40 }}>
        <Mushroom variant="cluster" className="w-full h-full" />
      </div>
    </div>
  )
}
