# Signo — 手语版多邻国 设计文档（MVP）

## Context

中国手语学习资源稀缺，且现有产品多为词典式查询，缺乏"练习—反馈—复习"的闭环。
本项目目标是做一个 Web 端、多邻国式的中国手语学习应用，先在北大校园网内做小范围内测，验证课程内容设计和留存假设；后续视情况迁移到 App。

约束：
- 单人开发，主要靠 AI 生成代码 → 技术栈必须主流、文档充分、心智负担低
- 1 个月内上线给同学试用 → MVP 必须砍到只验证最关键假设
- 部署在校内服务器 → 无需公网备案，可走 IP/二级域名

## 范围（MVP）

**做什么：**
1. 关卡式课程（按主题/单元组织，例如"日常问候""数字 1-10"）
2. 选择题题型 ×2：
   - 看手语图/视频 → 4 选 1 选词义
   - 看汉字 → 4 选 1 选手语图/视频
3. 进度系统：单元进度条、连续打卡天数（streak）、错题本 + 每日复习关
4. 自建账号（昵称 + 密码，不要邮箱/手机短信）
5. 简单游戏化：经验值（XP）、每周排行榜、徽章 3-5 个、**森林段位**（详见"段位体系"章节）
6. **好友 PK — 实时对战**：两人同时在线，做同一套题，比谁快/谁正确率高（详见"好友 PK"章节）
7. 管理后台：上传素材、编辑题目、查看用户进度（首期最简化为 `prisma seed` 脚本批量导入 + 一个受保护的 admin 页面做关键操作）
8. **温馨森林风视觉**：整站统一手绘温柔风、仅亮色（详见"视觉设计与素材"章节）

**不做（明确推迟）：**
- 摄像头识别用户打手语
- 看视频写句子（二期）
- 间隔重复 SRS（二期）
- 异步挑战 PK（如果实时 PK 上线后还有时间再考虑）
- 移动 App
- 公网部署、备案

## 好友 PK（实时对战）

形式：两人同时在线、同一套题、同时倒计时，比谁分高。

**已确定：**
- 匹配方式：好友列表 + 邀请码/链接 双轨；好友是长期关系，邀请码是一次性临时房间
- 好友关系建立：昵称搜索（用户主键是 username 而非昵称，重名可加后缀区分）+ 6 位好友码 + PK 结束页"加好友"按钮，三种入口共用一套 `Friendship` 关系
- 玩法（MVP 提供两种）：
  - **闯关赛（1v1 标准模式）**：10 题/局，速度 + 准确率加权
    - 答对一题基础分 100；剩余思考时间每秒 +5（封顶 +50）；答错 0 分；超时按 0 分计
    - 总分 = 10 题之和；并列时按总用时短者胜
  - **限时猜词（1v1 闪电模式）**：60 秒内同一题库随机抽题，比谁答对的题多
    - 每答对 1 题 +1，答错不扣分，跳到下一题
    - 时间到结算，并列时按累计正确题数同比下答错次数少者胜
- 房间生命周期：等待 → 双方都进入并点"准备" → 同时下发题目 → 双方独立答题、看到对方进度/分数实时变化 → 结束结算
- 题目由服务端实时下发（防作弊）
- 数据/榜单：**PK 单独统计，不并入学习 XP**。`User` 增加 `pkWins / pkLosses / pkScore`（简单 ELO，初始 1000），单独的"竞技榜"展示周/月 PK 分

技术增量：
- WebSocket（Next.js 自带 Node server 起 `ws` 即可，不引入额外服务）
- 房间状态机放内存；崩溃即结束当局，不做持久化
- 数据模型新增：`Friendship`、`Match`、`MatchPlayer`、`MatchAnswer`

## 技术栈

选型原则：AI 友好、生态成熟、单文件部署友好。

- **前端**：Next.js 15（App Router）+ TypeScript + Tailwind CSS + shadcn/ui
  - 一套代码 SSR + 静态资源；shadcn 组件让 AI 生成 UI 准确率高
- **后端**：Next.js Route Handlers（同仓库，零额外服务）
- **数据库**：SQLite + Prisma ORM
  - 单文件、零运维、备份就是 cp 一个文件；几百用户量级足够
- **认证**：自建，bcrypt + JWT（httpOnly cookie），不引入 NextAuth 增加复杂度
- **媒体存储**：服务器本地磁盘 `/var/signo/media/`，nginx 直接 serve
- **部署**：Docker Compose（app + nginx），systemd 拉起；备份脚本每天 cp SQLite 到另一目录

## 架构

```
[ 浏览器 ]
    |  HTTPS（校内自签或 Let's Encrypt DNS-01）
    v
[ nginx ]  ── 静态媒体 /media/* ──> 本地磁盘
    |  反代 /api/* /app/*
    v
[ Next.js App (Node) ]
    |
    v
[ SQLite + Prisma ]
```

模块边界：
- `src/lib/auth/` — 注册、登录、会话校验
- `src/lib/curriculum/` — 单元 / 关卡 / 题目的读取（数据来自 DB，编辑通过种子脚本/admin）
- `src/lib/progress/` — XP、streak、错题、复习关、学习榜聚合
- `src/lib/league/` — 段位组分配、周末结算 cron、升降逻辑
- `src/lib/pk/` — WebSocket 房间状态机、计分、ELO 更新、好友/邀请码
- `src/app/(learn)/` — 学习器页面（关卡、答题、结算）
- `src/app/(meta)/` — 个人主页、学习榜、竞技榜、徽章、段位
- `src/app/pk/` — PK 大厅、房间页
- `src/app/admin/` — 管理后台（仅 admin 角色可见）

## 数据模型（Prisma 草图）

```
User        id, username(unique), passwordHash, nickname, friendCode(unique,6),
            avatarSeed, role, tier(default 1), pkScore(default 1000),
            pkWins, pkLosses, createdAt
Unit        id, order, title, description, iconKey
Lesson      id, unitId, order, title
Question    id, lessonId, order, type, promptText, promptMediaId?,
            choices(JSON), answerIndex, explanation?
Media       id, kind(image|video), path, durationMs?, signer?, license
Attempt     id, userId, questionId, isCorrect, answeredAt, msSpent
LessonClear id, userId, lessonId, clearedAt, stars(0-3)
DailyStat   userId, date, xp, lessonsCleared        // streak 由此聚合
Badge       id, code, title, criteria(JSON)
UserBadge   userId, badgeId, earnedAt
MistakeItem id, userId, questionId(unique per user), streakCount(default 0),
            lastWrongAt, lastReviewedAt, clearedAt?
ReviewSession id, userId, date, questionsJson, score, completedAt?
LeagueGroup id, weekStartDate, tier, indexInTier         // 周赛季组
LeagueMember groupId, userId, weeklyXp, finalRank?       // 周末结算后落 finalRank
Friendship  id, userAId, userBId, createdAt          // 双向，userAId<userBId 去重
FriendReq   id, fromUserId, toUserId, status, createdAt
Match       id, mode(standard|blitz), status, startedAt, endedAt, winnerId?
MatchPlayer matchId, userId, score, correctCount, totalMs, pkScoreDelta
MatchAnswer matchId, userId, questionId, isCorrect, msSpent
```

## 关键流程

**答题循环：** 用户进入关卡 → 拉取该 lesson 全部题目 → 客户端逐题作答（即时反馈、正确播音效、错误显示解释）→ 关卡结束写一次 `LessonClear` + 多条 `Attempt` + 累计 XP → 触发徽章判定。

**Streak：** 每日首次完成任意一关时 `DailyStat` 写入；进入 app 时前端读取当日是否已有记录决定是否提醒。跨零点用服务器时区。

**排行榜：** 每周一 0 点起到本周累计 XP，简单 SQL `GROUP BY userId` 即可，不需要专门的排行榜服务。森林段位的"周赛季排名"基于此 XP，于每周日 23:59 跑结算 cron 写入 `LeagueMember.finalRank`、调整 `User.tier`、清零下周 weeklyXp。

**错题与复习关：**
- 答错的题目自动进入用户的错题本（`MistakeItem`，记录连对次数 `streakCount` 与上次复习时间）
- 每日首次进入 app 时，若错题本中存在 `streakCount<2` 的题目 ≥5 道，则在首页推送一个"今日复习关"任务（8 题/关，从错题本中按"最久未复习+错次最多"加权抽取，不足 8 题的用相邻知识点的相似题补足）
- 复习关完成给 XP 奖励（约普通关的 1.2 倍），计入森林段位的本周 XP；不影响 streak（streak 仍由完成任意关卡触发）
- 出错题本规则：**同一题在复习关或普通关中连对 2 次** → 标记为已掌握，从错题本移出；中途答错则 `streakCount` 归零
- 个人主页提供错题本入口：可看列表、单题重做（不计入 PK / 不给 XP，仅刷新 `streakCount`）

**素材上线：** 拍摄 → 转码（ffmpeg 统一为 720p H.264 mp4 + 一张 webp 封面）→ 通过 admin 页面或 `prisma seed` 脚本入库 → 学习器按 `Media.path` 拼成 `/media/...` URL。

## 段位体系（森林与小动物）

主题：穿过森林、与一群安静的小动物相伴成长——它们彼此用动作和姿态交流，呼应"无声的视觉语言"。

**段位阶梯（7 段，由低到高）：**

| 段位 | 名称 | 形象意象 |
| ---- | ---- | -------- |
| L1 | 小蚂蚁 | 不发声却用触角持续传递信息——天生的"无声沟通"代言 |
| L2 | 萤火虫 | 第一束发出的光，能为他人照路 |
| L3 | 小松鼠 | 灵巧、爱储藏（呼应记忆/复习） |
| L4 | 狐狸 | 机敏、有自己的路 |
| L5 | 考拉 | 抱紧前路不松手——慢却持续，呼应"每日坚持"的学习节奏 |
| L6 | 大野猪 | 沉稳有力，能开辟前路 |
| L7 | 麋鹿神 | 与森林融为一体，最终段 |

**升降规则（周赛季制）：**
- 每个段位是一个"小组"，每组最多 30 人；新人按上周末位次分配新组
- 每周一 0:00 ~ 周日 23:59 累计**学习 XP**作为本周分（PK 不计入此榜）
- 周末结算：组内前 5 名升段、末 5 名降段（L1 不降、L7 不升）、中间 20 人留段
- **不加免降机制**：不打卡就掉段，规则纯粹
- 学习 XP 当周清零（用于本段位竞争）；总累计 XP 永久保留显示在个人页
- L7 麋鹿神组前 3 显示在全站荣誉墙
- 新用户从 L1 小蚂蚁起步

**段位与其他系统的关系：**
- 与 PK 完全独立：PK 走 ELO 的"竞技榜"，与森林段位互不影响
- 头像框/学习器背景随段位变化（L1 蚁穴边的草叶 → L4 林间小路 → L7 古树深处与麋鹿神剪影）
- 升段动画：上一段位小动物 → 下一段位小动物的转场（小蚂蚁仰望萤火虫亮起、萤火虫被松鼠捧在手心，等等）

**MVP 简化策略：**
- 第一周内测人数少时，所有人放一组；每组人数兜底为"≥10 才结算升降"，不足则维持原段
- 段位图标和动画用静态 SVG/Lottie 占位，不做高级 3D
- 不做"保级卡""跳段卡"等付费/特殊道具

## 视觉设计与素材

整站采用**温馨的森林风格**，由前端实施阶段统一落地（届时调用 frontend-design 技能给出像素级方案）。

**设计语言（设计宪法）：**
- **基调**：手绘温柔风。线条柔软、色块带轻微纸纹与水彩晕染感，避免锐利几何与强对比
- **色板**：仅亮色模式。主色取森林暖调
  - 背景：米白 / 燕麦色（如 `#F8F4EB`）
  - 主色：苔藓绿（如 `#6B8E5A`）
  - 强调色：榛果橙（如 `#D49A5C`），用于 CTA、连胜火苗、PK 准备灯
  - 次强调：晨雾蓝（如 `#A9C5D9`），用于信息提示、进度条
  - 危险/答错色：用偏暖的赭石红（如 `#C46A4F`），不用纯红，避免焦虑感
  - 具体色值由前端实施阶段微调，spec 仅定调性
- **字体**：系统中文字体优先（PingFang SC / Noto Sans SC），不引入花体；标题可考虑稍粗的圆体（如 Smiley Sans / 阿里妈妈方圆体），强化温柔气质
- **圆角与阴影**：组件圆角统一偏大（卡片 16px，按钮 12px）；阴影柔软、低透明度、带轻微暖色偏移
- **动效**：缓入缓出，无机械跳变；正确反馈是萤光点扩散、答错是树叶轻颤而非剧烈红晃；段位升级走"小动物形象渐变"过场（Lottie 实现）
- **背景**：每段位有专属背景插画（草丛 / 萤火夜 / 林间 / 麋鹿剪影），不超过 7 张全屏插画 + 局部点缀

**素材职责边界（重要）：**
- **由用户（你）提供**：所有手语图片与视频（教学素材）、7 个段位的小动物角色形象、段位背景插画、徽章图标、品牌 logo
- **AI/前端实施侧负责**：基于上述资产做布局、组件、交互、动效、响应式、字号/间距/色彩规范、空状态占位插画（若你未提供则用极简 SVG 兜底）
- **占位策略**：在素材未到位前，所有图片位用统一占位 SVG（带"素材待补"水印），不阻塞前端开发

**前端落地的工作切片（实施阶段 frontend-design 介入）：**
1. 设计 token：色板、字号、间距、圆角、阴影、动效曲线沉淀为 Tailwind 配置或 CSS 变量
2. shadcn/ui 组件按设计语言定制（按钮/卡片/对话框/进度条/Toast）
3. 关键页面定稿：登录注册、首页课程树、关卡答题、关卡结算、个人主页、学习榜、PK 大厅、PK 房间、PK 结算、错题本、复习关入口
4. 段位升级动画 Lottie 接入
5. **手机优先适配**：所有页面以 375–430px 宽手机为基线设计；PC 上居中限宽（建议 480px 容器 + 周边森林插画装饰），不为大屏单独设计另一套布局

## 内测部署

- 域名：`signo.<lab>.pku.edu.cn`（向实验室/院系申请二级域名最快）；过渡可直接用 IP
- HTTPS：Let's Encrypt DNS-01（校内 IP 也能签）
- 监控：先只做最简单的 — pm2/journalctl 看日志 + 每日 SQLite 备份脚本
- 用户邀请：邀请码注册（避免被搜索引擎收录后陌生人涌入）

## 内测要回答的问题

1. 课程内容能否吸引用户连续 3 天打卡（留存）
2. 单关 5-7 题的节奏对手语学习是否合适（题感）
3. 选择题作为唯一题型是否够用，何时开始让人觉得无聊（题型路线）
4. 拍摄素材的清晰度/角度是否够认（素材规范）
5. 森林段位的小动物意象是否能激发用户认同感（主题验证）
6. 实时 PK 在校园网内会被多少比例的用户尝试、是否会成为留存抓手（PK 价值）
7. "每日复习关"推送是否被用户当成负担（复习机制 UX）

## 一个月里程碑

- W1：脚手架、认证、Prisma schema（含 PK / 段位 / 错题相关表）、3 个示例关卡跑通基础答题闭环；**前端设计 token + shadcn 组件森林化定制（首屏可见整体调性）**
- W2：拍摄首批 ~50 词、入库、调通媒体管线；XP / streak / 错题本 / 每日复习关；学习榜 + 段位结算 cron；**接入用户提供的角色/段位/背景素材**
- W3：好友系统（昵称搜索 + 好友码 + PK 后互加）、WebSocket 实时 PK（标准 + 闪电两模式）、徽章、admin 后台；**段位升级 Lottie 动画**
- W4：服务器部署、HTTPS、压一轮真人测试（含 PK 双开浏览器联调）、修 bug、邀 10 人内测

## 风险与对策

- **拍摄进度卡住**：先用《国家通用手语词典》视频占位（仅校内、不外发），保证产品能跑；同时排拍摄
- **SQLite 并发**：内测百人级别完全够；若超出再迁 Postgres，Prisma 几乎零改动
- **WebSocket 在 SQLite 单机部署下的房间状态**：内存即可，不做跨进程同步；Node 进程崩溃时所有进行中房间一并结束，提示"对局异常已退款"
- **段位赛人数不足**：≥10 人才结算升降，否则维持原段位（兜底）
- **校内服务器宕机/无人维护**：Docker Compose + 每日备份；写一份 README 让任何人能 1 条命令重启
- **首期内容不足以撑一周留存**：默认目标只是"3 天打卡"，超出靠后续内容更新；而非铺过多前期内容
- **用户提供的素材（小动物 / 背景插画）延期**：前端先用统一占位 SVG（带"素材待补"水印）开发，不阻塞功能联调；素材到位后批量替换

## 验证方式（成品自检）

- 注册—登录—做一关—看到 XP 增加—第二天打开看到 streak +1
- 故意答错 3 题，错题本里能看到这 3 题；第二天首页推送"今日复习关"
- 同一题在复习关连对 2 次后从错题本消失
- 用第二个账号登录，学习榜能看到双方
- 两浏览器分别登录两账号，输入邀请码进同一房间，能完成一局 1v1 标准 PK 与一局闪电 PK
- 模拟跨周时段调整服务器时间，验证段位结算 cron 能正确升降并清零 weeklyXp
- 把服务器重启一次，数据不丢；正在进行的 PK 房间被清理且不留脏数据
- 在校园网外部访问，应被拒绝（或仅 HTTPS 可用）
