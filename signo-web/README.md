# Signo · 手语森林

> 一个温柔安静的手语练习场——森林里的小动物用动作与姿态彼此说话。

手语学习 Web 应用的 MVP 实现，结合 Duolingo 式答题闭环 + 森林段位/徽章游戏化 + 林友异步 PK。

---

## 快速开始

环境要求：Node ≥ 20.19（已在 Node 25 验证），pnpm 10+。

```bash
cd signo-web
pnpm install

# 本地环境变量（Prisma CLI 只读 .env，Next.js 同时读 .env.local）
printf 'DATABASE_URL="file:./dev.db"\n' > .env
printf 'JWT_SECRET="dev-only-secret-change-in-prod-must-be-32-chars-long-x"\n' > .env.local

# 数据库：建表 → 灌入课程 + 徽章
pnpm prisma migrate dev
pnpm prisma db seed

pnpm dev
# 打开 http://localhost:3000，先去 /register 创建账号。
```

## 测试

```bash
pnpm test                           # Vitest 23 个单测（auth / scoring / streak / badges）
pnpm playwright install chromium    # 首次
pnpm e2e                            # Playwright happy-path 烟测
```

## 已实现功能

### 学习闭环
- 🌱 **/** 首页：课程树（单元→关卡）+ 林友小径视觉
- 📚 **/learn/[lessonId]** 答题：拍立得风格卡片 + 4 选 1，支持 **sign2word**（看手语选词）和 **word2sign**（看词选手语）两种题型
- ✨ 完成页：3 星绽放 + 飘落叶子 + 萤火虫 + 连胜反馈 + 新徽章胶囊

### 进度 / 游戏化
- 🔥 **连胜**：同日不累加、连续天 +1、断掉重置；最长连胜独立记录
- 📊 **首页仪表盘**：今日 XP / 累计 XP / 当前连胜 三格
- 📓 **/mistakes** 错题本：按最近错误时间排序的错题，展示所在关卡与错误次数
- 🧺 **/review** 今日复习：抽取你最近 6 道错题组成复习关，XP 奖励略低于正课（避免跳过正课）
- 🏅 **/badges** 徽章馆：5 枚首批徽章（第一片叶子 / 三叶齐光 / 三日不辍 / 百叶入怀 / 拾叶者），已得/未解锁双态

### 社交 / 排行
- 🏆 **/leaderboard** 本周排行：按 weeklyXp 排序，前三名金银铜，本人高亮
- 🧑‍🤝‍🧑 **/friends** 林友：显示你的好友码 + 输入对方好友码一键添加 + 林友列表
- 👤 **/profile/[code]** 个人主页：头像段位 + 统计数据 + 徽章集 + 对 self/friend/stranger 三态按钮
- ⚔️ **/pk/[lessonId]/[friendCode]** 异步 PK：基于最近通关星级比较两人成绩（简化版，实时对战留 W3）

### 森林视觉系统
- 🎨 **设计令牌**：Tailwind 4 CSS-first `@theme` 定义 oat / cream / moss / sage / hazel / mist / ochre / bark / ink / firefly
- ✍️ **字体**：HarmonyOS Sans SC（Regular / Medium / Bold，通过 jsDelivr webfont splitted 载入，清晰易读）
- 🌿 **7 只手绘小动物**：L1 小蚂蚁 / L2 萤火虫 / L3 小松鼠 / L4 狐狸 / L5 考拉 / L6 大野猪 / L7 麋鹿神（纯 SVG，可通过 `<Mascot name="fox" />` 复用）
- 🔮 **环境氛围**：页脚爬行的蚂蚁队列、屏角常驻脉动萤火虫、水彩晕染 + SVG 纸张颗粒背景、手绘墨迹分割线
- 📄 **纸张质感**：`.paper` 类提供内阴影 + 纤维噪点的纸张卡片，`<Card tape tilt="left">` 可加胶带与倾斜

---

## 目录结构

```
signo-web/
├─ prisma/
│  ├─ schema.prisma          # 模型定义（11 个表）
│  ├─ migrations/            # 自动迁移（init → streak-totalxp → badges → friendships）
│  └─ seed.ts                # 课程 + 徽章 seed
├─ prisma.config.ts
├─ public/signs/             # 12 张临时手语图占位
├─ src/
│  ├─ app/                   # App Router 页面与 API（不直接访问 prisma）
│  │  ├─ (auth)/             # 注册 / 登录
│  │  ├─ api/
│  │  │  ├─ auth/            # register / login / logout
│  │  │  ├─ learn/           # lesson/[id] / clear-lesson / review / clear-review
│  │  │  └─ friends/add      # 加好友
│  │  ├─ badges/             # 徽章馆
│  │  ├─ friends/            # 林友列表 + 加好友
│  │  ├─ leaderboard/        # 周排行榜
│  │  ├─ learn/[lessonId]/   # 答题闭环
│  │  ├─ mistakes/           # 错题本
│  │  ├─ pk/[lessonId]/[code]/  # 异步 PK
│  │  ├─ profile/[code]/     # 公开个人主页
│  │  ├─ review/             # 今日复习
│  │  ├─ layout.tsx          # 顶栏 + 氛围层
│  │  └─ page.tsx            # 首页（仪表盘 + 快捷入口 + 课程树）
│  ├─ components/
│  │  ├─ ui/                 # Button / Card 原子（业务无关）
│  │  ├─ forest/             # Mascot / Firefly / Leaf / StreakFlame / TierBadge / AntTrail / SketchDivider
│  │  ├─ home/               # UnitClearing
│  │  ├─ learn/              # QuestionCard / CompletionScreen
│  │  └─ social/             # AddFriendForm / AddProfileButton
│  ├─ config/scoring.ts      # XP / 星级参数集中处
│  ├─ lib/
│  │  ├─ auth/               # password / jwt / session / service / auth.schema
│  │  ├─ badges/             # defs / rules / service
│  │  ├─ curriculum/         # getLessonTree / getQuestionsForLesson / getRecentMistakes / getReviewSet / scoring
│  │  ├─ progress/           # onLessonClear / onReviewClear / streak / getUserProgress / getWeeklyLeaders
│  │  ├─ social/             # friends / challenge / friends.schema
│  │  ├─ db.ts               # Prisma 单例（better-sqlite3 driver adapter）
│  │  ├─ env.ts              # zod 校验的环境变量
│  │  └─ logger.ts           # pino
│  └─ generated/prisma/      # Prisma Client 生成物（gitignore）
└─ tests/
   ├─ unit/                  # auth.password / auth.jwt / scoring / streak / badges
   └─ e2e/happy-path.spec.ts
```

---

## 架构原则（贯穿实现）

严格按 W1 plan §"模块化与可扩展性原则" 实施：

1. **三层切分**：`app/`（路由/展示）→ `lib/<domain>/`（service）→ `db.ts`（Prisma 单例）。**API route 不直接 import prisma**，全部通过 service。
2. **共享契约**：`*.schema.ts` 导出 zod + 类型，前后端 import 同一份（auth / learn / friends）。
3. **Domain 隔离**：curriculum / progress / badges / social / auth 各自独立；跨域协作在 route/orchestration 层组合。
4. **配置集中**：XP 系数、星级阈值、徽章定义分别在 `config/scoring.ts` 和 `lib/badges/defs.ts`，调参不改函数签名。
5. **扩展锚点**：
   - `Question.type` 分支（已用 sign2word / word2sign，可继续扩展）
   - `progress.onLessonClear` hook（W2 追加了 streak / XP / 徽章评估；W3 可继续追加段位结算）
   - `evaluateBadgeRules` 纯函数（新徽章 = defs + 一条 if）
   - `curriculum.getQuestionsForLesson` 隐藏 answerIndex（W3 PK 实时模式同源复用）

---

## 数据模型

11 个表，覆盖：
- 身份：`User` + 身份字段（含 `tier / totalXp / weeklyXp / currentStreak / bestStreak / lastClearDate / friendCode`）
- 课程：`Unit / Lesson / Question / Media`
- 进度：`Attempt / LessonClear / DailyStat`
- 游戏化：`Badge / UserBadge`
- 社交：`Friendship`（canonical ordered pair）

---

## 未实现 / 延后事项

以下功能需要额外素材或超出 MVP 范围，已在代码里留好接入锚点：

| 功能 | 延后原因 | 锚点 |
|---|---|---|
| 实时 WebSocket PK（标准 + 闪电） | 基础设施（WS 网关 / 会话管理） | 当前异步 PK 已实现，可演进为实时 |
| 段位周日结算 cron | 运维（cron / 调度器） | `User.weeklyXp` 已累计，`getWeeklyLeaders` 现成 |
| Lottie 段位升级动画 | 需美术资源 | 升段事件可在 `onLessonClear` 触发 |
| 正式拍摄手语素材 | 需拍摄 + 授权 | `Media.path` + `Media.license` 字段已就位 |
| Admin 后台 | 角色已入库（`User.role = admin`），页面未建 | route guard 可加中间件 |
| 昵称搜索加好友 | 现以好友码为主 | `prisma.user` 索引可扩展 |
| 生产部署 | 需域名 + 证书 + 托管方案 | Next.js 标准部署，SQLite 需改 Postgres |

其他占位说明：
- `public/signs/*` 是 12 张临时自用占位图，**正式上线前必须替换为有拍摄授权的正式素材**
- 题目正确选项位置 = 题号（Q1=0 / Q2=1 / …），E2E 可确定性断言；W3 随机化后需改 E2E 策略

---

## 版本

Next.js 16.2.4 · React 19 · Tailwind 4 · Prisma 7（better-sqlite3 driver adapter）· Vitest 4 · Playwright 1.59 · HarmonyOS Sans SC webfont · Node 25 验证。

标签：`w1-mvp-foundation`（W1 脚手架）· main 分支最新为 W2/W3 完整实现。
