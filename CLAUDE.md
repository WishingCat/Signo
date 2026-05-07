# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**手诺 · Signo** — sign language learning web app (Duolingo-style answer loop + forest tier/badges/PK gamification + leaves currency, daily quest, team-bonus co-op).

## Repo layout

```
Signo/
├── signo-web/             ← Next.js app — primary work directory, cd here for any pnpm command
├── docs/specs/            ← MVP design spec (forest 段位 system, etc.)
├── docs/superpowers/plans/ ← Multi-week implementation plans (W1 done; W2/W3 done in main)
├── sign-language-database/ ← Upstream 《国家通用手语词典》 SQLite + 6699 illustration JPGs (read-only, non-commercial)
└── 临时题目/              ← Source files for the 12 placeholder sign images (no longer referenced; pre-database baseline)
```

**All commands run from `signo-web/`.**

## Commands

```bash
# dev / prod
pnpm dev                                    # next dev (Turbopack)
pnpm build                                  # production build + TS check
pnpm lint

# tests
pnpm test                                   # vitest run (all unit)
pnpm test:watch
pnpm vitest run tests/unit/scoring.test.ts  # single file
pnpm vitest run -t "lessonStars"            # single test by name
pnpm e2e                                    # playwright (auto-starts dev server, reuses if running)
pnpm playwright install chromium            # one-time

# database
pnpm prisma migrate dev --name <verb_noun>  # creates + applies migration
pnpm prisma generate                        # MUST run after schema edits before TS will compile
pnpm prisma db seed                         # reseed (clears curriculum + reupserts 5 badges + injects 3 chapters from sign_themed.db)
pnpm prisma studio
pnpm sign-db:bootstrap                      # one-time: copy ../sign-language-database/{sign_themed.db,images} → signo-web/data/sign-database/
```

## Stack version pitfalls (read first)

This repo uses bleeding-edge versions with breaking changes from Claude's training. The inner `signo-web/AGENTS.md` says *"This is NOT the Next.js you know"* — heed it: **read `signo-web/node_modules/next/dist/docs/` before writing route handlers, layouts, or new dynamic routes.**

- **Next.js 16** — `params` is `Promise<{...}>`, `cookies()` is async (`await cookies()`).
- **Tailwind 4** — CSS-first config via `@theme` block in `src/app/globals.css`. There is **no `tailwind.config.ts`** — don't try to create one.
- **Prisma 7** — three non-obvious requirements:
  - `prisma.config.ts` at repo root (loads `dotenv/config`, declares `datasource.url` via `env('DATABASE_URL')`). The schema's `datasource` block has provider only, no url.
  - `PrismaClient` constructor **requires** `{ adapter: new PrismaBetterSqlite3({...}) }` — see `src/lib/db.ts`. Cannot instantiate with no args.
  - Generator output is `src/generated/prisma/` (not `node_modules/.prisma/`); imports use `@/generated/prisma/client`. The `.gitignore` excludes this dir.
- **Two env files** — Prisma CLI reads only `.env`; Next.js reads both `.env` and `.env.local`. We split: `DATABASE_URL` → `.env`; `JWT_SECRET` → `.env.local`. Don't merge them.
- **No `server-only` package installed** — don't `import 'server-only'` in `lib/` modules; it will break `pnpm build`. Server-side enforcement here is convention (placement under `lib/<domain>/`), not a runtime guard.
- **`better-sqlite3` typings are a dev dep** (`@types/better-sqlite3`) — required because the app code (not just Prisma's adapter) imports it directly via `src/lib/signDb/db.ts`. If types disappear, reinstall.
- **App SQLite is `signo-web/dev.db`** (resolved from `.env`'s `DATABASE_URL=file:./dev.db` relative to Next.js cwd). Prisma CLI may also create `prisma/dev.db` on some commands — for ad-hoc `sqlite3` queries, target `signo-web/dev.db`. Don't confuse with `data/sign-database/sign_themed.db` (read-only dictionary, separate file).

## Architecture

Strict 3-layer rule (enforced in code review and the W1 plan's "模块化与可扩展性原则"):

```
src/app/                ← Routes & UI. Pages and route.ts files do request parsing,
                          call services, render responses. They DO NOT import prisma.
src/lib/<domain>/       ← Domain services. All Prisma calls live here.
                          Each domain owns its tables and exposes domain types
                          (services convert Prisma rows → DTOs in lib/<domain>/types.ts).
src/lib/db.ts           ← Single PrismaClient, with better-sqlite3 driver adapter.
```

### Domains (`src/lib/`)

| Domain | Owns | Key entry points |
|---|---|---|
| `auth/` | `User`, sessions | `service.ts` (registerUser/authenticateUser), `session.ts` (getSessionUser via cookie) |
| `curriculum/` | `Unit/Lesson/Question/Media` | `service.ts` (getLessonTree, getQuestionsForLesson, getRecentMistakes, getReviewSet, gradeAnswer, **gradeQuestionDetailed** for per-question feedback), `lessonQueue.ts` (pure `advanceQueue`/`correctCount` for the wrong-→requeue flow) |
| `signDb/` | **Read-only** wrapper around `data/sign-database/sign_themed.db` (《国家通用手语词典》). | `service.ts` (listSignsByTheme, findSignsByMeaning, getSign, getMeanings, **getImageAbsolutePath**), `db.ts` (better-sqlite3 readonly singleton). Used by seed and the image route only. |
| `progress/` | `Attempt/LessonClear/DailyStat`, streak + XP + leaves on User | `service.ts` (**onLessonClear**, **onReviewClear**, getUserProgress, getWeeklyLeaders), `streak.ts` (computeStreak pure fn), `dailyQuest.ts` (computeDailyQuest pure + claimDailyQuestIfEligible wrapper) |
| `badges/` | `Badge/UserBadge` | `defs.ts` (5 badges), `rules.ts` (evaluateBadgeRules pure fn), `service.ts` (awardBadges, getUserBadges). **UI currently hidden** but logic still grants silently. |
| `social/` | `Friendship` | `service.ts` (canonical-pair friendships), `challenge.ts` (PK star comparison) |
| `teams/` | `Team/TeamMember/TeamInvite/TeamBonusEvent` | `service.ts` (createTeam/inviteByFriendCode/respondInvite/leaveTeam/listMyTeams/getTeam), `bonus.ts` (teamBonusBps + computeBonusXp pure fns + settleTeamBonusesForUser wrapper) |
| `env.ts` | zod-validated env vars | call `env()` to get `{DATABASE_URL, JWT_SECRET, NODE_ENV}` |
| `logger.ts` | pino instance | use `logger.error({ err }, '...')` in routes |

Cross-domain hook chain (intentional — all triggered inside `progress.onLessonClear`/`onReviewClear`): `dailyQuest.claimDailyQuestIfEligible` → (if just-crossed) `teams.settleTeamBonusesForUser` → `bumpStreakOnClear` → `badges.awardBadges`. Think twice before adding a new cross-domain call here; if you do, also extend `ClearLessonResult` zod and CompletionScreen UI to surface the result.

### Shared zod schemas (`*.schema.ts`)

Front-end and API import the **same** zod object + inferred type. Don't redefine on either side.

- `lib/auth/auth.schema.ts` — `RegisterInput`, `LoginInput`
- `lib/curriculum/learn.schema.ts` — `ClearLessonInput`, `ClearReviewInput`, `ClearLessonResult`
- `lib/social/friends.schema.ts` — `AddFriendInput`
- `lib/teams/team.schema.ts` — `CreateTeamInput`, `InviteByCodeInput`, `RespondInviteInput`

### Extension hooks (the meaningful ones)

- **`progress.onLessonClear({userId, lessonId, graded, totalInLesson})`** — the central post-clear hook. Currently writes Attempts → LessonClear → DailyStat (xp + leaves) → daily-quest claim (if ≥100 today) → team-bonus settlement (if dailyQuest just-crossed) → User XP/leaves → streak → badges. To add post-clear behavior (e.g. tier promotion, weekly settlement), append here.
- **`progress.onReviewClear({userId, graded})`** — same hook shape but no LessonClear (review isn't a formal pass), XP scaled lower (`correct*2 + 3`), reviewLeaves = correct + perfect-bonus.
- **`dailyQuest.computeDailyQuest(...)`** + **`claimDailyQuestIfEligible(...)`** — daily-XP threshold (100) bonus. Pure fn + DB wrapper. Idempotent via `DailyStat.dailyQuestClaimedAt`.
- **`teams.teamBonusBps(memberCount)`** + **`settleTeamBonusesForUser(userId, today)`** — team-bonus settlement. Idempotent via `TeamBonusEvent @@unique([teamId, date])`. Triggered only when daily quest just crossed; credits all members per their day XP × bps/10000.
- **`evaluateBadgeRules(ctx)` in `lib/badges/rules.ts`** — pure function, returns slugs to award. New badge = add definition to `defs.ts` + add one `if` to `evaluateBadgeRules`.
- **`Question.type`** discriminator — `'sign2word'` (image prompt → text choices) or `'word2sign'` (text prompt → image choices). `QuestionCard` switches rendering based on this.
- **`curriculum.getQuestionsForLesson()` always strips `answerIndex`** — answers are graded server-side via `gradeAnswer()` or `getQuestionsMapForLesson()`.

### Configuration constants

- `src/config/scoring.ts` — XP & star thresholds (`BASE_XP=10`, `PERFECT_BONUS=5`, star ratios)
- `src/config/economy.ts` — leaves & daily-quest values (`LEAVES_PER_LESSON=5`, `DAILY_QUEST_THRESHOLD=100`, bonuses)
- Team bonus basis points are inline constants in `lib/teams/bonus.ts` (2→1900, 3→2000, 4→2100)

## Sign-language database (题库后端)

The 主线 curriculum draws all sign images & meanings from a SQLite snapshot of 《国家通用手语词典（全四册）》, kept **server-side only** under `signo-web/data/sign-database/`:

- `sign_themed.db` (2.2 MB, committed) — `signs / meanings / themes` (31 themes × 7 tiers).
- `images/` (~350 MB, **gitignored**) — 6699 JPG illustrations, repopulated by `pnpm sign-db:bootstrap` (copies from sibling `../sign-language-database/`; override path via `SIGN_DB_SRC`). Bootstrap is idempotent (size+mtime skip).

App code reads only via `src/lib/signDb/service.ts` (`better-sqlite3`, readonly). Images are streamed to the client through `GET /api/signs/image/[signId]` with a 1y immutable `Cache-Control`. `Question.promptMedia.path` stores exactly that URL — the front-end never sees the raw image directory.

License: 非商用 educational/accessibility derivative; preserve attribution on any deployment.

## Lesson runtime: per-question feedback + wrong-→requeue

The lesson page is no longer a linear walk-through. Each question:

1. User picks a choice.
2. `QuestionCard` POSTs `/api/learn/grade-question` (returns `{ isCorrect, correctIndex, explanation }`). No Attempt is recorded yet.
3. UI reveals 正/误 + 正解 + 打法描述 (from `Question.explanation`, sourced from `signs.description`), and shows a "下一题" button.
4. On click: if wrong, `advanceQueue` rotates the head to the tail — the user will see the same question again later in this lesson and cannot finish until they answer it correctly.
5. When the queue empties, the page POSTs `/api/learn/clear-lesson` with the **last** answer per `questionId` (always the correct one). Server-side `gradeAnswer` confirms; `onLessonClear` runs the existing reward chain.

Consequence: **lessons always finish at correct == total**. `lessonStars` therefore returns 3 for any non-empty lesson — the "stars" no longer reflect difficulty, only completion. XP/leaves/perfect-bonus formulas are unchanged.

The `/review` page uses the same `QuestionCard` + `advanceQueue` pattern. Test-only route `GET /api/test/lesson-answers?lessonId=…` reveals `answerIndex` per question for Playwright; it 404s when `NODE_ENV=production`.

## Bottom-tab IA

Single-page-app feel via `BottomNav.tsx` (auto-hides on `/login`, `/register`):

| Tab | Routes |
|---|---|
| 主线 | `/`, `/learn/*`, `/mistakes`, `/review` |
| 知识竞赛 | `/pk`, `/pk/[lessonId]/[code]`, `/leaderboard` |
| 个人 | `/me`, `/badges`, `/friends`, `/teams`, `/teams/*`, `/profile/[code]` |

`/me` is the user's own hub; `/profile/[code]` is the public-facing version (works for self/friend/stranger/guest).

## Forest UI primitives

- **Mascots** — `<Mascot name="ant|firefly|squirrel|fox|koala|boar|deer" />`. 7 hand-drawn SVGs in `components/forest/Mascot.tsx`. `TIER_MASCOT[1..7]` maps tier → mascot. `currentColor` controls the line color.
- **Forest decoration family** (in `components/forest/`): `Leaf`, `LeafCoin` (currency icon, supports `iconOnly` and number chip), `Firefly` (CSS-pulsing dot, fixed-position in layout), `StreakFlame` (number + flame), `TierBadge`, `SketchDivider`, `Mushroom` (`variant: red|gold|cluster`), `Fern` (mirror prop), `Vine` (hangs from corner, mirror prop), `Berry` (`color: red|blue|forest`), `MossGround` (above-bottom-nav floor), `LightShaft` (diagonal warm-light beam, fixed bg, side prop).
- **`.brush-text`** class — for headings. HarmonyOS Sans 700, tight letter-spacing, `--color-ink`.
- **`.paper`** class — gives an element the noisy-paper card look (used by `<Card paper>`, default true).
- **HarmonyOS Sans SC** — loaded via jsDelivr `harmonyos-sans-sc-webfont-splitted` from `globals.css` `@import`. The font variables `--font-brush/--font-book/--font-latin` are all aliased to the same HarmonyOS stack — keeping legacy inline `font-[family-name:var(--font-book)]` references working.
- **Animations** — keyframes in `globals.css`: `firefly-pulse`, `firefly-drift`, `leaf-float`, `bloom-in`, `celebrate-leaves`, `light-pulse`, `mist-roll`. (`ant-march` is defined but no component uses it after the AntTrail removal.)

## Testing notes

- **Vitest** unit tests in `tests/unit/`, all pure functions (~60 cases across 9 files): `auth.password`, `auth.jwt`, `scoring` (lessonXp / **lessonStars=过关即 3 星** / lessonLeaves / reviewLeaves), `streak`, `badges`, `dailyQuest`, `teamBonus`, `lessonQueue` (advanceQueue/correctCount), `signDb.service` (smoke against `sign_themed.db`). The vitest config injects fake `JWT_SECRET` + `DATABASE_URL` so `env()` doesn't throw.
- **Playwright** e2e at `tests/e2e/happy-path.spec.ts` uses `data-testid` selectors (`register-submit`, `lesson-link`, `choice-N`, `answer-feedback`, `next-question`, `lesson-complete`, `xp-gain`, `leaves-gain`, `question-image`). Determinism comes from `GET /api/test/lesson-answers?lessonId=…` (test-only) — clicks `choice-${correctIndex}` on each question, never relies on a fixed answerIndex.
- The seed shuffles per-question choices using a deterministic PRNG (`SEED_SEED` env, default 42). `answerIndex` is no longer correlated with question order.

## Known placeholders

- `public/signs/*.{jpg,png}` — 12 legacy occupancy images, **no longer referenced** by any code or test. Safe to delete; left in tree only as a pre-database baseline.
- Async PK is star-based comparison only; real-time WebSocket PK is W3-deferred.
- Tier weekly settlement cron is not wired — `User.weeklyXp` accumulates but no scheduled job promotes/demotes.
- Leaves currency (`User.leaves`) has no spend mechanism yet — earned only, displayed in `/me` chip + CompletionScreen Stat. Planned: shop / cosmetic unlocks.
- Badges are awarded silently in `awardBadges` but **UI is hidden by user request** (`/me` Section, `/profile/[code]` collection block, CompletionScreen reveal — all removed). The `/badges` page route still exists; nothing links to it.

## Working on this repo

- Always `cd signo-web` first before any `pnpm` / `git`-relative paths from instructions.
- After **any** schema change: edit `prisma/schema.prisma` → `pnpm prisma migrate dev --name <verb_noun>` → `pnpm prisma generate` (**required** or TS won't compile against new fields).
- After fresh clone or after deleting `data/sign-database/images/`: run `pnpm sign-db:bootstrap` before `pnpm prisma db seed`. The seed reads `sign_themed.db` directly (lightweight) and validates that every chosen sign's image exists; missing images abort with a clear error.
- After adding a route or page that fetches DB data, never `import { prisma } from '@/lib/db'` directly in `app/` — add a service function instead. The W1 plan calls this an enforceable principle, not a guideline.
- When extending the lesson-clear flow with a new reward / event: (1) write a pure compute fn + DB wrapper following `streak.ts` / `dailyQuest.ts` pattern; (2) inject in `progress.service.ts` `onLessonClear` AND `onReviewClear`; (3) add to `ClearResult` type + `ClearLessonResult` zod; (4) surface in `CompletionScreen` (banner or Stat). Skipping any of these four leaves the feature visible only in DB.
- When extending or replacing curriculum content: edit `prisma/seed-data/{common,number,body}.ts` (or add new chapter modules + register in `prisma/seed-data/index.ts`). Each `LessonSpec.signIds` is the per-lesson distractor pool — every question's wrong choices are drawn from siblings in the same lesson, so curate the pool for "易混" semantic groups.
