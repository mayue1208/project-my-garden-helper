# 微信授权登录与数据隔离 设计文档

日期: 2026-05-19
状态: 已确认

---

## 背景

当前项目的登录逻辑未与微信账号关联，主要问题：
1. 登录时未向用户请求授权获取头像和昵称
2. 用户标识仅依赖 OPENID，登录流程不完整
3. 退出登录后，家庭和植物数据仍然可见，未做数据隔离

## 目标

- 点击个人页头像区域弹出底部授权弹窗，用户同意后获取微信头像和昵称
- 使用微信 OPENID 作为用户唯一标识
- 授权后将用户信息保存到后台数据库
- 已登录用户可通过编辑 icon 修改头像和昵称
- 退出登录后清除所有本地状态，数据页面显示引导提示

---

## 设计

### 第 1 章：用户授权流程（Profile 页面）

**文件：** `src/pages/profile/index.vue`、`src/pages/profile/index.scss`

**交互流程：**

1. 未登录时，头像区域显示默认头像 + "点击登录"文案
2. 点击头像区域 → 底部弹出授权面板（action-sheet 风格）
3. 弹窗内容：
   - 标题："微信授权登录"
   - 头像选择按钮：`<button open-type="chooseAvatar" @chooseavatar="onChooseAvatar">`
   - 昵称输入框：`<input type="nickname" @blur="onNicknameInput">`
   - "确认授权"按钮
4. 用户确认后：
   - 调用 `uni.login({ provider: 'weixin' })` 获取微信凭证
   - 调用 `userStore.login(nickName, avatarUrl)` 保存到后端
   - 更新本地用户状态
   - 关闭弹窗，Toast 提示成功

**状态变量：**
- `showAuthPopup` — 控制授权弹窗显示
- `avatarUrl` — 临时选择的头像路径
- `nickName` — 临时输入的昵称
- `loggingIn` — 登录中 loading 状态

**UI 状态区分：**
- 未登录：默认头像 + "点击登录"
- 已登录：用户头像 + 昵称 + 右侧编辑 icon

---

### 第 2 章：云函数改造

**文件：** `cloudfunctions/login/index.js`

**新增 action: `updateProfile`**

```
action === 'updateProfile':
  - 通过 getWXContext 获取 OPENID
  - 更新 users 集合中对应用户的 nickName 和/或 avatarUrl
  - 返回更新后的用户信息
```

**前端 store 新增：** `src/store/user.ts`
- `updateProfile(nickName?, avatarUrl?)` — 调用云函数 `login` 的 `updateProfile` action，更新本地 `userInfo`

---

### 第 3 章：退出登录数据清理

**文件：** `src/store/user.ts`、`src/pages/settings/index.vue`、各数据页面

1. **`userStore.logout()` 增强：**
   - 清空 `familyStore.families`、`familyStore.currentFamilyId`、`familyStore.currentFamilyName`、`familyStore.members`
   - `uni.removeStorageSync('currentFamilyId')`
   - `uni.removeStorageSync('currentFamilyName')`

2. **Settings 退出逻辑：** 退出确认后 `uni.reLaunch` 到首页确保状态刷新

3. **页面登录态守卫：** Home、Reminder、Memorial 等数据页面的 `onShow` 中检查 `userStore.isLoggedIn`，未登录时显示引导：
   - 空白图标 + "请先登录"文字
   - 点击跳转到个人页

---

### 第 4 章：用户信息修改

**文件：** `src/pages/profile/index.vue`

1. 已登录状态下，头像右侧显示编辑 icon（✎）
2. 点击 icon → 底部弹出修改资料面板
   - 标题："修改资料"
   - 内容：头像选择 + 昵称输入（复用授权弹窗组件结构）
   - 按钮："保存修改"
3. 保存时调用 `userStore.updateProfile(nickName, avatarUrl)`
4. 点击头像区域本身（未登录时）才触发授权，已登录时不做操作

---

## 影响范围

| 文件 | 改动类型 |
|------|----------|
| `src/pages/profile/index.vue` | 重构授权/修改逻辑 |
| `src/pages/profile/index.scss` | 新增弹窗和编辑 icon 样式 |
| `src/pages/settings/index.vue` | 修改退出跳转逻辑 |
| `src/store/user.ts` | 新增 updateProfile、增强 logout |
| `src/pages/home/index.vue` | 新增登录态守卫 |
| `src/pages/reminder/index.vue` | 新增登录态守卫 |
| `src/pages/memorial/index.vue` | 新增登录态守卫 |
| `cloudfunctions/login/index.js` | 新增 updateProfile action |

## 不涉及

- 不改变数据库集合结构（users 集合已有 nickName、avatarUrl、_openid 字段）
- 不改变家庭、植物云函数的查询逻辑（已通过 OPENID 绑定）
- 不新增云函数
- 不新增页面
