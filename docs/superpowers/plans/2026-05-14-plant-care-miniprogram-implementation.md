# 植物养护助手 微信小程序 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个基于 uni-app + 微信云开发的植物养护记录小程序，支持一人多家、养护提醒、成长记录、纪念碑、家庭协作。

**Architecture:** uni-app (Vue 3 + TypeScript) 前端 + 微信云开发（云函数 + 云数据库 + 云存储）。前端使用 Pinia 进行状态管理，云函数处理业务逻辑，云数据库存储数据。数据按 familyId 隔离，支持用户切换家庭视角。CSS 统一使用 SCSS 编写并分离为独立文件，公共数据类型集中在 `src/interface/` 中管理。

**Tech Stack:** uni-app (Vue 3 + Vite + TypeScript)、微信云开发、Pinia、SCSS、WeChat Open Data

---

## 编码规范

### 文件规范
| 规则 | 要求 |
|------|------|
| 语言 | Vue 3 + TypeScript (`<script setup lang="ts">`) |
| 样式 | SCSS 单独文件，在 `.vue` 中 `@import` 引入 |
| 页面行数 | 每个 `.vue` 不超过 500 行，超过则拆分子组件 |
| 组件粒度 | 按功能域拆分，不因行数限制导致过度碎片化 |
| 类型定义 | 所有 interface / type 放在 `src/interface/` 下 |
| 命名 | 页面/组件 PascalCase，工具函数 camelCase，类型文件 kebab-case |

### 目录规范
```
src/
├── interface/            # 所有 TypeScript 类型定义（统一导出入口）
├── pages/
│   ├── home/             # 每个页面独立文件夹
│   │   ├── index.vue     # 页面逻辑
│   │   ├── index.scss    # 页面样式（与 .vue 同目录）
│   │   └── components/   # 页面专属子组件（含 .vue + .scss 同目录）
├── components/           # 全局公共组件（含 index.vue + index.scss）
├── store/                # Pinia store（.ts）
├── utils/                # 工具函数（.ts）
└── styles/               # 仅存放全局共享样式
    ├── variables.scss    # 设计令牌
    ├── mixins.scss       # 混合宏
    └── global.scss       # 全局样式（reset、通用类）
```

### 组件拆分原则
- 页面**独立功能模块**拆为子组件，放在 `pages/xxx/components/` 下
- **跨页面复用**的组件放入 `src/components/xxx/`（含 index.vue + index.scss）
- 子组件以功能命名：`room-filter.vue`、`plant-list.vue`
- 不因行数限制导致过度碎片化，保持可读性优先

### 样式规范
- **SCSS 文件位置规则**：
  - 每个页面/组件的样式 → 与 `.vue` 文件**同目录**（如 `home/index.vue` + `home/index.scss`）
  - 全局共享样式（变量、mixin、reset）→ 放在 `src/styles/` 下
  - 不单独建 SCSS 目录来放页面样式，样式跟随页面走
- **引用方式**：每个 `.vue` 的 `<style lang="scss">` 中 `@import` 当前目录的 `.scss` 文件
- **变量引用**：通过 `@import '@/styles/variables.scss'` 引入设计令牌
- CSS 类名使用 kebab-case
- 使用 4 的倍数间距系统（8rpx / 12rpx / 16rpx / 20rpx / 24rpx / 30rpx / 40rpx）

---

## 设计系统

| 维度 | 值 |
|------|-----|
| **风格** | 清新自然、简约温和（Fresh Natural Minimalism） |
| **主色** | `$green: #07c160`（草木绿 — 按钮/主交互/强调） |
| **深绿** | `$green-deep: #1b8a3d`（标题/重要文字/选中态） |
| **嫩绿** | `$green-fresh: #4ec97a`（图标/辅助元素/装饰） |
| **浅绿底** | `$green-bg: #e8f5e9`（标签/轻背景/卡片点缀） |
| **提醒色** | `$amber: #ff9800` |
| **危险色** | `$red: #e64340` |
| **正文** | `$text-primary: #1a1a2e` |
| **次要** | `$text-secondary: #999` |
| **背景** | `$bg-page: #f6f8f6`（微绿底） |
| **卡片** | `$bg-card: #ffffff` |
| **圆角** | `$radius-sm: 8rpx`, `$radius-md: 12rpx`, `$radius-lg: 16rpx` |
| **阴影** | `$shadow-sm: 0 2rpx 8rpx rgba(7,193,96,0.08)`（绿调阴影） |

---

## 文件结构规划

> **关于路由**：微信小程序不使用 Vue Router。路由通过 `pages.json` 声明所有页面路径，使用 `uni.navigateTo()` / `uni.switchTab()` / `uni.redirectTo()` 等 API 进行页面跳转。因此项目中不需要 `router/` 目录。

```
E:/AI_project/project_my_garden/
├── src/
│   ├── api/                   # API 层 — 集中封装所有云函数调用
│   │   ├── plant.ts           # 植物相关 API
│   │   ├── family.ts          # 家庭相关 API
│   │   ├── care.ts            # 养护相关 API
│   │   ├── room.ts            # 房间相关 API
│   │   ├── event.ts           # 成长事件 API
│   │   ├── memorial.ts        # 纪念碑 API
│   │   └── index.ts           # 统一导出入口
│   ├── interface/              # TS 类型定义
│   │   ├── index.ts            # 统一导出
│   │   ├── plant.ts
│   │   ├── family.ts
│   │   ├── care.ts
│   │   └── user.ts
│   ├── pages/
│   │   ├── home/               # 首页（各页面：.vue + .scss 同目录）
│   │   │   ├── index.vue
│   │   │   ├── index.scss
│   │   │   └── components/     # 页面专属子组件
│   │   ├── plant-detail/
│   │   ├── plant-add/
│   │   ├── reminder/
│   │   ├── memorial/
│   │   ├── memorial-add/
│   │   ├── profile/
│   │   ├── family-manage/
│   │   ├── member-detail/
│   │   ├── timeline/
│   │   ├── event-add/
│   │   ├── room-manage/
│   │   └── settings/
│   ├── components/             # 全局公共组件
│   │   ├── family-switcher/
│   │   │   ├── index.vue
│   │   │   └── index.scss
│   │   ├── plant-card/
│   │   ├── reminder-item/
│   │   ├── quick-record/
│   │   └── empty-state/
│   ├── store/
│   │   ├── family.ts
│   │   └── user.ts
│   ├── styles/                 # 仅全局共享样式
│   │   ├── variables.scss      # 设计令牌（含完整绿色系统）
│   │   ├── mixins.scss         # 混合宏
│   │   └── global.scss         # 全局 reset + 通用类
│   ├── utils/
│   │   ├── cloud.ts            # 云开发底层封装
│   │   ├── date.ts             # 日期工具
│   │   └── constants.ts        # 常量
│   ├── App.vue
│   ├── main.ts
│   ├── pages.json
│   ├── manifest.json
│   └── uni.scss
├── cloudfunctions/             # 云函数（JS）
│   ├── login/index.js
│   ├── family/index.js
│   ├── plant/index.js
│   ├── room/index.js
│   ├── care/index.js
│   ├── event/index.js
│   └── memorial/index.js
├── project.config.json
├── .eslintrc.cjs
├── .prettierrc.cjs
├── .eslintignore
├── .prettierignore
├── tsconfig.json
├── package.json
└── vite.config.ts
```

---

## Phase 1: 项目初始化与基础建设

### Task 1: 创建 uni-app + TypeScript 项目并接入微信云开发

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/manifest.json`
- Create: `src/pages.json`
- Create: `src/styles/variables.scss`
- Create: `src/styles/global.scss`
- Create: `src/uni.scss`
- Create: `project.config.json`
- Create: `src/utils/cloud.ts`
- Create: `src/env.d.ts`

- [ ] **Step 1: 初始化项目**

```bash
npm init -y
npm install vue@3 pinia
npm install -D @dcloudio/uni-app @dcloudio/uni-cli-shared @dcloudio/vite-plugin-uni typescript sass
# ESLint + Prettier（基础规范，非严格）
npm install -D eslint @eslint/js prettier eslint-config-prettier eslint-plugin-vue @vue/eslint-config-typescript
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "node",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["esnext", "dom"],
    "types": ["@dcloudio/types"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "src/env.d.ts"]
}
```

- [ ] **Step 3a: 创建 ESLint 配置（基础非严格）**

创建 `.eslintrc.cjs`：

```cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'vue'],
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript',
    'prettier', // prettier 必须在最后以覆盖规则
  ],
  rules: {
    // ===== 基础规则（宽松） =====
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-unused-vars': 'off', // 由 @typescript-eslint 接管
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off', // 允许 any

    // ===== Vue 规则（宽松） =====
    'vue/multi-word-component-names': 'off', // 允许单文件名
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-self-closing': 'off',
    'vue/require-default-prop': 'off',
  },
};
```

- [ ] **Step 3b: 创建 Prettier 配置**

创建 `.prettierrc.cjs`：

```cjs
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  endOfLine: 'lf',
  arrowParens: 'always',
};
```

- [ ] **Step 3c: 创建 ESLint + Prettier 忽略文件**

创建 `.eslintignore`：
```
node_modules
dist
cloudfunctions
*.min.js
```

创建 `.prettierignore`：
```
node_modules
dist
cloudfunctions
*.min.js
package.json
```

- [ ] **Step 3d: 创建 src/env.d.ts**

```ts
/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```ts
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'path';

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

- [ ] **Step 5: 创建 src/main.ts**

```ts
import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  app.use(createPinia());
  return { app };
}
```

- [ ] **Step 5a: 更新 package.json scripts**

```json
{
  "scripts": {
    "dev": "uni-app",
    "build": "uni-app build",
    "lint": "eslint src --ext .ts,.vue --fix",
    "format": "prettier --write src/**/*.{ts,vue,scss}",
    "typecheck": "vue-tsc --noEmit"
  }
}
```

- [ ] **Step 6: 创建 src/styles/variables.scss（设计令牌）**

```scss
// ===== 绿色系统（清新自然） =====
$green: #07c160;          // 草木绿 — 主色，按钮/交互
$green-deep: #1b8a3d;     // 深绿 — 标题/重要文字/选中态
$green-fresh: #4ec97a;    // 嫩绿 — 图标/装饰/辅助元素
$green-bg: #e8f5e9;       // 浅绿底 — 标签/卡片背景
$green-pale: #f0faf3;     // 极浅绿 — 页面点缀背景

// ===== 功能色 =====
$amber: #ff9800;          // 提醒/警告
$red: #e64340;            // 危险/错误
$blue: #1989fa;           // 链接/信息

// ===== 文字 =====
$text-primary: #1a1a2e;   // 主要文字
$text-secondary: #8c8c8c; // 次要文字
$text-hint: #bfbfbf;      // 提示文字
$text-white: #ffffff;
$text-link: $green;

// ===== 背景 =====
$bg-page: #f6f8f6;        // 页面背景（微绿）
$bg-card: #ffffff;        // 卡片背景
$bg-tag: #f0f0f0;         // 标签背景
$bg-overlay: rgba(0, 0, 0, 0.5);

// ===== 边框 =====
$border-color: #e8e8e8;
$border-light: #f0f0f0;

// ===== 圆角 =====
$radius-sm: 8rpx;
$radius-md: 12rpx;
$radius-lg: 16rpx;
$radius-round: 30rpx;
$radius-circle: 50%;

// ===== 间距 =====
$spacing-xs: 8rpx;
$spacing-sm: 12rpx;
$spacing-md: 16rpx;
$spacing-lg: 20rpx;
$spacing-xl: 24rpx;
$spacing-2xl: 30rpx;
$spacing-3xl: 40rpx;

// ===== 阴影 =====
$shadow-sm: 0 2rpx 8rpx rgba(7, 193, 96, 0.08); // 绿调阴影
$shadow-md: 0 4rpx 16rpx rgba(7, 193, 96, 0.1);
$shadow-lg: 0 8rpx 24rpx rgba(7, 193, 96, 0.12);

// ===== 字体大小 =====
$font-xs: 22rpx;
$font-sm: 24rpx;
$font-md: 26rpx;
$font-base: 28rpx;
$font-lg: 30rpx;
$font-xl: 32rpx;
$font-2xl: 36rpx;
$font-3xl: 40rpx;

// ===== 布局 =====
$tab-bar-height: 100rpx;
$fab-size: 100rpx;
```

- [ ] **Step 7: 创建 src/styles/global.scss**

```scss
@import './variables.scss';

page {
  background-color: $bg-page;
  font-size: $font-base;
  color: $text-primary;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  box-sizing: border-box;
}

view,
text,
scroll-view {
  box-sizing: border-box;
}

button {
  border-radius: $radius-md;
  font-size: $font-base;
}

// 通用卡片样式
.card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
}

// 通用按钮
.btn-primary {
  background: $green;
  color: $text-white;
  border: none;
  border-radius: $radius-round;
  padding: $spacing-md $spacing-2xl;
  font-size: $font-base;
  
  &[disabled] {
    opacity: 0.5;
  }
}

// 通用空状态
.empty-state {
  text-align: center;
  padding: 200rpx 0;
  color: $text-secondary;
  
  .sub {
    display: block;
    font-size: $font-sm;
    margin-top: $spacing-sm;
  }
}

// 浮动按钮
.fab {
  position: fixed;
  bottom: 160rpx;
  right: $spacing-2xl;
  width: $fab-size;
  height: $fab-size;
  border-radius: $radius-circle;
  background: $green;
  color: $text-white;
  font-size: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-lg;
  z-index: 100;
}
```

- [ ] **Step 8: 创建 src/uni.scss**

```scss
/* uni-app 全局变量入口 */
@import '@/styles/variables.scss';
@import '@/styles/global.scss';
```

- [ ] **Step 9: 创建 src/utils/cloud.ts（TS 版）**

```ts
interface CloudResult<T = any> {
  code: number;
  data?: T;
  msg?: string;
  [key: string]: any;
}

const cloud = uni.cloud as any;
cloud.init({
  env: 'your-env-id',
  traceUser: true,
});

export function callFunction<T = any>(name: string, data?: Record<string, any>): Promise<CloudResult<T>> {
  return new Promise((resolve, reject) => {
    cloud.callFunction({
      name,
      data: data || {},
      success: (res: any) => resolve(res.result as CloudResult<T>),
      fail: (err: any) => reject(err),
    });
  });
}

export { cloud };
```

- [ ] **Step 10: 创建 src/utils/constants.ts**

```ts
// ===== 植物状态 =====
export type PlantStatus = 'healthy' | 'warning' | 'critical' | 'dead' | 'given';

export const PLANT_STATUS_LABEL: Record<PlantStatus, string> = {
  healthy: '健康', warning: '需关注', critical: '病危',
  dead: '已故', given: '已赠出',
};

// ===== 养护操作类型 =====
export type CareType = 'water' | 'fertilize' | 'prune' | 'repot' | 'pesticide' | 'clean';

export const CARE_TYPES: CareType[] = ['water', 'fertilize', 'prune', 'repot', 'pesticide', 'clean'];

export const CARE_TYPE_LABEL: Record<CareType, string> = {
  water: '浇水', fertilize: '施肥', prune: '修剪',
  repot: '换盆', pesticide: '杀虫', clean: '清洁',
};

export const CARE_TYPE_ICON: Record<CareType, string> = {
  water: '', fertilize: '', prune: '✂️',
  repot: '', pesticide: '', clean: '',
};

// ===== 成长事件类型 =====
export type EventType = 'repot' | 'prune' | 'pest' | 'bloom' | 'propagate' | 'other';

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  repot: '换盆', prune: '修剪', pest: '长虫',
  bloom: '开花', propagate: '繁殖', other: '其他',
};

// ===== 家庭成员角色 =====
export type MemberRole = 'admin' | 'member';

// ===== 纪念碑类型 =====
export type MemorialType = 'dead' | 'given';

// ===== 预置房间 =====
export const DEFAULT_ROOMS = ['客厅', '阳台', '卧室', '书房', '厨房', '卫生间'];

// ===== 延后提醒选项 =====
export interface DelayOption {
  label: string;
  getTime: () => number;
}

export const DELAY_OPTIONS: DelayOption[] = [
  { label: '1小时后', getTime: () => Date.now() + 3600000 },
  { label: '今晚 18:00', getTime: () => { const d = new Date(); d.setHours(18, 0, 0, 0); return d.getTime(); } },
  { label: '明天', getTime: () => Date.now() + 86400000 },
  { label: '后天', getTime: () => Date.now() + 172800000 },
  { label: '一周后', getTime: () => Date.now() + 604800000 },
  { label: '一个月后', getTime: () => Date.now() + 2592000000 },
  { label: '两个月后', getTime: () => Date.now() + 5184000000 },
];

// ===== 默认养护间隔 =====
export const DEFAULT_CARE_INTERVALS: Record<CareType, number> = {
  water: 7, fertilize: 30, prune: 60, pesticide: 90, clean: 14,
};
```

- [ ] **Step 11: 创建 src/utils/date.ts**

```ts
export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} ${h}:${min}`;
}

export function daysAgo(date: Date | string | number): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export function isToday(date: Date | string | number): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}
```

- [ ] **Step 12: 创建 src/App.vue**

```vue
<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';

onLaunch(() => {
  const userStore = useUserStore();
  userStore.checkLogin();
});
</script>

<style lang="scss">
@import '@/styles/global.scss';
</style>
```

- [ ] **Step 5: 创建 src/pages.json**

```json
{
  "pages": [
    {"path": "pages/index/index", "style": {"navigationBarTitleText": "我的植物"}},
    {"path": "pages/plant-detail/index", "style": {"navigationBarTitleText": "植物详情"}},
    {"path": "pages/plant-add/index", "style": {"navigationBarTitleText": "添加植物"}},
    {"path": "pages/reminder/index", "style": {"navigationBarTitleText": "养护提醒"}},
    {"path": "pages/memorial/index", "style": {"navigationBarTitleText": "纪念碑"}},
    {"path": "pages/memorial-add/index", "style": {"navigationBarTitleText": "移入纪念碑"}},
    {"path": "pages/profile/index", "style": {"navigationBarTitleText": "我的"}},
    {"path": "pages/family-manage/index", "style": {"navigationBarTitleText": "家庭管理"}},
    {"path": "pages/member-detail/index", "style": {"navigationBarTitleText": "操作记录"}},
    {"path": "pages/timeline/index", "style": {"navigationBarTitleText": "成长记录"}},
    {"path": "pages/event-add/index", "style": {"navigationBarTitleText": "添加成长事件"}},
    {"path": "pages/room-manage/index", "style": {"navigationBarTitleText": "房间管理"}},
    {"path": "pages/settings/index", "style": {"navigationBarTitleText": "设置"}}
  ],
  "tabBar": {
    "color": "#999",
    "selectedColor": "#07c160",
    "backgroundColor": "#fff",
    "list": [
      {"pagePath": "pages/index/index", "text": "首页", "iconPath": "static/tab/home.png", "selectedIconPath": "static/tab/home-active.png"},
      {"pagePath": "pages/reminder/index", "text": "提醒", "iconPath": "static/tab/reminder.png", "selectedIconPath": "static/tab/reminder-active.png"},
      {"pagePath": "pages/memorial/index", "text": "纪念", "iconPath": "static/tab/memorial.png", "selectedIconPath": "static/tab/memorial-active.png"},
      {"pagePath": "pages/profile/index", "text": "我的", "iconPath": "static/tab/profile.png", "selectedIconPath": "static/tab/profile-active.png"}
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarBackgroundColor": "#fff",
    "backgroundColor": "#f5f5f5"
  }
}
```

- [ ] **Step 6: 创建 src/manifest.json**

```json
{
  "name": "植物养护助手",
  "appid": "__UNI__XXXXXXX",
  "description": "家庭植物养护记录",
  "versionName": "1.0.0",
  "versionCode": "100",
  "mp-weixin": {
    "appid": "你的微信小程序AppID",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "postcss": true
    },
    "usingComponents": true,
    "cloud": true
  }
}
```

- [ ] **Step 7: 创建 project.config.json**

```json
{
  "description": "植物养护助手",
  "packOptions": {"ignore": []},
  "setting": {
    "urlCheck": false,
    "es6": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.3.4",
  "appid": "你的微信小程序AppID",
  "projectname": "plant-care",
  "cloudfunctionRoot": "cloudfunctions/",
  "condition": {}
}
```

- [ ] **Step 8: 创建 src/utils/cloud.ts**

```js
import { cloud } from '@dcloudio/uni-app';

cloud.init({
  env: 'your-env-id', // 替换为你的云环境ID
  traceUser: true,
});

export function callFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    cloud.callFunction({
      name,
      data,
      success: (res) => resolve(res.result),
      fail: (err) => reject(err),
    });
  });
}

export { cloud };
```

- [ ] **Step 9: 创建 src/utils/constants.js**

```js
// 植物状态
export const PLANT_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  DEAD: 'dead',
  GIVEN: 'given',
};

export const PLANT_STATUS_LABEL = {
  [PLANT_STATUS.HEALTHY]: '健康',
  [PLANT_STATUS.WARNING]: '需关注',
  [PLANT_STATUS.CRITICAL]: '病危',
  [PLANT_STATUS.DEAD]: '已故',
  [PLANT_STATUS.GIVEN]: '已赠出',
};

// 养护操作类型
export const CARE_TYPES = ['water', 'fertilize', 'prune', 'repot', 'pesticide', 'clean'];
export const CARE_TYPE_LABEL = {
  water: '浇水', fertilize: '施肥', prune: '修剪',
  repot: '换盆', pesticide: '杀虫', clean: '清洁',
};
export const CARE_TYPE_ICON = {
  water: '', fertilize: '', prune: '✂️',
  repot: '', pesticide: '', clean: '',
};

// 成长事件类型
export const EVENT_TYPES = ['repot', 'prune', 'pest', 'bloom', 'propagate', 'other'];
export const EVENT_TYPE_LABEL = {
  repot: '换盆', prune: '修剪', pest: '长虫',
  bloom: '开花', propagate: '繁殖', other: '其他',
};
export const EVENT_TYPE_ICON = {
  repot: '', prune: '✂️', pest: '',
  bloom: '', propagate: '', other: '',
};

// 纪念碑类型
export const MEMORIAL_TYPES = { DEAD: 'dead', GIVEN: 'given' };

// 家庭成员角色
export const MEMBER_ROLES = { ADMIN: 'admin', MEMBER: 'member' };

// 预置房间
export const DEFAULT_ROOMS = ['客厅', '阳台', '卧室', '书房', '厨房', '卫生间'];

// 延后提醒选项
export const DELAY_OPTIONS = [
  { label: '1小时后', getTime: () => Date.now() + 3600000 },
  { label: '今晚 18:00', getTime: () => { const d = new Date(); d.setHours(18, 0, 0, 0); return d.getTime(); } },
  { label: '明天', getTime: () => Date.now() + 86400000 },
  { label: '后天', getTime: () => Date.now() + 172800000 },
  { label: '一周后', getTime: () => Date.now() + 604800000 },
  { label: '一个月后', getTime: () => Date.now() + 2592000000 },
  { label: '两个月后', getTime: () => Date.now() + 5184000000 },
];

// 默认养护间隔
export const DEFAULT_CARE_INTERVALS = {
  water: 7, fertilize: 30, prune: 60, pesticide: 90, clean: 14,
};
```

- [ ] **Step 10: 创建 src/utils/date.js**

```js
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return formatDate(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function daysAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / 86400000);
}

export function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

export function isOverdue(date) {
  return new Date(date) < new Date();
}
```

- [ ] **Step 11: 初始化云开发环境**

在微信开发者工具中：
```bash
# 1. 在 cloudfunctions 目录右键 → 创建云开发环境
# 2. 获取环境 ID 更新 src/utils/cloud.ts 中的 env
# 3. 创建后运行：
cd cloudfunctions
npm init -y
```

---

### Task 1b: 创建 TypeScript 接口定义（所有公共类型）

**Files:**
- Create: `src/interface/user.ts`
- Create: `src/interface/plant.ts`
- Create: `src/interface/family.ts`
- Create: `src/interface/care.ts`
- Create: `src/interface/index.ts`

- [ ] **Step 1: 创建 src/interface/user.ts**

```ts
export interface UserInfo {
  _id?: string;
  _openid?: string;
  nickName: string;
  avatarUrl: string;
  lastLogin?: Date;
}

export interface LoginResult {
  code: number;
  data: UserInfo;
  msg?: string;
}
```

- [ ] **Step 2: 创建 src/interface/plant.ts**

```ts
import type { PlantStatus } from '@/utils/constants';

export interface IPlant {
  _id: string;
  name: string;
  nickname?: string;
  species?: string;
  roomId: string;
  familyId: string;
  photo?: string;
  purchaseDate?: string;
  status: PlantStatus;
  note?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  recentRecords?: ICareRecord[];
}

export interface ICreatePlantData {
  name: string;
  species?: string;
  nickname?: string;
  photo?: string;
  roomId: string;
  purchaseDate?: string;
  note?: string;
  careConfigs?: { type: string; intervalDays: number }[];
}

export interface IRoom {
  _id: string;
  name: string;
  familyId: string;
  sortOrder: number;
  isDefault: boolean;
}
```

- [ ] **Step 3: 创建 src/interface/family.ts**

```ts
import type { MemberRole } from '@/utils/constants';

export interface IFamily {
  _id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  role?: MemberRole;
  createdAt: Date;
}

export interface IFamilyMember {
  _id: string;
  familyId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
  userInfo?: { nickName: string; avatarUrl: string };
}

export interface IRecentOp {
  _id: string;
  plantId: string;
  type: string;
  recordedBy: string;
  createdAt: Date;
  userInfo?: { nickName: string; avatarUrl: string };
  plants?: string[];
}
```

- [ ] **Step 4: 创建 src/interface/care.ts**

```ts
import type { CareType, EventType, MemorialType } from '@/utils/constants';

export interface ICareConfig {
  _id: string;
  plantId: string;
  familyId: string;
  type: CareType;
  intervalDays: number;
  lastTime: Date | null;
  nextTime: Date;
  enabled: boolean;
  createdBy: string;
}

export interface ICareRecord {
  _id: string;
  plantId: string;
  familyId: string;
  type: CareType;
  recordedBy: string;
  note?: string;
  createdAt: Date;
  userName?: string;
}

export interface IReminder {
  plantId: string;
  plantName: string;
  type: CareType;
  nextTime: Date;
  lastTime: Date | null;
  intervalDays: number;
  configId: string;
  isDelayed?: boolean;
}

export interface IGrowthEvent {
  _id: string;
  plantId: string;
  familyId: string;
  type: EventType;
  description?: string;
  photos?: string[];
  eventDate: Date;
  createdBy: string;
  createdAt: Date;
}

export interface IMemorial {
  _id: string;
  plantId: string;
  plantName: string;
  plantPhoto?: string;
  familyId: string;
  type: MemorialType;
  deathDate: Date;
  reason?: string;
  farewell?: string;
  recipient?: string;
  memorialPhotos?: string[];
  createdBy: string;
  createdAt: Date;
}

export interface ICreateMemorialData {
  type: MemorialType;
  deathDate: string;
  reason?: string;
  farewell?: string;
  recipient?: string;
  memorialPhotos?: string[];
}

export interface IDelayedReminder {
  _id: string;
  plantId: string;
  familyId: string;
  type: CareType;
  remindAt: Date;
  createdBy: string;
}
```

- [ ] **Step 5: 创建 src/interface/index.ts（统一导出）**

```ts
export * from './user';
export * from './plant';
export * from './family';
export * from './care';
```

---

> **后续任务规范提醒：**
> - 所有 `.vue` 文件使用 `<script setup lang="ts">`，样式 `<style lang="scss">`
> - **样式文件位置**：每个页面/组件的 `.scss` 与 `.vue` 同目录（如 `home/index.vue` + `home/index.scss`）
> - **样式引用方式**：在 `.vue` 的 `<style lang="scss">` 中 `@import` 同目录 `.scss` 文件，再在 `.scss` 中 `@import '@/styles/variables.scss'` 引用设计令牌
> - 页面代码控制在 500 行以内，超出的功能抽为子组件放在 `pages/xxx/components/` 下
> - 全局复用的公共组件放在 `src/components/xxx/`（含 index.vue + index.scss）
> - 只有全局共享的样式（变量、mixin、reset）放在 `src/styles/` 下
> - 所有 API 返回值推荐使用 `interface` 中定义的类型进行泛型标注

> **关于下方示例代码的说明：** 下列任务中的 Vue 组件代码采用 `.js` + 内联 `<style>` 格式以保持简洁。实际实现时，请按上述规范转换为 `.ts` + 独立 SCSS 文件 + `<script setup lang="ts">` 模式。

---

### Task 1c: 创建 API 层（集中管理所有云函数调用）

**Files:**
- Create: `src/api/plant.ts`
- Create: `src/api/family.ts`
- Create: `src/api/care.ts`
- Create: `src/api/room.ts`
- Create: `src/api/event.ts`
- Create: `src/api/memorial.ts`
- Create: `src/api/index.ts`

每个 API 模块封装对应领域的所有云函数调用，提供带类型标注的方法。页面/组件只调用 API 层，不直接调 `callFunction`。

- [ ] **Step 1: 创建 src/api/index.ts**

```ts
export * from './plant';
export * from './family';
export * from './care';
export * from './room';
export * from './event';
export * from './memorial';
```

- [ ] **Step 2: 创建 src/api/plant.ts**

```ts
import { callFunction } from '@/utils/cloud';
import type { IPlant, IRoom, ICreatePlantData } from '@/interface';

export function getPlantList(familyId: string, roomId?: string) {
  return callFunction<IPlant[]>('plant', { action: 'list', familyId, roomId });
}

export function getPlantDetail(plantId: string) {
  return callFunction<IPlant>('plant', { action: 'get', plantId });
}

export function createPlant(familyId: string, data: ICreatePlantData) {
  return callFunction<{ _id: string }>('plant', { action: 'create', familyId, data });
}

export function updatePlant(plantId: string, data: Partial<ICreatePlantData>) {
  return callFunction('plant', { action: 'update', plantId, data });
}

export function deletePlant(plantId: string) {
  return callFunction('plant', { action: 'delete', plantId });
}

export function getRoomList(familyId: string) {
  return callFunction<IRoom[]>('room', { action: 'list', familyId });
}

export function createRoom(familyId: string, name: string) {
  return callFunction<IRoom>('room', { action: 'create', familyId, name });
}

export function renameRoom(roomId: string, name: string) {
  return callFunction('room', { action: 'rename', roomId, name });
}

export function deleteRoom(roomId: string) {
  return callFunction('room', { action: 'delete', roomId });
}
```

- [ ] **Step 3: 创建 src/api/family.ts**

```ts
import { callFunction } from '@/utils/cloud';
import type { IFamily, IFamilyMember, IRecentOp } from '@/interface';

export function getFamilyList() {
  return callFunction<IFamily[]>('family', { action: 'list' });
}

export function createFamily(name: string) {
  return callFunction<IFamily>('family', { action: 'create', name });
}

export function joinFamily(inviteCode: string) {
  return callFunction<IFamily>('family', { action: 'join', inviteCode });
}

export function getFamilyMembers(familyId: string) {
  return callFunction<IFamilyMember[]>('family', { action: 'members', familyId });
}

export function getRecentOps(familyId: string) {
  return callFunction<IRecentOp[]>('family', { action: 'recentOps', familyId });
}

export function getMemberOps(familyId: string, memberId: string) {
  return callFunction<IRecentOp[]>('family', { action: 'memberOps', familyId, memberId });
}
```

- [ ] **Step 4: 创建 src/api/care.ts**

```ts
import { callFunction } from '@/utils/cloud';
import type { ICareConfig, ICareRecord, IReminder, CareType } from '@/interface';

export function getConfigs(plantId: string) {
  return callFunction<ICareConfig[]>('care', { action: 'getConfigs', plantId });
}

export function toggleConfig(configId: string, enabled: boolean) {
  return callFunction('care', { action: 'toggleConfig', configId, enabled });
}

export function updateInterval(configId: string, intervalDays: number) {
  return callFunction('care', { action: 'updateInterval', configId, intervalDays });
}

export function recordCare(plantId: string, familyId: string, type: CareType, note?: string) {
  return callFunction('care', { action: 'record', plantId, familyId, type, note });
}

export function getRecords(plantId: string, limit = 10) {
  return callFunction<ICareRecord[]>('care', { action: 'records', plantId, limit });
}

export function getReminders(familyId: string, roomId?: string | null, days = 7) {
  return callFunction<IReminder[]>('care', { action: 'reminders', familyId, roomId, days });
}

export function delayReminder(plantId: string, familyId: string, type: CareType, remindAt: string) {
  return callFunction('delayed_reminders', { action: 'create', plantId, familyId, type, remindAt });
}
```

- [ ] **Step 5: 创建 src/api/event.ts**

```ts
import { callFunction } from '@/utils/cloud';
import type { IGrowthEvent, EventType } from '@/interface';

export function getEventList(plantId: string) {
  return callFunction<IGrowthEvent[]>('event', { action: 'list', plantId });
}

export function createEvent(
  plantId: string,
  familyId: string,
  data: { type: EventType; eventDate: string; description?: string; photos?: string[] },
) {
  return callFunction('event', { action: 'create', plantId, familyId, data });
}
```

- [ ] **Step 6: 创建 src/api/memorial.ts**

```ts
import { callFunction } from '@/utils/cloud';
import type { IMemorial, ICreateMemorialData } from '@/interface';

export function getMemorialList(familyId: string) {
  return callFunction<IMemorial[]>('memorial', { action: 'list', familyId });
}

export function createMemorial(plantId: string, familyId: string, data: ICreateMemorialData) {
  return callFunction('memorial', { action: 'create', plantId, familyId, data });
}
```

---

## Phase 2: 用户登录与家庭系统

### Task 2: 微信登录云函数

**Files:**
- Create: `cloudfunctions/login/index.js`
- Create: `src/store/user.ts`

- [ ] **Step 1: 创建 login 云函数**

```js
// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const usersCollection = db.collection('users');

exports.main = async (event, context) => {
  const { wxContext } = cloud.getWXContext();
  const { nickName, avatarUrl } = event;
  const openId = wxContext.OPENID;

  const existing = await usersCollection.where({ _openid: openId }).get();
  if (existing.data.length > 0) {
    await usersCollection.doc(existing.data[0]._id).update({
      data: { nickName, avatarUrl, lastLogin: db.serverDate() },
    });
    return { code: 0, data: { ...existing.data[0], nickName, avatarUrl } };
  }

  const result = await usersCollection.add({
    data: {
      _openid: openId,
      nickName,
      avatarUrl,
      createdAt: db.serverDate(),
      lastLogin: db.serverDate(),
    },
  });
  return {
    code: 0,
    data: { _id: result._id, _openid: openId, nickName, avatarUrl },
  };
};
```

- [ ] **Step 2: 创建 src/store/user.ts**

```ts
import { defineStore } from 'pinia';
import { callFunction } from '@/utils/cloud';
import type { UserInfo } from '@/interface';

interface UserState {
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  ready: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userInfo: null,
    isLoggedIn: false,
    ready: false,
  }),
  actions: {
    async checkLogin() {
      try {
        const { result } = await uni.cloud.callFunction({ name: 'login', data: {} });
        if (result && result.code === 0) {
          this.userInfo = result.data as UserInfo;
          this.isLoggedIn = true;
        }
      } catch (e) { /* not logged in */ }
      this.ready = true;
    },
    async login(nickName: string, avatarUrl: string) {
      const res = await callFunction<UserInfo>('login', { nickName, avatarUrl });
      if (res.code === 0) {
        this.userInfo = res.data;
        this.isLoggedIn = true;
      }
      return res;
    },
  },
});
```

- [ ] **Step 3: 创建登录拦截页（App.vue 补充）**

在 `src/App.vue` 的 `onLaunch` 中补充登录跳转逻辑：

```vue
<script setup>
import { onLaunch, getUserProfile } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';

onLaunch(() => {
  const userStore = useUserStore();
  userStore.checkLogin();
});

// 全局登录方法 (供各页面调用)
export function handleLogin() {
  const userStore = useUserStore();
  uni.getUserProfile({
    desc: '用于展示用户信息',
    success: (res) => {
      userStore.login(res.userInfo.nickName, res.userInfo.avatarUrl);
    },
    fail: () => {
      uni.showToast({ title: '需要授权才能使用', icon: 'none' });
    },
  });
}
</script>
```

- [ ] **Step 4: 更新 App.vue 条件渲染登录/主界面**

在 `App.vue` 的 `<template>` 中：

```vue
<script setup>
import { ref, computed } from 'vue';
import { onLaunch } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const appReady = ref(false);

onLaunch(async () => {
  await userStore.checkLogin();
  appReady.value = true;
});
</script>

<template>
  <view v-if="!appReady" class="loading-page">
    <text>加载中...</text>
  </view>
</template>
```

---

### Task 3: 家庭系统（创建/加入/成员管理）

**Files:**
- Create: `cloudfunctions/family/index.js`
- Create: `src/store/family.ts`
- Create: `src/components/family-switcher.vue`

- [ ] **Step 1: 创建 family 云函数**

```js
// cloudfunctions/family/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, familyId, name, inviteCode, memberId, role } = event;

  // 创建家庭
  if (action === 'create') {
    const code = generateInviteCode();
    const res = await db.collection('families').add({
      data: { name, inviteCode: code, createdBy: OPENID, createdAt: db.serverDate() },
    });
    await db.collection('family_members').add({
      data: { familyId: res._id, userId: OPENID, role: 'admin', joinedAt: db.serverDate() },
    });
    return { code: 0, data: { _id: res._id, name, inviteCode: code } };
  }

  // 通过邀请码加入
  if (action === 'join') {
    const family = await db.collection('families').where({ inviteCode }).get();
    if (family.data.length === 0) return { code: 1, msg: '邀请码无效' };

    const fid = family.data[0]._id;
    const existing = await db.collection('family_members')
      .where({ familyId: fid, userId: OPENID }).get();
    if (existing.data.length > 0) return { code: 2, msg: '已在家庭中' };

    await db.collection('family_members').add({
      data: { familyId: fid, userId: OPENID, role: 'member', joinedAt: db.serverDate() },
    });
    return { code: 0, data: family.data[0] };
  }

  // 获取用户所有家庭
  if (action === 'list') {
    const members = await db.collection('family_members').where({ userId: OPENID }).get();
    if (members.data.length === 0) return { code: 0, data: [] };

    const familyIds = members.data.map(m => m.familyId);
    const families = await db.collection('families').where({ _id: _.in(familyIds) }).get();

    const result = families.data.map(f => ({
      ...f,
      role: members.data.find(m => m.familyId === f._id)?.role,
    }));
    return { code: 0, data: result };
  }

  // 获取家庭成员
  if (action === 'members') {
    const members = await db.collection('family_members').where({ familyId }).get();
    const userIds = members.data.map(m => m.userId);
    const users = await db.collection('users').where({ _openid: _.in(userIds) }).get();

    return {
      code: 0,
      data: members.data.map(m => ({
        ...m,
        userInfo: users.data.find(u => u._openid === m.userId),
      })),
    };
  }

  // 获取家庭操作记录
  if (action === 'recentOps') {
    const records = await db.collection('care_records')
      .where({ familyId })
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const userIds = [...new Set(records.data.map(r => r.recordedBy))];
    const users = await db.collection('users').where({ _openid: _.in(userIds) }).get();

    return {
      code: 0,
      data: records.data.map(r => ({
        ...r,
        userInfo: users.data.find(u => u._openid === r.recordedBy),
      })),
    };
  }

  // 获取家庭成员的操作详情（按操作类型分组）
  if (action === 'memberOps') {
    const records = await db.collection('care_records')
      .where({ familyId, recordedBy: memberId })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const plantIds = [...new Set(records.data.map(r => r.plantId))];
    const plants = await db.collection('plants').where({ _id: _.in(plantIds) }).get();

    // 按 createdAt 分组合并同一次操作
    const groups = {};
    records.data.forEach(r => {
      const key = r.createdAt;
      if (!groups[key]) groups[key] = { ...r, plants: [] };
      const plant = plants.data.find(p => p._id === r.plantId);
      if (plant) groups[key].plants.push(plant.name);
    });

    return { code: 0, data: Object.values(groups) };
  }

  return { code: -1, msg: 'unknown action' };
};
```

- [ ] **Step 2: 创建 src/store/family.ts**

```js
import { defineStore } from 'pinia';
import { callFunction } from '@/utils/cloud';

export const useFamilyStore = defineStore('family', {
  state: () => ({
    families: [],
    currentFamilyId: '',
    currentFamilyName: '',
    members: [],
  }),
  getters: {
    currentFamily: (state) => state.families.find(f => f._id === state.currentFamilyId) || null,
  },
  actions: {
    async loadFamilies() {
      const res = await callFunction('family', { action: 'list' });
      if (res.code === 0) {
        this.families = res.data;
        if (!this.currentFamilyId && res.data.length > 0) {
          this.setCurrentFamily(res.data[0]._id, res.data[0].name);
        }
      }
    },
    setCurrentFamily(id, name) {
      this.currentFamilyId = id;
      this.currentFamilyName = name;
      uni.setStorageSync('currentFamilyId', id);
      uni.setStorageSync('currentFamilyName', name);
    },
    async createFamily(name) {
      const res = await callFunction('family', { action: 'create', name });
      if (res.code === 0) {
        await this.loadFamilies();
        this.setCurrentFamily(res.data._id, res.data.name);
      }
      return res;
    },
    async joinFamily(inviteCode) {
      const res = await callFunction('family', { action: 'join', inviteCode });
      if (res.code === 0) await this.loadFamilies();
      return res;
    },
    async loadMembers(familyId) {
      const res = await callFunction('family', { action: 'members', familyId });
      if (res.code === 0) this.members = res.data;
    },
  },
});
```

- [ ] **Step 3: 创建 src/components/family-switcher.vue**

```vue
<template>
  <view class="family-switcher" @tap="showPicker = true">
    <text class="family-name">{{ familyStore.currentFamilyName || '选择家庭' }}</text>
    <text class="arrow">▼</text>

    <uni-popup ref="popup" type="bottom">
      <view class="picker-list">
        <view
          v-for="f in familyStore.families"
          :key="f._id"
          class="picker-item"
          :class="{ active: f._id === familyStore.currentFamilyId }"
          @tap="switchFamily(f._id, f.name)"
        >
          <text>{{ f.name }}</text>
          <text v-if="f._id === familyStore.currentFamilyId" class="check">✓</text>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { useFamilyStore } from '@/store/family';

const familyStore = useFamilyStore();
const showPicker = ref(false);

function switchFamily(id, name) {
  familyStore.setCurrentFamily(id, name);
  showPicker.value = false;
  // 刷新当前页面数据
  uni.$emit('familyChanged');
}
</script>

<style scoped>
.family-switcher {
  display: flex; align-items: center; padding: 20rpx;
  background: #fff; border-bottom: 1rpx solid #eee;
}
.family-name { font-size: 32rpx; font-weight: bold; }
.arrow { font-size: 20rpx; margin-left: 10rpx; color: #999; }
.picker-list { background: #fff; padding: 30rpx; border-radius: 20rpx 20rpx 0 0; }
.picker-item {
  padding: 24rpx 0; font-size: 30rpx;
  display: flex; justify-content: space-between;
  border-bottom: 1rpx solid #f0f0f0;
}
.picker-item.active { color: #07c160; }
.check { color: #07c160; }
</style>
```

---

## Phase 3: 植物管理与房间管理

### Task 4: 房间管理

**Files:**
- Create: `cloudfunctions/room/index.js`
- Create: `src/pages/room-manage/index.vue`

- [ ] **Step 1: 创建 room 云函数**

```js
// cloudfunctions/room/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, familyId, roomId, name, sortOrder } = event;

  if (action === 'list') {
    const res = await db.collection('rooms')
      .where({ familyId }).orderBy('sortOrder', 'asc').get();
    return { code: 0, data: res.data };
  }

  if (action === 'create') {
    const res = await db.collection('rooms').add({
      data: { name, familyId, sortOrder, isDefault: false, createdAt: db.serverDate() },
    });
    return { code: 0, data: { _id: res.id, name } };
  }

  if (action === 'rename') {
    await db.collection('rooms').doc(roomId).update({ data: { name } });
    return { code: 0 };
  }

  if (action === 'delete') {
    await db.collection('rooms').doc(roomId).remove();
    // 将该房间的植物移至未分类
    await db.collection('plants').where({ roomId }).update({
      data: { roomId: '' },
    });
    return { code: 0 };
  }

  return { code: -1, msg: 'unknown action' };
};
```

- [ ] **Step 2: 创建 src/pages/room-manage/index.vue**

```vue
<template>
  <view class="page">
    <view class="room-list">
      <view v-for="room in rooms" :key="room._id" class="room-item">
        <text>{{ room.name }}</text>
        <view class="actions">
          <text class="btn" @tap="editRoom(room)">重命名</text>
          <text v-if="!room.isDefault" class="btn danger" @tap="deleteRoom(room)">删除</text>
        </view>
      </view>
    </view>
    <button class="add-btn" @tap="showAdd = true">+ 添加房间</button>
  </view>
</template>

<script setup>
import { ref, onShow } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';

const familyStore = useFamilyStore();
const rooms = ref([]);

async function loadRooms() {
  const res = await callFunction('room', {
    action: 'list', familyId: familyStore.currentFamilyId,
  });
  if (res.code === 0) rooms.value = res.data;
}

function editRoom(room) {
  uni.showModal({
    title: '重命名',
    content: room.name,
    success: async ({ confirm, content }) => {
      if (confirm && content) {
        await callFunction('room', { action: 'rename', roomId: room._id, name: content });
        await loadRooms();
      }
    },
  });
}

function deleteRoom(room) {
  uni.showModal({
    title: '确认删除',
    content: `删除房间「${room.name}」，该房间的植物将移至未分类`,
    success: async ({ confirm }) => {
      if (confirm) {
        await callFunction('room', { action: 'delete', roomId: room._id });
        await loadRooms();
      }
    },
  });
}

onShow(() => loadRooms());
</script>

<style scoped>
.page { padding: 20rpx; }
.room-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 30rpx; background: #fff; border-radius: 12rpx; margin-bottom: 16rpx;
}
.actions .btn { margin-left: 20rpx; color: #07c160; font-size: 26rpx; }
.actions .danger { color: #e64340; }
.add-btn { margin-top: 30rpx; background: #fff; color: #07c160; border: 2rpx dashed #07c160; }
</style>
```

### Task 5: 植物 CRUD

**Files:**
- Create: `cloudfunctions/plant/index.js`
- Create: `src/pages/plant-add/index.vue`
- Create: `src/components/plant-card.vue`
- Modify: `src/pages/index/index.vue`（首页）

- [ ] **Step 1: 创建 plant 云函数**

```js
// cloudfunctions/plant/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, familyId, plantId, data } = event;

  if (action === 'list') {
    const { roomId } = event;
    const query = { familyId };
    if (roomId) query.roomId = roomId;
    // 默认不显示已故/已赠出
    query.status = _.in(['healthy', 'warning', 'critical']);

    const res = await db.collection('plants').where(query).get();
    // 查询每个植物的最近养护记录
    const plants = res.data;
    const plantIds = plants.map(p => p._id);
    const records = await db.collection('care_records')
      .where({ plantId: _.in(plantIds), familyId })
      .orderBy('createdAt', 'desc')
      .get();

    const result = plants.map(p => ({
      ...p,
      recentRecords: records.data.filter(r => r.plantId === p._id).slice(0, 3),
    }));
    return { code: 0, data: result };
  }

  if (action === 'get') {
    const res = await db.collection('plants').doc(plantId).get();
    return { code: 0, data: res.data };
  }

  if (action === 'create') {
    const res = await db.collection('plants').add({
      data: {
        ...data,
        familyId,
        createdBy: OPENID,
        status: 'healthy',
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
      },
    });
    // 如果设置了养护周期，同步创建 care_configs
    if (data.careConfigs && data.careConfigs.length > 0) {
      const configs = data.careConfigs.map(c => ({
        plantId: res._id, familyId, type: c.type,
        intervalDays: c.intervalDays,
        lastTime: null, nextTime: db.serverDate(),
        enabled: true, createdBy: OPENID,
      }));
      await Promise.all(configs.map(c => db.collection('care_configs').add({ data: c })));
    }
    return { code: 0, data: { _id: res._id } };
  }

  if (action === 'update') {
    await db.collection('plants').doc(plantId).update({
      data: { ...data, updatedAt: db.serverDate() },
    });
    return { code: 0 };
  }

  if (action === 'delete') {
    await db.collection('plants').doc(plantId).remove();
    // 级联删除相关数据
    await db.collection('care_configs').where({ plantId }).remove();
    await db.collection('care_records').where({ plantId }).remove();
    await db.collection('growth_events').where({ plantId }).remove();
    await db.collection('delayed_reminders').where({ plantId }).remove();
    return { code: 0 };
  }

  return { code: -1, msg: 'unknown action' };
};
```

- [ ] **Step 2: 创建 src/components/plant-card.vue**

```vue
<template>
  <view class="plant-card" @tap="$emit('tap', plant)">
    <image v-if="plant.photo" :src="plant.photo" class="thumb" />
    <view v-else class="thumb placeholder"></view>
    <view class="info">
      <view class="name-row">
        <text class="name">{{ plant.nickname || plant.name }}</text>
        <text class="status-tag" :class="plant.status">{{ statusLabel }}</text>
      </view>
      <text class="species">{{ plant.species || '' }}</text>
      <text class="water-info" v-if="waterDays !== null">
         {{ waterDays === 0 ? '今天浇过' : `${waterDays}天前` }}
      </text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { PLANT_STATUS_LABEL } from '@/utils/constants';

const props = defineProps({ plant: Object });
defineEmits(['tap']);

const statusLabel = computed(() => PLANT_STATUS_LABEL[props.plant.status] || '');

const waterDays = computed(() => {
  const record = props.plant.recentRecords?.find(r => r.type === 'water');
  if (!record) return null;
  const diff = Math.floor((Date.now() - new Date(record.createdAt).getTime()) / 86400000);
  return diff;
});
</script>

<style scoped>
.plant-card {
  display: flex; padding: 20rpx; background: #fff;
  border-radius: 16rpx; margin-bottom: 16rpx;
}
.thumb { width: 120rpx; height: 120rpx; border-radius: 12rpx; margin-right: 20rpx; }
.placeholder { display: flex; align-items: center; justify-content: center; background: #f0f0f0; }
.info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.name-row { display: flex; align-items: center; }
.name { font-size: 30rpx; font-weight: bold; }
.status-tag { font-size: 22rpx; padding: 2rpx 12rpx; border-radius: 20rpx; margin-left: 12rpx; }
.status-tag.healthy { background: #e8f5e9; color: #2e7d32; }
.status-tag.warning { background: #fff3e0; color: #e65100; }
.status-tag.critical { background: #fce4ec; color: #c62828; }
.species { font-size: 24rpx; color: #999; margin-top: 4rpx; }
.water-info { font-size: 24rpx; color: #666; margin-top: 6rpx; }
</style>
```

- [ ] **Step 3: 创建 src/pages/index/index.vue（首页）**

```vue
<template>
  <view class="page">
    <family-switcher />

    <view class="filter-bar">
      <picker @change="onRoomChange" :value="roomIndex" :range="roomOptions">
        <text class="filter-text">{{ roomOptions[roomIndex] || '全部房间' }} ▼</text>
      </picker>
    </view>

    <view v-if="groupedPlants.length === 0" class="empty">
      <text>还没有植物</text>
      <text class="sub">点击 + 添加第一棵吧</text>
    </view>

    <view v-for="group in groupedPlants" :key="group.room" class="room-group">
      <text class="room-title">{{ group.room }}</text>
      <plant-card v-for="p in group.plants" :key="p._id" :plant="p" @tap="goDetail(p._id)" />
    </view>

    <view class="bottom-bar">
      <text>{{ plantCount }}盆植物</text>
      <text class="divider">|</text>
      <text>今日需浇 {{ needWaterCount }}盆</text>
    </view>

    <view class="fab" @tap="goAdd">+</view>
  </view>
</template>

<script setup>
import { ref, computed, onShow, onMounted } from 'vue';
import { useFamilyStore } from '@/store/family';
import { callFunction } from '@/utils/cloud';
import FamilySwitcher from '@/components/family-switcher.vue';
import PlantCard from '@/components/plant-card.vue';
import { DEFAULT_ROOMS } from '@/utils/constants';

const familyStore = useFamilyStore();
const plants = ref([]);
const rooms = ref([]);
const roomIndex = ref(0);

const roomOptions = computed(() => ['全部房间', ...rooms.value.map(r => r.name)]);

const groupedPlants = computed(() => {
  if (roomIndex.value === 0) {
    const groups = {};
    plants.value.forEach(p => {
      const room = rooms.value.find(r => r._id === p.roomId)?.name || '未分类';
      if (!groups[room]) groups[room] = { room, plants: [] };
      groups[room].plants.push(p);
    });
    return Object.values(groups);
  }
  const selectedRoom = rooms.value[roomIndex.value - 1];
  return [{ room: selectedRoom?.name || '', plants: plants.value.filter(p => p.roomId === selectedRoom?._id) }];
});

const plantCount = computed(() => plants.value.length);
const needWaterCount = computed(() => {
  // 简单判断：最近一次浇水超过间隔天数的植物数
  return plants.value.filter(p => {
    const water = p.recentRecords?.find(r => r.type === 'water');
    if (!water) return true;
    const days = Math.floor((Date.now() - new Date(water.createdAt).getTime()) / 86400000);
    return days >= 7; // 默认7天
  }).length;
});

async function loadData() {
  if (!familyStore.currentFamilyId) return;
  const [plantRes, roomRes] = await Promise.all([
    callFunction('plant', { action: 'list', familyId: familyStore.currentFamilyId }),
    callFunction('room', { action: 'list', familyId: familyStore.currentFamilyId }),
  ]);
  if (plantRes.code === 0) plants.value = plantRes.data;
  if (roomRes.code === 0) rooms.value = roomRes.data;
}

function onRoomChange(e) { roomIndex.value = e.detail.value; }
function goDetail(id) { uni.navigateTo({ url: `/pages/plant-detail/index?id=${id}` }); }
function goAdd() { uni.navigateTo({ url: '/pages/plant-add/index' }); }

onShow(() => loadData());
onMounted(() => {
  uni.$on('familyChanged', loadData);
});
</script>

<style scoped>
.page { padding-bottom: 100rpx; }
.filter-bar { padding: 16rpx 20rpx; background: #fff; border-bottom: 1rpx solid #eee; }
.filter-text { font-size: 28rpx; color: #333; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
.empty .sub { display: block; font-size: 26rpx; margin-top: 10rpx; }
.room-group { padding: 20rpx; }
.room-title { font-size: 28rpx; font-weight: bold; margin-bottom: 12rpx; display: block; }
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; justify-content: center; align-items: center;
  padding: 16rpx; background: #fff; border-top: 1rpx solid #eee;
  font-size: 24rpx; color: #666;
}
.divider { margin: 0 20rpx; }
.fab {
  position: fixed; bottom: 100rpx; right: 30rpx;
  width: 100rpx; height: 100rpx; border-radius: 50%;
  background: #07c160; color: #fff; font-size: 50rpx;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.2);
}
</style>
```

- [ ] **Step 4: 创建 src/pages/plant-add/index.vue**

```vue
<template>
  <view class="page">
    <view class="form">
      <view class="photo-upload" @tap="chooseImage">
        <image v-if="form.photo" :src="form.photo" class="preview" />
        <text v-else class="placeholder">+ 添加照片</text>
      </view>

      <view class="field">
        <text class="label">名称 *</text>
        <input v-model="form.name" placeholder="植物名称" />
      </view>
      <view class="field">
        <text class="label">品种</text>
        <input v-model="form.species" placeholder="如：龟背竹" />
      </view>
      <view class="field">
        <text class="label">昵称</text>
        <input v-model="form.nickname" placeholder="给植物起个名字" />
      </view>
      <view class="field">
        <text class="label">房间</text>
        <picker @change="onRoomChange" :range="rooms.map(r => r.name)">
          <text>{{ form.roomName || '选择房间' }}</text>
        </picker>
      </view>
      <view class="field">
        <text class="label">购入日期</text>
        <picker mode="date" @change="onDateChange">
          <text>{{ form.purchaseDate || '选择日期' }}</text>
        </picker>
      </view>

      <view class="section-title">养护周期（选填，可后续修改）</view>
      <view v-for="ct in careTypes" :key="ct.value" class="care-config">
        <text class="label">{{ ct.label }}：每</text>
        <input v-model.number="form.careConfigs[ct.value]" type="number" class="num-input" />
        <text>天</text>
      </view>

      <view class="field">
        <text class="label">备注</text>
        <textarea v-model="form.note" placeholder="选填" />
      </view>
    </view>

    <button class="submit-btn" @tap="submit">保存</button>
  </view>
</template>

<script setup>
import { ref, onShow, reactive } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { DEFAULT_CARE_INTERVALS } from '@/utils/constants';

const familyStore = useFamilyStore();
const rooms = ref([]);

const careTypes = [
  { value: 'water', label: ' 浇水' },
  { value: 'fertilize', label: ' 施肥' },
  { value: 'prune', label: '✂️ 修剪' },
  { value: 'pesticide', label: ' 杀虫' },
];

const form = reactive({
  name: '', species: '', nickname: '', photo: '',
  roomId: '', roomName: '', purchaseDate: '', note: '',
  careConfigs: { ...DEFAULT_CARE_INTERVALS },
});

async function chooseImage() {
  const res = await uni.chooseImage({ count: 1 });
  const filePath = res.tempFilePaths[0];
  const cloudRes = await uni.cloud.uploadFile({
    cloudPath: `plants/${Date.now()}.jpg`,
    filePath,
  });
  form.photo = cloudRes.fileID;
}

function onRoomChange(e) {
  const room = rooms.value[e.detail.value];
  form.roomId = room._id;
  form.roomName = room.name;
}

function onDateChange(e) { form.purchaseDate = e.detail.value; }

async function submit() {
  if (!form.name) { uni.showToast({ title: '请输入植物名称', icon: 'none' }); return; }
  if (!form.roomId) { uni.showToast({ title: '请选择房间', icon: 'none' }); return; }

  const configs = Object.entries(form.careConfigs).map(([type, interval]) => ({
    type, intervalDays: interval,
  }));

  await callFunction('plant', {
    action: 'create',
    familyId: familyStore.currentFamilyId,
    data: {
      name: form.name, species: form.species, nickname: form.nickname,
      photo: form.photo, roomId: form.roomId, purchaseDate: form.purchaseDate,
      note: form.note, careConfigs: configs,
    },
  });

  uni.showToast({ title: '添加成功' });
  setTimeout(() => uni.navigateBack(), 1500);
}

onShow(async () => {
  const res = await callFunction('room', { action: 'list', familyId: familyStore.currentFamilyId });
  if (res.code === 0) rooms.value = res.data;
});
</script>

<style scoped>
.form { padding: 20rpx; background: #fff; }
.photo-upload { width: 200rpx; height: 200rpx; margin: 20rpx auto; }
.photo-upload .placeholder {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%; border: 2rpx dashed #ddd;
  border-radius: 16rpx; color: #999; font-size: 26rpx;
}
.photo-upload .preview { width: 100%; height: 100%; border-radius: 16rpx; }
.field { display: flex; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.field .label { width: 140rpx; font-size: 28rpx; color: #333; }
.field input, .field textarea { flex: 1; font-size: 28rpx; }
.section-title { font-size: 28rpx; font-weight: bold; padding: 20rpx 0; color: #333; }
.care-config { display: flex; align-items: center; padding: 12rpx 0; }
.care-config .num-input { width: 80rpx; text-align: center; border: 1rpx solid #ddd; border-radius: 8rpx; margin: 0 10rpx; }
.submit-btn { margin: 40rpx 20rpx; background: #07c160; color: #fff; }
</style>
```

### Task 6: 植物详情页

**Files:**
- Create: `src/pages/plant-detail/index.vue`

- [ ] **Step 1: 创建植物详情页**

```vue
<template>
  <view class="page">
    <!-- 植物信息 -->
    <view class="header">
      <image v-if="plant.photo" :src="plant.photo" class="cover" />
      <view class="info">
        <text class="name">{{ plant.nickname || plant.name }}</text>
        <text class="species">{{ plant.species }}</text>
        <text class="room"> {{ roomName }}</text>
        <text class="date"> 购入：{{ plant.purchaseDate || '未知' }}</text>
      </view>
    </view>

    <!-- 养护周期 -->
    <view class="section">
      <text class="section-title">养护周期</text>
      <view v-for="cfg in configs" :key="cfg._id" class="config-item">
        <view class="config-header">
          <text>{{ cfg.type | careIcon }} {{ cfg.type | careLabel }}</text>
          <switch :checked="cfg.enabled" @change="toggleConfig(cfg._id, $event)" />
        </view>
        <view class="config-detail">
          每 <picker mode="selector" :range="intervalRange" @change="changeInterval(cfg._id, $event)">
            <text>{{ cfg.intervalDays }}天</text>
          </picker>
        </view>
        <text class="last-time">
          上次：{{ cfg.lastTime ? formatDate(cfg.lastTime) : '暂无' }}
        </text>
      </view>
    </view>

    <!-- 最近养护 -->
    <view class="section">
      <text class="section-title">
        最近养护
        <text class="more" @tap="showAllRecords">全部记录 →</text>
      </text>
      <view v-for="r in recentRecords" :key="r._id" class="record-item">
        <text>{{ r.type | careIcon }} {{ r.type | careLabel }}</text>
        <text class="time">{{ formatDateTime(r.createdAt) }}</text>
        <text class="who">{{ r.userName || '' }}</text>
      </view>
      <view v-if="recentRecords.length === 0" class="empty">暂无养护记录</view>
    </view>

    <!-- 成长记录 -->
    <view class="section">
      <text class="section-title">
        成长记录
        <text class="more" @tap="goTimeline">查看完整时间线 →</text>
      </text>
      <view v-for="e in recentEvents" :key="e._id" class="event-item">
        <image v-if="e.photos?.length" :src="e.photos[0]" class="event-thumb" />
        <view class="event-info">
          <text>{{ e.type | eventLabel }}</text>
          <text class="date">{{ formatDate(e.eventDate) }}</text>
        </view>
      </view>
      <view v-if="recentEvents.length === 0" class="empty">暂无成长记录</view>
    </view>

    <!-- 操作区 -->
    <view class="actions">
      <button class="btn" @tap="goEdit">编辑</button>
      <button class="btn danger" @tap="moveToMemorial">移入纪念碑</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onLoad, computed } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { formatDate, formatDateTime } from '@/utils/date';

const familyStore = useFamilyStore();
const plantId = ref('');
const plant = ref({});
const configs = ref([]);
const rooms = ref([]);
const recentRecords = ref([]);
const recentEvents = ref([]);

const roomName = computed(() => {
  const room = rooms.value.find(r => r._id === plant.value.roomId);
  return room?.name || '未分类';
});

const intervalRange = [];
for (let i = 1; i <= 90; i++) intervalRange.push(i);

async function loadData() {
  const [plantRes, configRes, recordRes, eventRes, roomRes] = await Promise.all([
    callFunction('plant', { action: 'get', plantId: plantId.value }),
    callFunction('care', { action: 'getConfigs', plantId: plantId.value }),
    callFunction('care', { action: 'records', plantId: plantId.value, limit: 3 }),
    callFunction('event', { action: 'list', plantId: plantId.value, limit: 4 }),
    callFunction('room', { action: 'list', familyId: familyStore.currentFamilyId }),
  ]);
  if (plantRes.code === 0) plant.value = plantRes.data;
  if (configRes.code === 0) configs.value = configRes.data;
  if (recordRes.code === 0) recentRecords.value = recordRes.data;
  if (eventRes.code === 0) recentEvents.value = eventRes.data;
  if (roomRes.code === 0) rooms.value = roomRes.data;
}

function toggleConfig(configId, e) {
  callFunction('care', { action: 'toggleConfig', configId, enabled: e.detail.value });
}

function changeInterval(configId, e) {
  const days = intervalRange[e.detail.value];
  callFunction('care', { action: 'updateInterval', configId, intervalDays: days });
}

function goTimeline() { uni.navigateTo({ url: `/pages/timeline/index?plantId=${plantId.value}` }); }
function goEdit() { /* 复用 plant-add 页面 */ }
function moveToMemorial() {
  uni.navigateTo({ url: `/pages/memorial-add/index?plantId=${plantId.value}` });
}

onLoad((opt) => { plantId.value = opt.id; loadData(); });
</script>

<style scoped>
.header { display: flex; padding: 30rpx; background: #fff; }
.cover { width: 240rpx; height: 240rpx; border-radius: 16rpx; }
.info { margin-left: 30rpx; display: flex; flex-direction: column; justify-content: center; }
.name { font-size: 36rpx; font-weight: bold; }
.species { font-size: 26rpx; color: #666; margin-top: 8rpx; }
.room, .date { font-size: 24rpx; color: #999; margin-top: 4rpx; }
.section { background: #fff; margin-top: 16rpx; padding: 30rpx; }
.section-title { font-size: 30rpx; font-weight: bold; display: block; }
.more { font-size: 26rpx; color: #07c160; float: right; font-weight: normal; }
.config-item { padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.config-header { display: flex; justify-content: space-between; align-items: center; }
.config-detail { font-size: 26rpx; color: #666; margin-top: 8rpx; }
.last-time { font-size: 24rpx; color: #999; }
.record-item, .event-item { display: flex; align-items: center; padding: 16rpx 0; }
.time, .date { font-size: 24rpx; color: #999; margin-left: 20rpx; }
.who { font-size: 24rpx; color: #999; margin-left: auto; }
.event-thumb { width: 80rpx; height: 80rpx; border-radius: 8rpx; margin-right: 16rpx; }
.event-info { display: flex; flex-direction: column; }
.empty { padding: 20rpx; text-align: center; color: #999; font-size: 26rpx; }
.actions { padding: 40rpx 30rpx; }
.actions .btn { margin-bottom: 20rpx; }
.actions .danger { background: #fce4ec; color: #c62828; border: none; }
</style>
```

---

## Phase 4: 养护提醒

### Task 7: 养护记录与提醒云函数

**Files:**
- Create: `cloudfunctions/care/index.js`

- [ ] **Step 1: 创建 care 云函数**

```js
// cloudfunctions/care/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, plantId, familyId, type, configId, enabled, intervalDays, recordId, limit = 10 } = event;

  // 获取养护配置
  if (action === 'getConfigs') {
    const res = await db.collection('care_configs').where({ plantId }).get();
    return { code: 0, data: res.data };
  }

  // 开启/关闭提醒
  if (action === 'toggleConfig') {
    await db.collection('care_configs').doc(configId).update({ data: { enabled } });
    return { code: 0 };
  }

  // 修改间隔
  if (action === 'updateInterval') {
    await db.collection('care_configs').doc(configId).update({
      data: { intervalDays, nextTime: db.serverDate() },
    });
    return { code: 0 };
  }

  // 记录养护操作
  if (action === 'record') {
    await db.collection('care_records').add({
      data: {
        plantId, familyId, type, recordedBy: OPENID,
        note: event.note || '', createdAt: db.serverDate(),
      },
    });
    // 更新 care_config 的 lastTime 和 nextTime
    const config = await db.collection('care_configs')
      .where({ plantId, type, enabled: true }).get();
    if (config.data.length > 0) {
      const cfg = config.data[0];
      const now = new Date();
      const nextTime = new Date(now.getTime() + cfg.intervalDays * 86400000);
      await db.collection('care_configs').doc(cfg._id).update({
        data: { lastTime: now, nextTime },
      });
    }
    // 删除对应的延迟提醒
    await db.collection('delayed_reminders')
      .where({ plantId, type, createdBy: OPENID }).remove();
    return { code: 0 };
  }

  // 获取养护记录列表
  if (action === 'records') {
    const query = { familyId };
    if (plantId) query.plantId = plantId;
    const res = await db.collection('care_records')
      .where(query).orderBy('createdAt', 'desc').limit(limit).get();

    // 补充用户信息
    const userIds = [...new Set(res.data.map(r => r.recordedBy))];
    const users = userIds.length > 0
      ? await db.collection('users').where({ _openid: _.in(userIds) }).get()
      : { data: [] };

    return {
      code: 0,
      data: res.data.map(r => ({
        ...r,
        userName: users.data.find(u => u._openid === r.recordedBy)?.nickName || '',
      })),
    };
  }

  // 获取提醒列表（今日/7天）
  if (action === 'reminders') {
    const { roomId, days = 7 } = event;
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 86400000);

    // 1. 从 care_configs 获取即将到来的提醒
    const configQuery = { familyId, enabled: true, nextTime: _.lte(endDate) };
    const configs = await db.collection('care_configs').where(configQuery).get();

    // 按房间筛选
    let plantIds = configs.data.map(c => c.plantId);
    const plantQuery = { _id: _.in(plantIds), familyId,
      status: _.in(['healthy', 'warning', 'critical']) };
    if (roomId) plantQuery.roomId = roomId;
    const plants = await db.collection('plants').where(plantQuery).get();
    const validPlantIds = new Set(plants.data.map(p => p._id));

    const reminders = configs.data
      .filter(c => validPlantIds.has(c.plantId))
      .map(c => {
        const plant = plants.data.find(p => p._id === c.plantId);
        return {
          plantId: c.plantId, plantName: plant?.nickname || plant?.name || '',
          type: c.type, nextTime: c.nextTime, lastTime: c.lastTime,
          intervalDays: c.intervalDays, configId: c._id,
        };
      });

    // 2. 查询延迟提醒
    const delayed = await db.collection('delayed_reminders')
      .where({
        plantId: _.in([...validPlantIds]),
        remindAt: _.lte(endDate),
        familyId,
      }).get();

    // 合并：延迟提醒覆盖正常提醒
    const delayedMap = {};
    delayed.data.forEach(d => {
      delayedMap[`${d.plantId}_${d.type}`] = d;
    });

    const merged = reminders.map(r => {
      const key = `${r.plantId}_${r.type}`;
      if (delayedMap[key]) {
        return { ...r, nextTime: delayedMap[key].remindAt, isDelayed: true };
      }
      return r;
    });

    return { code: 0, data: merged };
  }

  return { code: -1, msg: 'unknown action' };
};
```

### Task 8: 养护提醒页面

**Files:**
- Create: `src/pages/reminder/index.vue`
- Create: `src/components/reminder-item.vue`
- Create: `src/components/quick-record.vue`

- [ ] **Step 1: 创建 src/components/reminder-item.vue**

```vue
<template>
  <view class="reminder-item" :class="{ overdue: isOverdue, delayed: item.isDelayed }">
    <view class="info">
      <text class="plant-name">{{ item.plantName }}</text>
      <view class="meta">
        <text class="type">{{ item.type | careIcon }} {{ item.type | careLabel }}</text>
        <text v-if="item.lastTime" class="last">上次：{{ daysSinceLast }}天前</text>
        <text v-if="item.isDelayed" class="delayed-tag">⏰ 已延后</text>
      </view>
    </view>
    <view class="actions">
      <button class="btn-done" @tap="$emit('done', item)">{{ doneLabel }}</button>
      <button class="btn-delay" @tap="$emit('delay', item)">延后</button>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { isOverdue as checkOverdue } from '@/utils/date';
import { CARE_TYPE_LABEL, CARE_TYPE_ICON } from '@/utils/constants';

const props = defineProps({ item: Object });
defineEmits(['done', 'delay']);

const isOverdue = computed(() => {
  if (props.item.isDelayed) return checkOverdue(props.item.nextTime);
  return false;
});

const daysSinceLast = computed(() => {
  if (!props.item.lastTime) return '-';
  return Math.floor((Date.now() - new Date(props.item.lastTime).getTime()) / 86400000);
});

const doneLabel = computed(() => {
  const labels = { water: '已浇', fertilize: '已施', prune: '已剪', pesticide: '已杀虫', clean: '已清洁' };
  return labels[props.item.type] || '已完成';
});
</script>

<style scoped>
.reminder-item {
  display: flex; align-items: center; padding: 24rpx 30rpx;
  background: #fff; border-bottom: 1rpx solid #f0f0f0;
}
.reminder-item.overdue { border-left: 6rpx solid #e64340; }
.reminder-item.delayed { border-left: 6rpx solid #ff9800; }
.info { flex: 1; }
.plant-name { font-size: 30rpx; font-weight: bold; }
.meta { display: flex; align-items: center; font-size: 24rpx; color: #999; margin-top: 6rpx; }
.last { margin-left: 16rpx; }
.delayed-tag { margin-left: 16rpx; color: #ff9800; font-size: 22rpx; }
.actions { display: flex; gap: 12rpx; }
.btn-done {
  padding: 8rpx 24rpx; background: #e8f5e9; color: #2e7d32;
  border: none; border-radius: 30rpx; font-size: 24rpx;
}
.btn-delay {
  padding: 8rpx 24rpx; background: #f5f5f5; color: #666;
  border: none; border-radius: 30rpx; font-size: 24rpx;
}
</style>
```

- [ ] **Step 2: 创建 src/components/quick-record.vue**

```vue
<template>
  <uni-popup ref="popup" type="bottom">
    <view class="record-panel">
      <text class="title">快速记录</text>

      <view class="field">
        <text class="label">植物</text>
        <picker @change="onPlantChange" :range="plants.map(p => p.nickname || p.name)">
          <text>{{ selectedPlant ? (selectedPlant.nickname || selectedPlant.name) : '选择' }}</text>
        </picker>
      </view>

      <view class="type-selector">
        <view
          v-for="ct in careTypes" :key="ct.value"
          class="type-btn" :class="{ active: recordType === ct.value }"
          @tap="recordType = ct.value"
        >
          <text>{{ ct.label }}</text>
        </view>
      </view>

      <view class="field">
        <textarea v-model="note" placeholder="备注（选填）" class="note-input" />
      </view>

      <view class="btn-row">
        <button @tap="close">取消</button>
        <button class="primary" @tap="submit">记录</button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';

const familyStore = useFamilyStore();
const plants = ref([]);
const selectedPlant = ref(null);
const recordType = ref('water');
const note = ref('');

const careTypes = [
  { value: 'water', label: ' 浇水' },
  { value: 'fertilize', label: ' 施肥' },
  { value: 'prune', label: '✂️ 修剪' },
  { value: 'pesticide', label: ' 杀虫' },
  { value: 'clean', label: ' 清洁' },
];

async function open() {
  const res = await callFunction('plant', { action: 'list', familyId: familyStore.currentFamilyId });
  if (res.code === 0) plants.value = res.data;
  // 打开弹窗
  this.$refs.popup.open();
}

function onPlantChange(e) { selectedPlant.value = plants.value[e.detail.value]; }

async function submit() {
  if (!selectedPlant.value) { uni.showToast({ title: '请选择植物', icon: 'none' }); return; }
  await callFunction('care', {
    action: 'record',
    plantId: selectedPlant.value._id,
    familyId: familyStore.currentFamilyId,
    type: recordType.value,
    note: note.value,
  });
  uni.showToast({ title: '已记录' });
  close();
}

function close() { this.$refs.popup.close(); }
</script>

<style scoped>
.record-panel { background: #fff; padding: 30rpx; border-radius: 20rpx 20rpx 0 0; }
.title { font-size: 32rpx; font-weight: bold; text-align: center; margin-bottom: 30rpx; }
.field { display: flex; align-items: center; padding: 16rpx 0; }
.label { width: 100rpx; font-size: 28rpx; color: #333; }
.type-selector { display: flex; flex-wrap: wrap; gap: 16rpx; padding: 16rpx 0; }
.type-btn {
  padding: 12rpx 24rpx; border-radius: 30rpx;
  background: #f5f5f5; font-size: 26rpx;
}
.type-btn.active { background: #e8f5e9; color: #2e7d32; }
.note-input { width: 100%; height: 120rpx; font-size: 26rpx; border: 1rpx solid #eee; border-radius: 12rpx; padding: 12rpx; }
.btn-row { display: flex; gap: 20rpx; margin-top: 30rpx; }
.btn-row button { flex: 1; }
.btn-row .primary { background: #07c160; color: #fff; }
</style>
```

- [ ] **Step 3: 创建 src/pages/reminder/index.vue**

```vue
<template>
  <view class="page">
    <family-switcher />

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <picker @change="onRoomChange" :range="roomOptions">
        <text>{{ roomOptions[roomIndex] }} ▼</text>
      </picker>
      <view class="time-tabs">
        <text :class="{ active: timeTab === 'today' }" @tap="timeTab = 'today'">今日</text>
        <text :class="{ active: timeTab === '7days' }" @tap="timeTab = '7days'">7天</text>
      </view>
      <text class="quick-btn" @tap="showQuickRecord">+</text>
    </view>

    <view v-if="reminders.length === 0" class="empty">
      <text>所有植物都照顾好了，真棒！</text>
    </view>

    <view v-for="(group, date) in groupedReminders" :key="date" class="date-group">
      <text class="date-title">{{ dateLabel(date) }}</text>
      <reminder-item
        v-for="item in group" :key="`${item.plantId}_${item.type}`"
        :item="item"
        @done="markDone"
        @delay="delayReminder"
      />
    </view>

    <!-- 快速记录浮层 -->
    <quick-record ref="quickRecord" />

    <!-- 延迟提醒选择器 -->
    <uni-popup ref="delayPopup" type="bottom">
      <view class="delay-panel">
        <text class="title">延后提醒</text>
        <view
          v-for="opt in DELAY_OPTIONS" :key="opt.label"
          class="delay-option" @tap="confirmDelay(opt)"
        >
          <text>{{ opt.label }}</text>
        </view>
        <button @tap="closeDelay">取消</button>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onShow, onMounted } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { formatDate, isToday } from '@/utils/date';
import { DELAY_OPTIONS } from '@/utils/constants';
import FamilySwitcher from '@/components/family-switcher.vue';
import ReminderItem from '@/components/reminder-item.vue';
import QuickRecord from '@/components/quick-record.vue';

const familyStore = useFamilyStore();
const reminders = ref([]);
const rooms = ref([]);
const roomIndex = ref(0);
const timeTab = ref('today');
const delayTarget = ref(null);

const roomOptions = computed(() => ['全部房间', ...rooms.value.map(r => r.name)]);

const groupedReminders = computed(() => {
  const groups = {};
  reminders.value.forEach(r => {
    const key = formatDate(r.nextTime);
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  // 如果选今日，只显示今天（含逾期）
  if (timeTab.value === 'today') {
    const today = formatDate(new Date());
    const overdue = {};
    Object.keys(groups).forEach(k => {
      if (k < today) {
        if (!overdue[today]) overdue[today] = [];
        overdue[today].push(...groups[k]);
      }
    });
    return { ...overdue, [today]: groups[today] || [] };
  }
  return groups;
});

function dateLabel(dateStr) {
  if (isToday(dateStr)) return ' 今日';
  return ` ${dateStr}`;
}

async function loadReminders() {
  if (!familyStore.currentFamilyId) return;
  const selectedRoom = roomIndex.value > 0 ? rooms.value[roomIndex.value - 1]._id : null;
  const [remindRes, roomRes] = await Promise.all([
    callFunction('care', {
      action: 'reminders',
      familyId: familyStore.currentFamilyId,
      roomId: selectedRoom,
      days: timeTab.value === 'today' ? 1 : 7,
    }),
    callFunction('room', { action: 'list', familyId: familyStore.currentFamilyId }),
  ]);
  if (remindRes.code === 0) reminders.value = remindRes.data;
  if (roomRes.code === 0) rooms.value = roomRes.data;
}

async function markDone(item) {
  await callFunction('care', {
    action: 'record',
    plantId: item.plantId,
    familyId: familyStore.currentFamilyId,
    type: item.type,
  });
  uni.showToast({ title: '已记录', icon: 'success' });
  await loadReminders();
}

function delayReminder(item) {
  delayTarget.value = item;
  // 打开延迟选择弹窗
}

async function confirmDelay(opt) {
  if (!delayTarget.value) return;
  await callFunction('delayed_reminders', {
    action: 'create',
    plantId: delayTarget.value.plantId,
    familyId: familyStore.currentFamilyId,
    type: delayTarget.value.type,
    remindAt: new Date(opt.getTime()).toISOString(),
  });
  uni.showToast({ title: '已延后' });
  delayTarget.value = null;
  await loadReminders();
}

function showQuickRecord() { quickRecord.value.open(); }

onShow(() => loadReminders());
onMounted(() => {
  uni.$on('familyChanged', loadReminders);
});
</script>

<style scoped>
.filter-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16rpx 20rpx; background: #fff; border-bottom: 1rpx solid #eee;
}
.time-tabs text {
  padding: 8rpx 24rpx; font-size: 26rpx; border-radius: 30rpx;
}
.time-tabs text.active { background: #e8f5e9; color: #2e7d32; }
.quick-btn { font-size: 36rpx; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
.date-group { padding: 20rpx; }
.date-title { font-size: 28rpx; font-weight: bold; display: block; margin-bottom: 12rpx; }
.delay-panel { background: #fff; padding: 30rpx; border-radius: 20rpx 20rpx 0 0; }
.delay-option { padding: 24rpx 0; font-size: 30rpx; border-bottom: 1rpx solid #f0f0f0; }
</style>
```

### Task 9: 延迟提醒云函数

**Files:**
- Create: `cloudfunctions/delayed_reminders/index.js`

- [ ] **Step 1: 创建延迟提醒云函数**

```js
// cloudfunctions/delayed_reminders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, plantId, familyId, type, remindAt } = event;

  if (action === 'create') {
    // 覆盖同 plantId+type 的已有延迟提醒
    const existing = await db.collection('delayed_reminders')
      .where({ plantId, type, createdBy: OPENID }).get();
    if (existing.data.length > 0) {
      await db.collection('delayed_reminders').doc(existing.data[0]._id).update({
        data: { remindAt: new Date(remindAt) },
      });
      return { code: 0 };
    }
    await db.collection('delayed_reminders').add({
      data: { plantId, familyId, type, remindAt: new Date(remindAt), createdBy: OPENID, createdAt: db.serverDate() },
    });
    return { code: 0 };
  }

  if (action === 'cancel') {
    await db.collection('delayed_reminders')
      .where({ plantId, type, createdBy: OPENID }).remove();
    return { code: 0 };
  }

  return { code: -1 };
};
```

---

## Phase 5: 成长记录与纪念碑

### Task 10: 成长事件云函数与页面

**Files:**
- Create: `cloudfunctions/event/index.js`
- Create: `src/pages/event-add/index.vue`
- Create: `src/pages/timeline/index.vue`

- [ ] **Step 1: 创建 event 云函数**

```js
// cloudfunctions/event/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, plantId, familyId, eventId, data, limit = 50 } = event;

  if (action === 'list') {
    const query = { plantId };
    if (eventId) query._id = eventId;
    const res = await db.collection('growth_events')
      .where(query).orderBy('eventDate', 'desc').limit(limit).get();
    return { code: 0, data: res.data };
  }

  if (action === 'create') {
    await db.collection('growth_events').add({
      data: {
        plantId, familyId,
        type: data.type, description: data.description,
        photos: data.photos || [],
        eventDate: new Date(data.eventDate),
        createdBy: OPENID, createdAt: db.serverDate(),
      },
    });
    return { code: 0 };
  }

  if (action === 'delete') {
    await db.collection('growth_events').doc(eventId).remove();
    return { code: 0 };
  }

  return { code: -1 };
};
```

- [ ] **Step 2: 创建 src/pages/event-add/index.vue**

```vue
<template>
  <view class="page">
    <view class="form">
      <view class="photo-upload" @tap="chooseImages">
        <view v-for="(img, i) in photos" :key="i" class="photo-item">
          <image :src="img" />
          <text class="del" @tap="photos.splice(i, 1)">✕</text>
        </view>
        <view v-if="photos.length < 9" class="add-photo">+</view>
      </view>

      <view class="field">
        <text class="label">事件类型</text>
        <picker @change="onTypeChange" :range="typeOptions">
          <text>{{ selectedType }}</text>
        </picker>
      </view>

      <view class="field">
        <text class="label">日期</text>
        <picker mode="date" @change="onDateChange">
          <text>{{ eventDate || '今天' }}</text>
        </picker>
      </view>

      <view class="field">
        <textarea v-model="description" placeholder="描述一下（选填）" class="desc" />
      </view>
    </view>

    <button class="submit" @tap="submit">保存</button>
  </view>
</template>

<script setup>
import { ref, onLoad } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { EVENT_TYPE_LABEL, EVENT_TYPES } from '@/utils/constants';

const familyStore = useFamilyStore();
const plantId = ref('');
const photos = ref([]);
const eventType = ref('repot');
const eventDate = ref(new Date().toISOString().split('T')[0]);
const description = ref('');

const typeOptions = EVENT_TYPES.map(t => EVENT_TYPE_LABEL[t]);
const selectedType = ref(EVENT_TYPE_LABEL.repot);

async function chooseImages() {
  const res = await uni.chooseImage({ count: 9 - photos.value.length });
  for (const path of res.tempFilePaths) {
    const { fileID } = await uni.cloud.uploadFile({
      cloudPath: `events/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
      filePath: path,
    });
    photos.value.push(fileID);
  }
}

function onTypeChange(e) {
  eventType.value = EVENT_TYPES[e.detail.value];
  selectedType.value = typeOptions[e.detail.value];
}

function onDateChange(e) { eventDate.value = e.detail.value; }

async function submit() {
  await callFunction('event', {
    action: 'create',
    plantId: plantId.value,
    familyId: familyStore.currentFamilyId,
    data: {
      type: eventType.value,
      eventDate: eventDate.value,
      description: description.value,
      photos: photos.value,
    },
  });
  uni.showToast({ title: '已记录' });
  setTimeout(() => uni.navigateBack(), 1500);
}

onLoad((opt) => { plantId.value = opt.plantId; });
</script>

<style scoped>
.form { padding: 30rpx; background: #fff; }
.photo-upload { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 30rpx; }
.photo-item { width: 200rpx; height: 200rpx; position: relative; }
.photo-item image { width: 100%; height: 100%; border-radius: 12rpx; }
.photo-item .del { position: absolute; top: -8rpx; right: -8rpx; background: #e64340; color: #fff; width: 36rpx; height: 36rpx; border-radius: 50%; text-align: center; line-height: 36rpx; font-size: 24rpx; }
.add-photo { width: 200rpx; height: 200rpx; border: 2rpx dashed #ddd; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 60rpx; color: #ddd; }
.field { padding: 24rpx 0; border-bottom: 1rpx solid #f0f0f0; display: flex; align-items: center; }
.field .label { width: 140rpx; font-size: 28rpx; }
.desc { width: 100%; height: 160rpx; font-size: 26rpx; margin-top: 20rpx; }
.submit { margin: 40rpx 30rpx; background: #07c160; color: #fff; }
</style>
```

- [ ] **Step 3: 创建 src/pages/timeline/index.vue**

```vue
<template>
  <view class="page">
    <view class="timeline-header">
      <text class="plant-name">{{ plantName }} 的成长记录</text>
      <text class="add-btn" @tap="goAdd">+ 记录</text>
    </view>

    <view v-if="events.length === 0" class="empty">
      <text>还没有记录</text>
      <text class="sub">开始记录植物的成长吧</text>
    </view>

    <view class="timeline">
      <view v-for="(group, yearMonth) in grouped" :key="yearMonth" class="month-group">
        <text class="month-label">{{ yearMonth }}</text>
        <view class="line"></view>
        <view v-for="e in group" :key="e._id" class="event-node">
          <view class="dot"></view>
          <view class="event-card">
            <image v-if="e.photos?.length" :src="e.photos[0]" class="event-photo" />
            <view class="event-info">
              <text class="event-type">{{ e.type | eventIcon }} {{ e.type | eventLabel }}</text>
              <text class="event-date">{{ formatDate(e.eventDate) }}</text>
              <text v-if="e.description" class="event-desc">{{ e.description }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onLoad, onShow } from 'vue';
import { callFunction } from '@/utils/cloud';
import { formatDate } from '@/utils/date';

const plantId = ref('');
const plantName = ref('');
const events = ref([]);

const grouped = computed(() => {
  const groups = {};
  events.value.forEach(e => {
    const key = formatDate(e.eventDate).slice(0, 7); // YYYY-MM
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
});

async function loadEvents() {
  const [eventRes, plantRes] = await Promise.all([
    callFunction('event', { action: 'list', plantId: plantId.value }),
    callFunction('plant', { action: 'get', plantId: plantId.value }),
  ]);
  if (eventRes.code === 0) events.value = eventRes.data;
  if (plantRes.code === 0) plantName.value = plantRes.data.nickname || plantRes.data.name;
}

function goAdd() { uni.navigateTo({ url: `/pages/event-add/index?plantId=${plantId.value}` }); }

onLoad((opt) => { plantId.value = opt.plantId; });
onShow(() => loadEvents());
</script>

<style scoped>
.timeline-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 30rpx; background: #fff;
}
.plant-name { font-size: 32rpx; font-weight: bold; }
.add-btn { font-size: 28rpx; color: #07c160; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
.empty .sub { display: block; font-size: 26rpx; margin-top: 10rpx; }
.timeline { padding: 20rpx 30rpx; }
.month-group { margin-bottom: 30rpx; }
.month-label { font-size: 26rpx; font-weight: bold; color: #666; display: block; margin-bottom: 16rpx; }
.event-node { display: flex; margin-bottom: 24rpx; position: relative; padding-left: 30rpx; }
.dot { position: absolute; left: 0; top: 12rpx; width: 16rpx; height: 16rpx; border-radius: 50%; background: #07c160; }
.event-card { flex: 1; background: #fff; border-radius: 12rpx; padding: 16rpx; }
.event-photo { width: 100%; height: 300rpx; border-radius: 8rpx; margin-bottom: 12rpx; }
.event-type { font-size: 28rpx; font-weight: bold; }
.event-date { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }
.event-desc { font-size: 26rpx; color: #666; display: block; margin-top: 8rpx; }
</style>
```

### Task 11: 纪念碑

**Files:**
- Create: `cloudfunctions/memorial/index.js`
- Create: `src/pages/memorial/index.vue`
- Create: `src/pages/memorial-add/index.vue`

- [ ] **Step 1: 创建 memorial 云函数**

```js
// cloudfunctions/memorial/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, familyId, memorialId, data, plantId } = event;

  if (action === 'list') {
    const res = await db.collection('memorials')
      .where({ familyId }).orderBy('createdAt', 'desc').get();

    // 统计存活率
    const total = await db.collection('plants')
      .where({ familyId, status: _.in(['healthy', 'warning', 'critical']) }).count();
    const totalCount = total.total + res.data.length;

    return {
      code: 0,
      data: res.data,
      stats: { total: totalCount, lost: res.data.length, survived: total.total },
    };
  }

  if (action === 'create') {
    // 获取植物信息
    const plant = await db.collection('plants').doc(plantId).get();
    await db.collection('memorials').add({
      data: {
        plantId,
        plantName: plant.data.nickname || plant.data.name,
        plantPhoto: plant.data.photo || '',
        familyId,
        type: data.type,
        deathDate: new Date(data.deathDate),
        reason: data.reason || '',
        farewell: data.farewell || '',
        recipient: data.recipient || '',
        memorialPhotos: data.memorialPhotos || [],
        createdBy: OPENID,
        createdAt: db.serverDate(),
      },
    });
    // 更新植物状态
    await db.collection('plants').doc(plantId).update({
      data: { status: data.type === 'dead' ? 'dead' : 'given', updatedAt: db.serverDate() },
    });
    return { code: 0 };
  }

  if (action === 'delete') {
    await db.collection('memorials').doc(memorialId).remove();
    return { code: 0 };
  }

  return { code: -1 };
};
```

- [ ] **Step 2: 创建 src/pages/memorial/index.vue**

```vue
<template>
  <view class="page">
    <family-switcher />

    <view v-if="memorials.length === 0" class="empty">
      <text>还没有植物离开</text>
    </view>

    <!-- 存活率统计 -->
    <view v-if="stats" class="stats-bar">
      <text>存活率 {{ stats.survived }}/{{ stats.total }} = {{ Math.round(stats.survived / stats.total * 100) }}%</text>
    </view>

    <!-- 已故 -->
    <view v-if="deadList.length > 0" class="section">
      <text class="section-title">已故 ({{ deadList.length }})</text>
      <view v-for="m in deadList" :key="m._id" class="memorial-card">
        <image v-if="m.plantPhoto" :src="m.plantPhoto" class="thumb" />
        <view class="info">
          <text class="name">{{ m.plantName }}</text>
          <text class="reason">⚰️ {{ m.reason || '未知原因' }}</text>
          <text class="farewell" v-if="m.farewell">"{{ m.farewell }}"</text>
        </view>
      </view>
    </view>

    <!-- 已赠出 -->
    <view v-if="givenList.length > 0" class="section">
      <text class="section-title">已赠出 ({{ givenList.length }})</text>
      <view v-for="m in givenList" :key="m._id" class="memorial-card">
        <image v-if="m.plantPhoto" :src="m.plantPhoto" class="thumb" />
        <view class="info">
          <text class="name">{{ m.plantName }}</text>
          <text class="reason"> 赠予 {{ m.recipient || '他人' }}</text>
        </view>
      </view>
    </view>

    <view class="fab" @tap="goAdd">+</view>
  </view>
</template>

<script setup>
import { ref, computed, onShow, onMounted } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import FamilySwitcher from '@/components/family-switcher.vue';

const familyStore = useFamilyStore();
const memorials = ref([]);
const stats = ref(null);

const deadList = computed(() => memorials.value.filter(m => m.type === 'dead'));
const givenList = computed(() => memorials.value.filter(m => m.type === 'given'));

async function loadData() {
  if (!familyStore.currentFamilyId) return;
  const res = await callFunction('memorial', { action: 'list', familyId: familyStore.currentFamilyId });
  if (res.code === 0) {
    memorials.value = res.data;
    stats.value = res.stats;
  }
}

function goAdd() { uni.navigateTo({ url: '/pages/memorial-add/index' }); }

onShow(() => loadData());
onMounted(() => uni.$on('familyChanged', loadData));
</script>

<style scoped>
.empty { text-align: center; padding: 200rpx 0; color: #999; }
.stats-bar { padding: 20rpx 30rpx; background: #fff; text-align: center; font-size: 28rpx; color: #666; }
.section { padding: 20rpx 30rpx; }
.section-title { font-size: 28rpx; font-weight: bold; display: block; margin-bottom: 16rpx; color: #333; }
.memorial-card { display: flex; padding: 20rpx; background: #fff; border-radius: 16rpx; margin-bottom: 16rpx; }
.thumb { width: 100rpx; height: 100rpx; border-radius: 12rpx; margin-right: 20rpx; }
.info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.name { font-size: 30rpx; font-weight: bold; }
.reason { font-size: 26rpx; color: #666; margin-top: 4rpx; }
.farewell { font-size: 24rpx; color: #999; font-style: italic; margin-top: 4rpx; }
.fab {
  position: fixed; bottom: 100rpx; right: 30rpx;
  width: 100rpx; height: 100rpx; border-radius: 50%;
  background: #999; color: #fff; font-size: 50rpx;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.2);
}
</style>
```

- [ ] **Step 3: 创建 src/pages/memorial-add/index.vue**

```vue
<template>
  <view class="page">
    <view class="form">
      <view class="field">
        <text class="label">选择植物</text>
        <picker @change="onPlantChange" :range="plantOptions">
          <text>{{ selectedPlant ? (selectedPlant.nickname || selectedPlant.name) : '请选择' }}</text>
        </picker>
      </view>

      <view class="field">
        <text class="label">类型</text>
        <picker @change="onTypeChange" :range="['已死亡', '已赠出']">
          <text>{{ typeLabel }}</text>
        </picker>
      </view>

      <view class="field">
        <text class="label">日期</text>
        <picker mode="date" @change="onDateChange">
          <text>{{ form.date || '今天' }}</text>
        </picker>
      </view>

      <view class="field">
        <text class="label">原因</text>
        <input v-model="form.reason" placeholder="如：浇水过多烂根" />
      </view>

      <view class="field" v-if="form.type === 'given'">
        <text class="label">赠予</text>
        <input v-model="form.recipient" placeholder="赠予对象" />
      </view>

      <view class="field">
        <text class="label">告别语</text>
        <textarea v-model="form.farewell" placeholder="说点什么吧（选填）" class="farewell-input" maxlength="200" />
      </view>
    </view>

    <button class="submit" @tap="submit">确认移入</button>
  </view>
</template>

<script setup>
import { ref, computed, onShow, reactive } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';

const familyStore = useFamilyStore();
const plants = ref([]);
const selectedPlant = ref(null);

const plantOptions = computed(() => plants.value.map(p => p.nickname || p.name));

const form = reactive({
  type: 'dead', date: '', reason: '', farewell: '', recipient: '',
});
const typeLabel = ref('已死亡');

async function loadPlants() {
  const res = await callFunction('plant', { action: 'list', familyId: familyStore.currentFamilyId });
  if (res.code === 0) plants.value = res.data;
}

function onPlantChange(e) { selectedPlant.value = plants.value[e.detail.value]; }
function onTypeChange(e) {
  form.type = e.detail.value === 0 ? 'dead' : 'given';
  typeLabel.value = ['已死亡', '已赠出'][e.detail.value];
}
function onDateChange(e) { form.date = e.detail.value; }

async function submit() {
  if (!selectedPlant.value) { uni.showToast({ title: '请选择植物', icon: 'none' }); return; }
  await callFunction('memorial', {
    action: 'create',
    plantId: selectedPlant.value._id,
    familyId: familyStore.currentFamilyId,
    data: { ...form, deathDate: form.date || new Date().toISOString() },
  });
  uni.showToast({ title: '已记录' });
  setTimeout(() => uni.navigateBack(), 1500);
}

onShow(() => loadPlants());
</script>

<style scoped>
.form { padding: 30rpx; background: #fff; }
.field { padding: 24rpx 0; border-bottom: 1rpx solid #f0f0f0; display: flex; align-items: center; }
.field .label { width: 140rpx; font-size: 28rpx; color: #333; }
.field input, .field textarea { flex: 1; font-size: 28rpx; }
.farewell-input { width: 100%; height: 120rpx; font-size: 26rpx; }
.submit { margin: 40rpx 30rpx; background: #e8f5e9; color: #2e7d32; border: none; }
</style>
```

---

## Phase 6: 个人中心与家庭管理

### Task 12: 我的页面

**Files:**
- Create: `src/pages/profile/index.vue`

- [ ] **Step 1: 创建我的页面**

```vue
<template>
  <view class="page">
    <view class="user-info">
      <open-data type="userAvatarUrl" class="avatar" />
      <open-data type="userNickName" class="nickname" />
    </view>

    <view class="section">
      <text class="section-title">我的家庭</text>
      <view
        v-for="f in familyStore.families" :key="f._id"
        class="family-card"
        @tap="goFamilyManage(f._id)"
        :class="{ active: f._id === familyStore.currentFamilyId }"
      >
        <view class="family-info">
          <text class="family-name">{{ f.name }}</text>
          <text class="family-role">{{ f.role === 'admin' ? '管理员' : '成员' }}</text>
        </view>
        <text class="arrow">›</text>
      </view>

      <view class="action-row">
        <text @tap="showJoin">加入家庭</text>
        <text @tap="showCreate">创建家庭</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">植物统计</text>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="num">{{ stats.total || 0 }}</text>
          <text>总植物</text>
        </view>
        <view class="stat-item">
          <text class="num">{{ stats.survived || 0 }}</text>
          <text>存活</text>
        </view>
        <view class="stat-item">
          <text class="num">{{ stats.lost || 0 }}</text>
          <text>失去</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="menu-item" @tap="goSettings">
        <text>设置</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 加入家庭弹窗 -->
    <uni-popup ref="joinPopup" type="dialog">
      <view class="dialog">
        <text class="dialog-title">加入家庭</text>
        <input v-model="inviteCode" placeholder="输入6位邀请码" class="dialog-input" />
        <button @tap="joinFamily">确认</button>
      </view>
    </uni-popup>

    <!-- 创建家庭弹窗 -->
    <uni-popup ref="createPopup" type="dialog">
      <view class="dialog">
        <text class="dialog-title">创建家庭</text>
        <input v-model="newFamilyName" placeholder="输入家庭名称" class="dialog-input" />
        <button @tap="createFamily">创建</button>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onShow } from 'vue';
import { useFamilyStore } from '@/store/family';

const familyStore = useFamilyStore();
const stats = ref({ total: 0, survived: 0, lost: 0 });
const inviteCode = ref('');
const newFamilyName = ref('');

async function loadStats() {
  if (!familyStore.currentFamilyId) return;
  const { callFunction } = await import('@/utils/cloud');
  const res = await callFunction('memorial', { action: 'list', familyId: familyStore.currentFamilyId });
  if (res.code === 0 && res.stats) stats.value = res.stats;
}

function goFamilyManage(familyId) {
  uni.navigateTo({ url: `/pages/family-manage/index?familyId=${familyId}` });
}

function showJoin() { /* 显示加入弹窗 */ }
function showCreate() { /* 显示创建弹窗 */ }

async function joinFamily() {
  const res = await familyStore.joinFamily(inviteCode.value);
  if (res.code === 0) {
    uni.showToast({ title: '加入成功' });
  } else {
    uni.showToast({ title: res.msg || '加入失败', icon: 'none' });
  }
}

async function createFamily() {
  if (!newFamilyName.value) return;
  await familyStore.createFamily(newFamilyName.value);
  uni.showToast({ title: '创建成功' });
  newFamilyName.value = '';
}

function goSettings() { uni.navigateTo({ url: '/pages/settings/index' }); }

onShow(async () => {
  await familyStore.loadFamilies();
  await loadStats();
});
</script>

<style scoped>
.user-info { padding: 40rpx; background: #fff; display: flex; align-items: center; }
.avatar { width: 120rpx; height: 120rpx; border-radius: 50%; }
.nickname { font-size: 36rpx; font-weight: bold; margin-left: 30rpx; }
.section { background: #fff; margin-top: 16rpx; padding: 30rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.family-card {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24rpx; border-radius: 12rpx; margin-bottom: 12rpx;
  background: #f8f8f8;
}
.family-card.active { border: 2rpx solid #07c160; }
.family-name { font-size: 30rpx; }
.family-role { font-size: 24rpx; color: #999; margin-left: 16rpx; }
.arrow { font-size: 36rpx; color: #ccc; }
.action-row { display: flex; gap: 30rpx; padding-top: 16rpx; }
.action-row text { color: #07c160; font-size: 28rpx; }
.stats-grid { display: flex; justify-content: space-around; }
.stat-item { text-align: center; }
.stat-item .num { font-size: 40rpx; font-weight: bold; color: #07c160; display: block; }
.menu-item { display: flex; justify-content: space-between; padding: 24rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.dialog { padding: 30rpx; }
.dialog-title { font-size: 32rpx; font-weight: bold; display: block; margin-bottom: 20rpx; }
.dialog-input { border: 1rpx solid #ddd; padding: 16rpx; border-radius: 8rpx; font-size: 28rpx; margin-bottom: 20rpx; }
</style>
```

### Task 13: 家庭管理页面

**Files:**
- Create: `src/pages/family-manage/index.vue`
- Create: `src/pages/member-detail/index.vue`

- [ ] **Step 1: 创建 src/pages/family-manage/index.vue**

```vue
<template>
  <view class="page">
    <view class="section">
      <view class="field">
        <text class="label">家庭名</text>
        <text class="value">{{ family?.name }}</text>
        <text v-if="isAdmin" class="edit" @tap="editName">修改</text>
      </view>
      <view class="field">
        <text class="label">邀请码</text>
        <text class="value">{{ family?.inviteCode }}</text>
        <text class="edit" @tap="copyCode">复制</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">家人 ({{ members.length }})</text>
      <view v-for="m in members" :key="m._id" class="member-item">
        <open-data v-if="m.userInfo" type="userAvatarUrl" class="member-avatar" />
        <view class="member-info">
          <text class="member-name">{{ m.userInfo?.nickName || '未知' }}</text>
          <text class="member-role">{{ m.role === 'admin' ? '管理员' : '成员' }}</text>
        </view>
        <text class="view-btn" @tap="goMemberDetail(m.userId)">查看→</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">最近操作</text>
      <view v-for="op in recentOps" :key="op._id" class="op-item">
        <text class="op-user">{{ op.userInfo?.nickName || '' }}</text>
        <text class="op-time">· {{ formatDateTime(op.createdAt) }}</text>
        <text class="op-type">· {{ op.type | careLabel }}</text>
        <text class="view-btn" @tap="goOpDetail(op)">[查看→]</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onLoad, onShow } from 'vue';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { formatDateTime } from '@/utils/date';

const familyStore = useFamilyStore();
const family = ref(null);
const members = ref([]);
const recentOps = ref([]);
const currentUser = ref('');

const isAdmin = computed(() => {
  const me = members.value.find(m => m.userId === currentUser.value);
  return me?.role === 'admin';
});

async function loadData(familyId) {
  const [familyRes, memberRes, opsRes] = await Promise.all([
    callFunction('family', { action: 'list' }),
    callFunction('family', { action: 'members', familyId }),
    callFunction('family', { action: 'recentOps', familyId }),
  ]);
  if (familyRes.code === 0) family.value = familyRes.data.find(f => f._id === familyId);
  if (memberRes.code === 0) members.value = memberRes.data;
  if (opsRes.code === 0) recentOps.value = opsRes.data;
}

function goMemberDetail(userId) {
  uni.navigateTo({
    url: `/pages/member-detail/index?familyId=${family.value._id}&userId=${userId}`,
  });
}

function copyCode() {
  uni.setClipboardData({ data: family.value.inviteCode });
  uni.showToast({ title: '已复制' });
}

onLoad((opt) => { currentUser.value = familyStore.currentFamily?.createdBy || ''; });
onShow(() => {
  if (familyStore.currentFamilyId) loadData(familyStore.currentFamilyId);
});
</script>

<style scoped>
.section { background: #fff; padding: 30rpx; margin-top: 16rpx; }
.field { display: flex; align-items: center; padding: 16rpx 0; }
.label { width: 120rpx; font-size: 28rpx; color: #666; }
.value { flex: 1; font-size: 28rpx; }
.edit { font-size: 26rpx; color: #07c160; }
.section-title { font-size: 28rpx; font-weight: bold; display: block; margin-bottom: 16rpx; }
.member-item { display: flex; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.member-avatar { width: 60rpx; height: 60rpx; border-radius: 50%; }
.member-info { flex: 1; margin-left: 16rpx; }
.member-name { font-size: 28rpx; }
.member-role { font-size: 24rpx; color: #999; margin-left: 12rpx; }
.view-btn { font-size: 26rpx; color: #07c160; }
.op-item { padding: 16rpx 0; font-size: 26rpx; color: #666; }
.op-user { font-weight: bold; color: #333; }
.op-time { color: #999; }
</style>
```

- [ ] **Step 2: 创建 src/pages/member-detail/index.vue**

```vue
<template>
  <view class="page">
    <view class="header">
      <text class="user-name">{{ userInfo?.nickName || '未知' }}</text>
      <text class="count">共操作 {{ ops.length }} 次</text>
    </view>

    <view v-if="Object.keys(groupedOps).length === 0" class="empty">
      <text>暂无操作记录</text>
    </view>

    <view v-for="(ops, date) in groupedOps" :key="date" class="date-group">
      <text class="date-label">{{ date }}</text>
      <view v-for="op in ops" :key="op._id" class="op-group">
        <text class="op-type"> 浇水</text>
        <text class="op-plants">{{ op.plants?.join('、') || '' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onLoad } from 'vue';
import { callFunction } from '@/utils/cloud';
import { formatDate } from '@/utils/date';

const ops = ref([]);
const userInfo = ref(null);

const groupedOps = computed(() => {
  const groups = {};
  ops.value.forEach(op => {
    const key = formatDate(op.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(op);
  });
  return groups;
});

onLoad(async (opt) => {
  const { familyId, userId } = opt;
  const [opRes, userRes] = await Promise.all([
    callFunction('family', { action: 'memberOps', familyId, memberId: userId }),
    callFunction('login', { action: 'get', userId }),
  ]);
  if (opRes.code === 0) ops.value = opRes.data;
  if (userRes.code === 0) userInfo.value = userRes.data;
});
</script>

<style scoped>
.header { padding: 30rpx; background: #fff; display: flex; align-items: center; }
.user-name { font-size: 36rpx; font-weight: bold; }
.count { font-size: 26rpx; color: #999; margin-left: 20rpx; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
.date-group { padding: 20rpx 30rpx; }
.date-label { font-size: 28rpx; font-weight: bold; color: #666; display: block; margin-bottom: 12rpx; }
.op-group { display: flex; align-items: center; padding: 12rpx 0; }
.op-type { font-size: 28rpx; margin-right: 16rpx; }
.op-plants { font-size: 26rpx; color: #666; }
</style>
```

### Task 14: 设置页面

**Files:**
- Create: `src/pages/settings/index.vue`

- [ ] **Step 1: 创建设置页**

```vue
<template>
  <view class="page">
    <view class="section">
      <text class="section-title">提醒推送时间</text>
      <picker mode="time" :value="remindTime" @change="onTimeChange">
        <text class="value">⏰ 每天 {{ remindTime }}</text>
      </picker>
    </view>

    <view class="section">
      <view class="switch-item">
        <text> 浇水提醒</text>
        <switch :checked="true" />
      </view>
      <view class="switch-item">
        <text> 施肥提醒</text>
        <switch :checked="true" />
      </view>
      <view class="switch-item">
        <text>⚠️ 逾期提醒</text>
        <switch :checked="true" />
      </view>
    </view>

    <view class="section">
      <view class="info-row">
        <text>版本</text>
        <text class="value">1.0.0</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const remindTime = ref('09:00');

function onTimeChange(e) {
  remindTime.value = e.detail.value;
  uni.setStorageSync('remindTime', remindTime.value);
  uni.showToast({ title: '已设置' });
}
</script>

<style scoped>
.section { background: #fff; padding: 30rpx; margin-top: 16rpx; }
.section-title { font-size: 28rpx; color: #666; display: block; margin-bottom: 16rpx; }
.value { font-size: 30rpx; }
.switch-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.info-row { display: flex; justify-content: space-between; padding: 16rpx 0; }
</style>
```

---

## Phase 7: 数据初始化

### Task 15: 初始化默认数据

- [ ] **Step 1: 在云数据库中创建集合**

在微信开发者工具中，云开发控制台 → 数据库 → 创建以下集合：
- `users`
- `families`
- `family_members`
- `rooms`
- `plants`
- `care_configs`
- `care_records`
- `growth_events`
- `memorials`
- `delayed_reminders`

- [ ] **Step 2: 在新家庭创建时自动生成默认房间**

在 `cloudfunctions/family/index.js` 的 `create` action 中补充：

```js
// 在创建家庭成功后，创建默认房间
const { DEFAULT_ROOMS } = require('./constants');
const roomsData = DEFAULT_ROOMS.map((name, i) => ({
  name, familyId: res._id, sortOrder: i, isDefault: true,
  createdAt: db.serverDate(),
}));
await Promise.all(roomsData.map(r => db.collection('rooms').add({ data: r })));
```

创建 `cloudfunctions/family/constants.js`：

```js
const DEFAULT_ROOMS = ['客厅', '阳台', '卧室', '书房', '厨房', '卫生间'];
module.exports = { DEFAULT_ROOMS };
```

---

## 执行计划

建议的执行顺序（按依赖关系）：

| 顺序 | Task | 依赖 | 说明 |
|------|------|------|------|
| 1 | Task 1 | - | 项目脚手架、云开发接入 |
| 2 | Task 2 | Task 1 | 微信登录 |
| 3 | Task 3 | Task 2 | 家庭系统（核心基建） |
| 4 | Task 4 | Task 3 | 房间管理（需家庭存在） |
| 5 | Task 5 | Task 3, 4 | 植物 CRUD |
| 6 | Task 6 | Task 5 | 植物详情页 |
| 7 | Task 7 | Task 5 | 养护记录与提醒云函数 |
| 8 | Task 8 | Task 7 | 养护提醒页面 |
| 9 | Task 9 | Task 7 | 延迟提醒云函数 |
| 10 | Task 10 | Task 5 | 成长记录 |
| 11 | Task 11 | Task 5 | 纪念碑 |
| 12 | Task 12 | Task 3 | 我的页面 |
| 13 | Task 13 | Task 3 | 家庭管理页面 |
| 14 | Task 14 | - | 设置页面 |
| 15 | Task 15 | Task 3 | 数据初始化 |
