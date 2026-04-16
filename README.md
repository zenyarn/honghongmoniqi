# 红红模拟器

一个基于 Next.js 16 构建的恋爱聊天模拟应用。

项目的核心玩法是模拟微信式对话场景，用户在不同关卡里通过和 AI 角色聊天来“哄好对方”。除了主玩法，项目还包含排行榜、恋爱攻略文章、用户资料页，以及一个用于查看用户和记录的后台管理界面。

## 功能概览

- AI 恋爱聊天闯关，按场景进行对话互动
- 游戏记录保存与排行榜展示
- 恋爱攻略文章列表与详情页
- 用户注册、登录和个人资料页
- 后台用户与记录管理
- 语音相关能力接口，如 ASR / TTS

## 技术栈

- Next.js 16（App Router）
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui
- 自定义 Node HTTP 服务入口

## 本地开发

本项目仅使用 `pnpm` 作为包管理器。

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm dev
```

默认会启动在：

```text
http://localhost:3000
```

构建生产版本：

```bash
pnpm build
```

启动生产服务：

```bash
pnpm start
```

生产启动默认端口为 `5000`。

## 目录结构

```text
.
├── public/
├── scripts/
│   ├── build.sh
│   ├── dev.sh
│   └── start.sh
├── src/
│   ├── app/                # 页面与 API 路由
│   ├── components/         # 业务组件与 UI 组件
│   ├── hooks/              # 自定义 hooks
│   ├── lib/                # 工具函数、数据访问、服务封装
│   └── server.ts           # 自定义服务端入口
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 主要路由

- `/`：聊天模拟主页面
- `/leaderboard`：排行榜
- `/blog`：恋爱攻略列表
- `/blog/[id]`：攻略详情
- `/login`：登录
- `/register`：注册
- `/profile`：个人资料
- `/admin`：后台首页

## 开发约定

- 默认使用 `shadcn/ui` 作为基础组件库
- 默认在 `src/` 目录下开发页面、组件和 API
- 仅允许使用 `pnpm`，不要使用 `npm` 或 `yarn`
- 注意避免 Next.js hydration 问题，不要在 JSX 首屏渲染中直接使用 `Date.now()`、`Math.random()`、`typeof window`


