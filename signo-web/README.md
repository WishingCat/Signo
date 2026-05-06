# Signo · 手语森林（W1 脚手架）

> 一个温柔安静的手语练习场——森林里的小动物用动作与姿态彼此说话。

本仓库为 W1 阶段的端到端最小可用原型：注册 → 登录 → 从课程树进入关卡 → 做完题 → 拿到 XP。

## 快速开始

环境要求：Node ≥ 20.19（已在 Node 25 验证），pnpm 10+。

```bash
cd signo-web
pnpm install

# 本地环境变量（Prisma CLI 只读 .env，Next.js 同时读 .env.local）
printf 'DATABASE_URL="file:./dev.db"\n' > .env
printf 'JWT_SECRET="dev-only-secret-change-in-prod-must-be-32-chars-long-x"\n' > .env.local

# 初始化数据库 + 生成 Prisma Client + 灌入 12 个示例题
pnpm prisma migrate dev
pnpm prisma db seed

pnpm dev
# 打开 http://localhost:3000，先去 /register 创建账号。
```

## 测试

```bash
pnpm test                           # Vitest 单测（auth / scoring）
pnpm playwright install chromium    # 首次
pnpm e2e                            # Playwright 烟测（注册→做关→拿 XP）
```

## 目录结构（关键）

```
signo-web/
├─ prisma/
│  ├─ schema.prisma          # User / Unit / Lesson / Question / Media / Attempt / LessonClear / DailyStat
│  └─ seed.ts                # 12 张临时手语图 → 3 关（上衣 / 下装 / 鞋类）
├─ prisma.config.ts          # Prisma 7 配置入口（.env 加载 + datasource.url）
├─ public/signs/             # 静态手语图，与 Media.path 对齐
├─ src/
│  ├─ app/                   # 路由 + 页面（只解析请求、调用 service、渲染）
│  │  ├─ (auth)/             # 注册 / 登录
│  │  ├─ api/                # Route Handlers（不直接访问 prisma）
│  │  └─ learn/[lessonId]/   # 答题闭环
│  ├─ components/
│  │  ├─ ui/                 # 原子：Button / Card（森林 token 化）
│  │  └─ learn/              # QuestionCard（业务组件）
│  ├─ config/scoring.ts      # XP / 星级参数集中处
│  ├─ lib/
│  │  ├─ auth/               # password / jwt / session / service / auth.schema
│  │  ├─ curriculum/         # getLessonTree / getQuestionsForLesson / scoring
│  │  ├─ progress/           # onLessonClear（W2 扩展 streak / 段位 weeklyXp）
│  │  ├─ db.ts               # Prisma 单例（better-sqlite3 driver adapter）
│  │  ├─ env.ts              # zod 校验后的环境变量
│  │  └─ logger.ts           # pino
│  └─ generated/prisma/      # Prisma Client 生成物（gitignore）
└─ tests/
   ├─ unit/                  # auth.password / auth.jwt / scoring
   └─ e2e/happy-path.spec.ts
```

## 设计语言

- 色板：米白 `--color-oat` / 苔藓绿 `--color-moss` 主色 / 榛果橙 `--color-hazel` CTA / 晨雾蓝 `--color-mist` / 赭石红 `--color-ochre` 错答 / 树皮深棕 `--color-bark` 文字
- 圆角：卡片 16px，按钮 12px；阴影柔软带轻微暖色偏移
- 字体：PingFang SC / Noto Sans SC 系统优先
- Tailwind 4 CSS-first：见 `src/app/globals.css` 的 `@theme`

## 架构原则

严格按 plan §"模块化与可扩展性原则" 实施：

1. **三层切分**：`app/`（路由/展示）→ `lib/<domain>/`（service）→ `db.ts`（Prisma 单例）。API route 不直接 import prisma，全部通过 service。
2. **共享契约**：`*.schema.ts` 导出 zod + 类型，前后端都 import 同一份。
3. **可扩展锚点**：
   - `Question.type` 分支（W1 仅 `sign2word`，W2 加 `word2sign`）
   - `config/scoring.ts`（W2 调复习关 1.2× 系数仅改配置）
   - `progress.onLessonClear`（W2 追加 streak / 段位 weeklyXp / 错题更新）
   - `curriculum.getQuestionsForLesson` 服务端隐藏 `answerIndex`（W3 PK 同源复用）

## 已知占位与后续工作

- `public/signs/*` 是 12 张临时自用占位图（来自 `../临时题目/`），**正式上线前必须替换为有拍摄 release 的正式素材**。
- Prisma 7 + pnpm 改用新 `prisma-client` generator，输出到 `src/generated/prisma/`；运行时走 `@prisma/adapter-better-sqlite3` 驱动适配器。
- 题目正确选项位置目前等于题号（Q1 = 0 / Q2 = 1 / …）便于 E2E 确定性断言；W2 引入题目随机化后需改 E2E 选择策略。
- 段位 L5 为考拉，L6 为大野猪（详见 `../docs/specs/2026-05-06-signo-mvp-design.md` §段位体系）。

## 版本

Next.js 16.2.4 · React 19 · Tailwind 4 · Prisma 7 · Vitest 4 · Playwright 1.59 · Node 25 验证。

本阶段标签：`w1-mvp-foundation`。
