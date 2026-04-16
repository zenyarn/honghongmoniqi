# Vercel 部署报错记录

本文档用于记录本项目在 Vercel 部署过程中出现过的典型报错，以及对应的原因分析与修复方式，方便后续快速排查。

## 背景结论

这次部署问题的主线比较明确：

- Vercel 构建环境没有稳定拿到 `devDependencies`
- 而 Next.js 16 + Tailwind 4 + TypeScript 在构建阶段会直接使用一部分“开发期依赖”
- 结果就是本地能跑、但 Vercel 构建时报各种 `Cannot find module ...` 或类型检查错误

因此，本项目后续在 Vercel 上部署时，要重点关注两类问题：

- 构建期依赖是否被安装
- Next.js build 阶段的 TypeScript 检查是否通过

## 报错一：Failed to transpile `next.config.ts`

### 典型报错

```text
Build error occurred
Error: Failed to transpile "next.config.ts".
[cause]: Error: Cannot find module 'typescript'
```

### 原因

- 项目当时使用的是 `next.config.ts`
- Next.js 在构建时需要先用 `typescript` 转译这个配置文件
- 但 Vercel 构建环境中没有安装 `typescript`

### 修复方式

- 将 `typescript` 移到 `dependencies`
- 同时将 `next.config.ts` 改成 `next.config.mjs`，减少对 TypeScript 配置转译的依赖

### 经验

- 如果 Vercel 安装依赖不稳定，`next.config.mjs` 通常比 `next.config.ts` 更稳

## 报错二：Cannot find module `@react-dev-inspector/babel-plugin`

### 典型报错

```text
Error evaluating Node.js code
Error: Cannot find module '@react-dev-inspector/babel-plugin'
```

### 原因

- 仓库根目录曾存在 `.babelrc`
- `.babelrc` 中启用了 `@react-dev-inspector/babel-plugin`
- 这个插件是开发调试用途，不应该进入 Vercel 生产构建链路
- 当 Vercel 没有安装对应 dev 依赖时，就会直接报错

### 修复方式

- 删除 `.babelrc`
- 移除 `src/app/layout.tsx` 中对 `react-dev-inspector` 的运行时代码引用

### 经验

- 本地调试插件不要直接挂到生产构建链路中
- 尤其是 Babel 插件、开发态 Inspector、调试面板这类能力

## 报错三：Cannot find module `@tailwindcss/postcss`

### 典型报错

```text
Error evaluating Node.js code
Error: Cannot find module '@tailwindcss/postcss'
```

### 原因

- `postcss.config.mjs` 中显式使用了 `@tailwindcss/postcss`
- Tailwind 4 在构建时一定会走到 PostCSS 配置
- 但当时 `@tailwindcss/postcss` 只放在 `devDependencies` 中

### 修复方式

- 将 `@tailwindcss/postcss` 移到 `dependencies`
- 同时将 `tailwindcss` 也移到 `dependencies`

### 经验

- 只要构建阶段会直接 `require` 或加载的包，就不能只放在 `devDependencies`，至少在当前 Vercel 配置下不行

## 报错四：缺少 `@types/react`、`@types/node`

### 典型报错

```text
It looks like you're trying to use TypeScript but do not have the required package(s) installed.
Please install @types/react and @types/node
```

### 原因

- Next.js build 在执行 TypeScript 检查
- 但构建环境没有拿到 React / Node 的类型定义包

### 修复方式

- 将 `@types/react`
- `@types/react-dom`
- `@types/node`

移到 `dependencies`

### 经验

- 在当前项目的 Vercel 构建策略下，TypeScript 类型定义包里有一部分也属于“构建必需依赖”

## 报错五：Could not find a declaration file for module `pg`

### 典型报错

```text
Type error: Could not find a declaration file for module 'pg'
```

### 原因

- `src/storage/database/neon-client.ts` 直接导入了 `pg`
- TypeScript 构建检查需要 `@types/pg`
- 但 `@types/pg` 当时还在 `devDependencies`

### 修复方式

- 将 `@types/pg` 移到 `dependencies`

### 经验

- 只要某个运行时库在服务端代码里被直接导入，它的类型包也可能在 Next build 时成为硬依赖

## 报错六：后台页面里的 `implicit any`

### 典型报错

```text
Type error: Parameter 'record' implicitly has an 'any' type.
Type error: Parameter 'item' implicitly has an 'any' type.
```

### 出现场景

- `src/app/admin/orders/page.tsx`
- `src/lib/admin/data.ts`

### 原因

- `tsconfig.json` 开启了 `strict: true`
- 部分 `map()` 回调参数没有显式类型
- 数据层返回值类型不够明确，导致局部变量被推断成 `any`

### 修复方式

- 为后台数据分页结果补充显式返回类型
- 为 `rows.map((item) => ...)`、`rows.map((record) => ...)` 里的参数补显式类型

例如：

```ts
type AdminPageResult<T> = {
  rows: T[];
  total: number;
};
```

以及：

```ts
rows.map((record: SqlRecordRow) => ({ ... }))
```

### 经验

- 数据层函数最好显式声明返回类型，不要完全依赖自动推断
- 在 `strict: true` 下，跨函数边界的类型推断很容易变松

## 报错七：`tsup` 阶段找不到 `typescript`

### 典型报错

```text
Bundling server with tsup...
Error: Cannot find module 'typescript'
```

### 原因

- `pnpm build` 在 Next.js 构建完成后，还会继续执行 `tsup src/server.ts`
- 这个步骤是给自定义 Node 服务部署准备的
- 但 Vercel 部署 Next 项目时并不需要这一步
- 同时 `tsup` 在当前 Vercel 环境里是通过临时 `npx` 环境执行的，对 `typescript` 的解析并不稳定

### 修复方式

- 将 `scripts/build.sh` 中的 `npx` 改成 `pnpm exec`
- 在 Vercel 环境下跳过 `tsup` 打包步骤

示例逻辑：

```bash
if [[ "${VERCEL:-}" == "1" ]]; then
  echo "Vercel environment detected, skipping custom server bundle."
else
  pnpm exec tsup src/server.ts ...
fi
```

### 经验

- Vercel 上部署 Next.js 应用时，不要再额外打包自定义 Node server，除非部署目标本身就是独立 Node 进程
- `npx` 在 CI / 云构建环境中容易拉起临时依赖环境，优先使用 `pnpm exec`

## 本次实际修复动作

本次已经做过的修复包括：

- 删除开发专用的 `.babelrc`
- 移除 `react-dev-inspector` 的生产代码引用
- 将以下包移到 `dependencies`
  - `typescript`
  - `tailwindcss`
  - `@tailwindcss/postcss`
  - `@types/react`
  - `@types/react-dom`
  - `@types/node`
  - `@types/pg`
- 将 Next 配置切换为 `next.config.mjs`
- 修复后台管理相关的 TypeScript `implicit any`
- 调整 `scripts/build.sh`，在 Vercel 环境下跳过 `tsup`

## 推荐排查顺序

后续如果 Vercel 再次部署失败，建议按这个顺序查：

1. 看是否为 `Cannot find module ...`
2. 如果是，先判断该模块是否在构建阶段会被直接加载
3. 若会被构建直接加载，检查它是否还留在 `devDependencies`
4. 再看是否为 TypeScript 报错
5. 如果是 TS 报错，先本地执行完整构建，而不是只跑 `tsc`

推荐本地验证命令：

```bash
rm -rf .next tsconfig.tsbuildinfo
pnpm build
```

## Vercel 配置建议

从这次问题来看，Vercel 很可能没有完整安装 `devDependencies`。建议额外检查：

- `Install Command` 是否被设置成了只安装生产依赖
- 是否存在以下环境变量

```text
NPM_CONFIG_PRODUCTION=true
PNPM_PRODUCTION=true
YARN_PRODUCTION=true
```

如果有，建议删除或改为 `false`。

## 额外建议

- `@types/bcryptjs` 可以考虑删除，`bcryptjs` 自带类型
- 如果未来继续使用 Vercel，尽量避免把“仅本地开发需要”的工具挂进生产构建流程
- 遇到构建问题时，以 `pnpm build` 为准，不要只看 `pnpm exec tsc -p tsconfig.json --noEmit`
