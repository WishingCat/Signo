# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**手诺 · Signo** — sign language learning web app (Duolingo-style answer loop + forest tier/badges/PK gamification).

## Repo layout

```
Signo/
├── signo-web/             ← Next.js app — primary work directory, cd here for any pnpm command
├── docs/specs/            ← MVP design spec (forest 段位 system, etc.)
├── docs/superpowers/plans/ ← Multi-week implementation plans (W1 done; W2/W3 done in main)
└── 临时题目/              ← Source files for the 12 placeholder sign images (already copied to signo-web/public/signs/)
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
pnpm prisma db seed                         # reseed (clears curriculum + reupserts 5 badges)
pnpm prisma studio
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
| `curriculum/` | `Unit/Lesson/Question/Media` | `service.ts` (getLessonTree, getQuestionsForLesson, getRecentMistakes, getReviewSet, gradeAnswer) |
| `progress/` | `Attempt/LessonClear/DailyStat`, streak + XP + leaves on User | `service.ts` (**onLessonClear**, **onReviewClear**, getUserProgress, getWeeklyLeaders), `streak.ts` (computeStreak pure fn), `dailyQuest.ts` (computeDailyQuest pure + claimDailyQuestIfEligible wrapper) |
| `badges/` | `Badge/UserBadge` | `defs.ts` (5 badges), `rules.ts` (evaluateBadgeRules pure fn), `service.ts` (awardBadges, getUserBadges). **UI currently hidden** but logic still grants silently. |
| `social/` | `Friendship` | `service.ts` (canonical-pair friendships), `challenge.ts` (PK star comparison) |
| `teams/` | `Team/TeamMember/TeamInvite/TeamBonusEvent` | `service.ts` (createTeam/inviteByFriendCode/respondInvite/leaveTeam/listMyTeams/getTeam), `bonus.ts` (teamBonusBps + computeBonusXp pure fns + settleTeamBonusesForUser wrapper) |
| `env.ts` | zod-validated env vars | call `env()` to get `{DATABASE_URL, JWT_SECRET, NODE_ENV}` |
| `logger.ts` | pino instance | use `logger.error({ err }, '...')` in routes |

Cross-domain hooks (intentional): `progress.onLessonClear` calls `dailyQuest.claimDailyQuestIfEligible` → `teams.settleTeamBonusesForUser` → `badges.awardBadges`. All four writes happen inside the same hook; think twice before adding a 5th cross-domain call.

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
- **`.brush-text`** class — for headings. HarmonyOS Sans 700, tight letter-spacing, `--color-ink`.
- **`.paper`** class — gives an element the noisy-paper card look (used by `<Card paper>`, default true).
- **HarmonyOS Sans SC** — loaded via jsDelivr `harmonyos-sans-sc-webfont-splitted` from `globals.css` `@import`. The font variables `--font-brush/--font-book/--font-latin` are all aliased to the same HarmonyOS stack — keeping legacy inline `font-[family-name:var(--font-book)]` references working.
- **Animations** — keyframes in `globals.css` (`firefly-pulse`, `firefly-drift`, `ant-march`, `leaf-float`, `bloom-in`, `celebrate-leaves`).

## Testing notes

- **Vitest** unit tests in `tests/unit/`, all pure functions: `auth.password`, `auth.jwt`, `scoring`, `streak`, `badges`. The vitest config injects fake `JWT_SECRET` + `DATABASE_URL` so `env()` doesn't throw.
- **Playwright** e2e at `tests/e2e/happy-path.spec.ts` uses **`data-testid`** selectors (`register-submit`, `lesson-link`, `choice-N`, `lesson-complete`, `xp-gain`). When redesigning UI, preserve these test IDs or update the spec.
- The seed deliberately makes `answerIndex == questionOrder` so E2E can answer correctly and deterministically by clicking `choice-i` for question `i`. If you add randomization, update the E2E selection strategy.

## Known placeholders

- `public/signs/*.{jpg,png}` — 12 temporary occupancy sign images. Must be replaced with assets carrying signed performer release before any public deployment. `Media.path` and `Media.license` fields are ready to record provenance.
- Async PK is star-based comparison only; real-time WebSocket PK is W3-deferred.
- Tier weekly settlement cron is not wired — `User.weeklyXp` accumulates but no scheduled job promotes/demotes.

## Working on this repo

- Always `cd signo-web` first before any `pnpm` / `git`-relative paths from instructions.
- After **any** schema change: edit `prisma/schema.prisma` → `pnpm prisma migrate dev --name <verb_noun>` → `pnpm prisma generate` (**required** or TS won't compile against new fields).
- After adding a route or page that fetches DB data, never `import { prisma } from '@/lib/db'` directly in `app/` — add a service function instead. The W1 plan calls this an enforceable principle, not a guideline.
