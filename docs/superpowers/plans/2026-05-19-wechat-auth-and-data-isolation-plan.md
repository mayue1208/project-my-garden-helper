# 微信授权登录与数据隔离 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为小程序增加微信授权登录流程，实现用户信息与数据绑定，退出后隔离数据。

**Architecture:** 在现有 uni-app + uniCloud 架构上做最小改动。profile 页面新增底部授权弹窗（chooseAvatar + nickname input），login 云函数新增 updateProfile action，userStore 增强 logout 清理逻辑，数据页面增加登录态守卫。

**Tech Stack:** uni-app (Vue 3 + Pinia + TypeScript), uniCloud (wx-server-sdk), 微信云数据库

---

### Task 1: 云函数 login 增加 updateProfile action

**Files:**
- Modify: `cloudfunctions/login/index.js`

- [ ] **Step 1: 在 login 云函数中新增 updateProfile 分支**

在 `exports.main` 函数的现有 action 判断中，在 `return { code: -1, msg: 'unknown action' }` 之前插入以下代码：

```js
// 更新用户资料（昵称/头像）
if (action === 'updateProfile') {
  const { nickName, avatarUrl } = event;
  const updateData = {};
  if (nickName) updateData.nickName = nickName;
  if (avatarUrl) updateData.avatarUrl = avatarUrl;
  if (Object.keys(updateData).length === 0) {
    return { code: -1, msg: '没有需要更新的字段' };
  }
  await usersCollection.where({ _openid: OPENID }).update({ data: updateData });
  const updated = await usersCollection.where({ _openid: OPENID }).get();
  return { code: 0, data: updated.data[0] };
}
```

- [ ] **Step 2: 验证云函数逻辑**

检查点：
- `updateProfile` action 仅接受 `nickName` 和 `avatarUrl` 参数
- 通过 `OPENID` 定位用户，不通过前端传入的 userId
- 无字段更新时返回错误码 -1
- 更新成功后返回最新的用户信息

---

### Task 2: userStore 增强

**Files:**
- Modify: `src/store/user.ts`

- [ ] **Step 1: 新增 updateProfile action**

在 `userStore` 的 `actions` 中，`logout()` 之前插入：

```ts
async updateProfile(nickName?: string, avatarUrl?: string) {
  const res = await callFunction<UserInfo>('login', {
    action: 'updateProfile',
    nickName,
    avatarUrl,
  });
  if (res.code === 0 && res.data) {
    this.userInfo = res.data;
  }
  return res;
},
```

- [ ] **Step 2: 增强 logout action，引入 familyStore 并清除所有状态**

将现有的 `logout()` 方法替换为：

```ts
logout() {
  this.userInfo = null;
  this.isLoggedIn = false;
  this.ready = false;
  // 清除家庭状态
  const { useFamilyStore } = require('@/store/family');
  const familyStore = useFamilyStore();
  familyStore.$reset();
  uni.removeStorageSync('currentFamilyId');
  uni.removeStorageSync('currentFamilyName');
},
```

用 `$reset()` 将 familyStore 恢复到初始状态，同时清除本地存储。

- [ ] **Step 3: 验证 store 逻辑**

检查点：
- `updateProfile` 调用云函数 `login` 并传 `action: 'updateProfile'`
- `updateProfile` 成功后更新本地 `userInfo`
- `logout` 清空 userStore、familyStore（通过 $reset）、本地存储

---

### Task 3: Profile 页面改造 - 脚本逻辑

**Files:**
- Modify: `src/pages/profile/index.vue`

- [ ] **Step 1: 替换 script 部分，新增授权弹窗和编辑弹窗逻辑**

将 `<script setup>` 内容替换为以下完整代码：

```ts
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useFamilyStore } from '@/store/family';
import { useUserStore } from '@/store/user';
import { callFunction } from '@/utils/cloud';
import type { IMemorial } from '@/interface';

const familyStore = useFamilyStore();
const userStore = useUserStore();
const stats = ref({ total: 0, survived: 0, lost: 0 });
const inviteCode = ref('');
const newFamilyName = ref('');
const showJoinPopup = ref(false);
const showCreatePopup = ref(false);

// 授权/修改弹窗状态
const showAuthPopup = ref(false);
const showEditPopup = ref(false);
const tempAvatar = ref('');
const tempNickName = ref('');
const loggingIn = ref(false);

async function loadStats() {
  if (!familyStore.currentFamilyId) return;
  const res = await callFunction<IMemorial[]>('memorial', {
    action: 'list',
    familyId: familyStore.currentFamilyId,
  });
  if (res.code === 0 && res.stats) stats.value = res.stats;
}

function goFamilyManage(familyId: string) {
  uni.navigateTo({ url: `/pages/family-manage/index?familyId=${familyId}` });
}

function showJoin() {
  showJoinPopup.value = true;
}

function showCreate() {
  showCreatePopup.value = true;
}

async function joinFamily() {
  if (!inviteCode.value) return;
  const res = await familyStore.joinFamily(inviteCode.value);
  if (res.code === 0) {
    uni.showToast({ title: '加入成功' });
    showJoinPopup.value = false;
    inviteCode.value = '';
  } else {
    uni.showToast({ title: res.msg || '加入失败', icon: 'none' });
  }
}

async function createFamily() {
  if (!newFamilyName.value) return;
  await familyStore.createFamily(newFamilyName.value);
  uni.showToast({ title: '创建成功' });
  showCreatePopup.value = false;
  newFamilyName.value = '';
}

function goSettings() {
  uni.navigateTo({ url: '/pages/settings/index' });
}

// 未登录：点击头像 → 打开授权弹窗
function openAuth() {
  tempAvatar.value = '';
  tempNickName.value = '';
  showAuthPopup.value = true;
}

// 已登录：点击编辑 icon → 打开修改弹窗
function openEdit() {
  tempAvatar.value = userStore.userInfo?.avatarUrl || '';
  tempNickName.value = userStore.userInfo?.nickName || '';
  showEditPopup.value = true;
}

// 选择头像回调
function onChooseAvatar(e: any) {
  tempAvatar.value = e.detail.avatarUrl;
}

// 昵称输入回调
function onNickInput(e: any) {
  tempNickName.value = e.detail.value;
}

// 确认授权登录
async function confirmAuth() {
  if (loggingIn.value) return;
  loggingIn.value = true;
  uni.showLoading({ title: '登录中...' });
  try {
    await uni.login({ provider: 'weixin' });
    const res = await userStore.login(tempNickName.value, tempAvatar.value);
    uni.hideLoading();
    if (res.code === 0) {
      uni.showToast({ title: '登录成功' });
      showAuthPopup.value = false;
      await familyStore.loadFamilies();
      await loadStats();
    } else {
      uni.showToast({ title: res.msg || '登录失败', icon: 'none' });
    }
  } catch (_e) {
    uni.hideLoading();
    uni.showToast({ title: '登录失败，请重试', icon: 'none' });
  }
  loggingIn.value = false;
}

// 确认修改资料
async function confirmEdit() {
  if (loggingIn.value) return;
  loggingIn.value = true;
  uni.showLoading({ title: '保存中...' });
  try {
    const res = await userStore.updateProfile(tempNickName.value, tempAvatar.value);
    uni.hideLoading();
    if (res.code === 0) {
      uni.showToast({ title: '修改成功' });
      showEditPopup.value = false;
    } else {
      uni.showToast({ title: res.msg || '修改失败', icon: 'none' });
    }
  } catch (_e) {
    uni.hideLoading();
    uni.showToast({ title: '修改失败，请重试', icon: 'none' });
  }
  loggingIn.value = false;
}

onShow(async () => {
  await userStore.checkLogin();
  await familyStore.loadFamilies();
  await loadStats();
});
```

- [ ] **Step 2: 验证脚本逻辑**

检查点：
- `openAuth` 重置临时变量并打开授权弹窗，仅在未登录时调用
- `openEdit` 用当前用户信息填充临时变量并打开编辑弹窗，仅在已登录时调用
- `confirmAuth` 调用 `uni.login` → `userStore.login` → 加载家庭列表和统计
- `confirmEdit` 调用 `userStore.updateProfile` → 刷新 UI
- `loggingIn` 防止重复提交

---

### Task 4: Profile 页面改造 - 模板和样式

**Files:**
- Modify: `src/pages/profile/index.vue`（template 部分）
- Modify: `src/pages/profile/index.scss`

- [ ] **Step 1: 替换 template 中的用户信息区域和新增弹窗**

将 `<template>` 内容替换为以下完整代码：

```html
<template>
  <view class="page">
    <!-- 用户信息区域 -->
    <view class="user-info card">
      <view class="user-main" @tap="userStore.isLoggedIn ? null : openAuth()">
        <image
          v-if="userStore.isLoggedIn && userStore.userInfo?.avatarUrl"
          :src="userStore.userInfo.avatarUrl"
          class="avatar"
          mode="aspectFill"
        />
        <view v-else class="avatar avatar-placeholder">
          <text class="avatar-placeholder-text">?</text>
        </view>
        <text class="nickname">
          {{ userStore.isLoggedIn ? (userStore.userInfo?.nickName || '微信用户') : '点击登录' }}
        </text>
      </view>
      <text v-if="userStore.isLoggedIn" class="edit-icon" @tap="openEdit">✎</text>
    </view>

    <!-- 家庭区域（已登录才显示） -->
    <template v-if="userStore.isLoggedIn">
      <view class="section card">
        <text class="section-title">我的家庭</text>
        <view
          v-for="f in familyStore.families"
          :key="f._id"
          class="family-card"
          :class="{ active: f._id === familyStore.currentFamilyId }"
          @tap="goFamilyManage(f._id)"
        >
          <view class="family-info">
            <text class="family-name">{{ f.name }}</text>
            <text class="family-role">{{
              f.role === 'admin' ? '管理员' : '成员'
            }}</text>
          </view>
          <text class="arrow">›</text>
        </view>

        <view class="action-row">
          <text class="action-link" @tap="showJoin">加入家庭</text>
          <text class="action-link" @tap="showCreate">创建家庭</text>
        </view>
      </view>

      <view class="section card">
        <text class="section-title">植物统计</text>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="num">{{ stats.total }}</text>
            <text class="stat-label">总植物</text>
          </view>
          <view class="stat-item">
            <text class="num">{{ stats.survived }}</text>
            <text class="stat-label">存活</text>
          </view>
          <view class="stat-item">
            <text class="num">{{ stats.lost }}</text>
            <text class="stat-label">失去</text>
          </view>
        </view>
      </view>
    </template>

    <view class="section card">
      <view class="menu-item" @tap="goSettings">
        <text>设置</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 授权登录弹窗 -->
    <view v-if="showAuthPopup" class="overlay" @tap="showAuthPopup = false" />
    <view v-if="showAuthPopup" class="sheet-panel">
      <text class="sheet-title">微信授权登录</text>
      <view class="sheet-body">
        <button class="avatar-picker-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image
            v-if="tempAvatar"
            :src="tempAvatar"
            class="avatar-preview"
            mode="aspectFill"
          />
          <view v-else class="avatar-preview avatar-placeholder-sm">
            <text class="placeholder-sm-text">点击选择头像</text>
          </view>
        </button>
        <input
          type="nickname"
          :value="tempNickName"
          class="nickname-input"
          placeholder="请输入昵称"
          @blur="onNickInput"
        />
      </view>
      <view class="sheet-actions">
        <button class="sheet-cancel" @tap="showAuthPopup = false">取消</button>
        <button class="sheet-confirm" @tap="confirmAuth" :disabled="loggingIn">
          {{ loggingIn ? '登录中...' : '确认授权' }}
        </button>
      </view>
    </view>

    <!-- 修改资料弹窗 -->
    <view v-if="showEditPopup" class="overlay" @tap="showEditPopup = false" />
    <view v-if="showEditPopup" class="sheet-panel">
      <text class="sheet-title">修改资料</text>
      <view class="sheet-body">
        <button class="avatar-picker-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image
            v-if="tempAvatar"
            :src="tempAvatar"
            class="avatar-preview"
            mode="aspectFill"
          />
          <view v-else class="avatar-preview avatar-placeholder-sm">
            <text class="placeholder-sm-text">点击更换头像</text>
          </view>
        </button>
        <input
          type="nickname"
          :value="tempNickName"
          class="nickname-input"
          placeholder="请输入昵称"
          @blur="onNickInput"
        />
      </view>
      <view class="sheet-actions">
        <button class="sheet-cancel" @tap="showEditPopup = false">取消</button>
        <button class="sheet-confirm" @tap="confirmEdit" :disabled="loggingIn">
          {{ loggingIn ? '保存中...' : '保存修改' }}
        </button>
      </view>
    </view>

    <!-- 加入家庭弹窗 -->
    <view v-if="showJoinPopup" class="overlay" @tap="showJoinPopup = false" />
    <view v-if="showJoinPopup" class="dialog-panel">
      <text class="dialog-title">加入家庭</text>
      <input
        v-model="inviteCode"
        placeholder="输入6位邀请码"
        class="dialog-input"
        maxlength="6"
      />
      <view class="dialog-actions">
        <button class="dialog-cancel" @tap="showJoinPopup = false">取消</button>
        <button class="dialog-confirm" @tap="joinFamily">确认</button>
      </view>
    </view>

    <!-- 创建家庭弹窗 -->
    <view v-if="showCreatePopup" class="overlay" @tap="showCreatePopup = false" />
    <view v-if="showCreatePopup" class="dialog-panel">
      <text class="dialog-title">创建家庭</text>
      <input
        v-model="newFamilyName"
        placeholder="输入家庭名称"
        class="dialog-input"
        maxlength="20"
      />
      <view class="dialog-actions">
        <button class="dialog-cancel" @tap="showCreatePopup = false">取消</button>
        <button class="dialog-confirm" @tap="createFamily">创建</button>
      </view>
    </view>
  </view>
</template>
```

- [ ] **Step 2: 更新样式文件**

将 `src/pages/profile/index.scss` 替换为以下完整内容：

```scss
@import '@/styles/variables.scss';

.page {
  padding: $spacing-lg;
  padding-bottom: 100rpx;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-2xl;
  margin-bottom: $spacing-md;
}

.user-main {
  display: flex;
  align-items: center;
  flex: 1;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: $radius-circle;
  flex-shrink: 0;
}

.avatar-placeholder {
  background: $green-pale;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder-text {
  font-size: $font-3xl;
  color: $green;
}

.nickname {
  font-size: $font-2xl;
  font-weight: bold;
  margin-left: $spacing-2xl;
  color: $text-primary;
}

.edit-icon {
  font-size: 40rpx;
  color: $text-secondary;
  padding: $spacing-sm;
  flex-shrink: 0;
}

.section {
  padding: $spacing-xl;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-base;
  font-weight: bold;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-md;
}

.family-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xl;
  border-radius: $radius-md;
  margin-bottom: $spacing-sm;
  background: $green-pale;

  &.active {
    border: 2rpx solid $green;
  }
}

.family-info {
  display: flex;
  align-items: center;
}

.family-name {
  font-size: $font-lg;
  color: $text-primary;
}

.family-role {
  font-size: $font-sm;
  color: $text-secondary;
  margin-left: $spacing-md;
}

.arrow {
  font-size: $font-2xl;
  color: $text-hint;
}

.action-row {
  display: flex;
  gap: $spacing-2xl;
  padding-top: $spacing-md;
}

.action-link {
  color: $green;
  font-size: $font-base;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.num {
  font-size: $font-3xl;
  font-weight: bold;
  color: $green;
  display: block;
}

.stat-label {
  font-size: $font-sm;
  color: $text-secondary;
  margin-top: $spacing-xs;
  display: block;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xl 0;
  font-size: $font-base;
  color: $text-primary;
}

// Overlay 遮罩
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $bg-overlay;
  z-index: 99;
}

// Dialog（原有居中弹窗）
.dialog-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 560rpx;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-2xl;
  z-index: 100;
}

.dialog-title {
  font-size: $font-xl;
  font-weight: bold;
  display: block;
  text-align: center;
  margin-bottom: $spacing-xl;
  color: $text-primary;
}

.dialog-input {
  border: 1rpx solid $border-color;
  padding: $spacing-md;
  border-radius: $radius-sm;
  font-size: $font-base;
  margin-bottom: $spacing-xl;
  width: 100%;
  box-sizing: border-box;
}

.dialog-actions {
  display: flex;
  gap: $spacing-lg;
}

.dialog-cancel,
.dialog-confirm {
  flex: 1;
  border-radius: $radius-round;
  font-size: $font-base;
}

.dialog-cancel {
  background: $bg-tag;
  color: $text-secondary;
  border: none;
}

.dialog-confirm {
  background: $green;
  color: $text-white;
  border: none;
}

// 底部弹窗面板（授权/修改资料）
.sheet-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $bg-card;
  border-radius: $radius-lg $radius-lg 0 0;
  padding: $spacing-2xl;
  z-index: 100;
}

.sheet-title {
  font-size: $font-lg;
  font-weight: bold;
  display: block;
  text-align: center;
  margin-bottom: $spacing-xl;
  color: $text-primary;
}

.sheet-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: $spacing-xl;
}

.avatar-picker-btn {
  background: none;
  border: none;
  padding: 0;
  margin-bottom: $spacing-xl;
  line-height: 1;

  &::after {
    border: none;
  }
}

.avatar-preview {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-circle;
}

.avatar-placeholder-sm {
  width: 140rpx;
  height: 140rpx;
  border-radius: $radius-circle;
  background: $green-pale;
  border: 2rpx dashed $green;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-sm-text {
  font-size: $font-xs;
  color: $green;
  text-align: center;
}

.nickname-input {
  width: 400rpx;
  text-align: center;
  border-bottom: 2rpx solid $border-color;
  padding: $spacing-md 0;
  font-size: $font-lg;
  color: $text-primary;
}

.sheet-actions {
  display: flex;
  gap: $spacing-lg;
}

.sheet-cancel,
.sheet-confirm {
  flex: 1;
  border-radius: $radius-round;
  font-size: $font-base;
}

.sheet-cancel {
  background: $bg-tag;
  color: $text-secondary;
  border: none;
}

.sheet-confirm {
  background: $green;
  color: $text-white;
  border: none;

  &[disabled] {
    opacity: 0.6;
  }
}
```

- [ ] **Step 3: 验证 UI**

在微信开发者工具中预览，确认：
- 未登录时：头像区域显示占位头像 + "点击登录"
- 点击头像区域：底部弹出授权面板，标题"微信授权登录"
- 面板内包含头像选择按钮和昵称输入框
- 已登录时：显示真实头像 + 昵称 + 右侧编辑 icon ✎
- 点击编辑 icon：底部弹出修改资料面板，标题"修改资料"
- 家庭和植物统计区域仅在已登录时显示

---

### Task 5: Settings 退出逻辑修改

**Files:**
- Modify: `src/pages/settings/index.vue`

- [ ] **Step 1: 修改退出确认回调，增加页面跳转**

在 `handleLogout` 函数中，将 `setTimeout(() => uni.navigateBack(), 1500)` 替换为：

```ts
function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success(res) {
      if (res.confirm) {
        userStore.logout();
        uni.showToast({ title: '已退出' });
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/home/index' });
        }, 1000);
      }
    },
  });
}
```

改动点：`uni.navigateBack()` → `uni.reLaunch({ url: '/pages/home/index' })`，确保退出后跳转到首页时完全刷新 Tab 页面状态。

- [ ] **Step 2: 验证退出行为**

检查点：
- 退出后清除 userStore、familyStore、本地存储
- 退出后自动跳转到首页，首页显示"请先登录"引导（Task 6 完成后）
- 再次进入个人页时显示未登录状态

---

### Task 6: Home 页面登录态守卫

**Files:**
- Modify: `src/pages/home/index.vue`

- [ ] **Step 1: 引入 userStore 并增加登录态检查**

在 `<script setup>` 中，在现有 import 后追加：

```ts
import { useUserStore } from '@/store/user';
```

在 `loadData` 函数开头增加登录态检查：

```ts
const userStore = useUserStore();

async function loadData() {
  if (!userStore.isLoggedIn) return;
  if (!familyStore.currentFamilyId) return;
  const [plantRes, roomRes] = await Promise.all([
    callFunction<IPlant[]>('plant', {
      action: 'list',
      familyId: familyStore.currentFamilyId,
    }),
    callFunction<IRoom[]>('room', {
      action: 'list',
      familyId: familyStore.currentFamilyId,
    }),
  ]);
  if (plantRes.code === 0) plants.value = plantRes.data!;
  if (roomRes.code === 0) rooms.value = roomRes.data!;
}
```

- [ ] **Step 2: 在模板中增加未登录引导状态**

在 `<template>` 中，在 `<family-switcher />` 之后、其他内容之前插入：

```html
<view v-if="!userStore.isLoggedIn" class="empty-state" @tap="goToProfile">
  <text class="empty-icon">👤</text>
  <text>请先登录</text>
  <text class="sub">点击前往个人页授权登录</text>
</view>
```

并用 `<template v-if="userStore.isLoggedIn">` 包裹原有的已登录内容区域（filter-bar、empty-state、room-group、bottom-bar、fab）。

- [ ] **Step 3: 新增 goToProfile 方法**

在脚本中新增：

```ts
function goToProfile() {
  uni.switchTab({ url: '/pages/profile/index' });
}
```

- [ ] **Step 4: 验证登录态守卫**

在微信开发者工具中验证：
- 退出登录后进入首页 → 显示"请先登录"引导
- 点击引导 → 跳转到个人页
- 授权登录后返回首页 → 正常加载植物数据
- 切换家庭功能正常

---

### Task 7: Reminder 页面登录态守卫

**Files:**
- Modify: `src/pages/reminder/index.vue`

- [ ] **Step 1: 引入 userStore 并增加登录态检查**

在 `<script setup>` 中的 import 后追加：

```ts
import { useUserStore } from '@/store/user';
```

在 `loadReminders` 函数开头增加：

```ts
const userStore = useUserStore();

async function loadReminders() {
  if (!userStore.isLoggedIn) return;
  // ... 原有逻辑不变
}
```

- [ ] **Step 2: 在模板中增加未登录引导**

在 `<family-switcher />` 之后插入：

```html
<view v-if="!userStore.isLoggedIn" class="empty-state" @tap="goToProfile">
  <text class="empty-icon">👤</text>
  <text>请先登录</text>
  <text class="sub">点击前往个人页授权登录</text>
</view>
```

并用 `<template v-if="userStore.isLoggedIn">` 包裹原有的 filter-bar、empty-state、date-group、fab 等内容。

- [ ] **Step 3: 新增 goToProfile 方法**

```ts
function goToProfile() {
  uni.switchTab({ url: '/pages/profile/index' });
}
```

- [ ] **Step 4: 验证**

确认退出后提醒页面显示"请先登录"引导，登录后正常显示提醒列表。

---

### Task 8: Memorial 页面登录态守卫

**Files:**
- Modify: `src/pages/memorial/index.vue`

- [ ] **Step 1: 引入 userStore 并增加登录态检查**

在 `<script setup>` 中的 import 后追加：

```ts
import { useUserStore } from '@/store/user';
```

在 `loadData` 函数开头增加：

```ts
const userStore = useUserStore();

async function loadData() {
  if (!userStore.isLoggedIn) return;
  // ... 原有逻辑不变
}
```

- [ ] **Step 2: 在模板中增加未登录引导**

在 `<family-switcher />` 之后插入：

```html
<view v-if="!userStore.isLoggedIn" class="empty-state" @tap="goToProfile">
  <text class="empty-icon">👤</text>
  <text>请先登录</text>
  <text class="sub">点击前往个人页授权登录</text>
</view>
```

并用 `<template v-if="userStore.isLoggedIn">` 包裹原有的 stats-bar、empty-state、section、fab 等内容。

- [ ] **Step 3: 新增 goToProfile 方法**

```ts
function goToProfile() {
  uni.switchTab({ url: '/pages/profile/index' });
}
```

- [ ] **Step 4: 验证**

确认退出后纪念页面显示"请先登录"引导，登录后正常显示纪念列表。
```

---

## 验证清单

全部任务完成后，在微信开发者工具中端到端验证：

1. 冷启动 → 个人页显示"点击登录"
2. 点击头像 → 底部弹窗 → 选择头像、输入昵称 → 确认授权 → 登录成功
3. 登录后 → 头像和昵称正确显示，编辑 icon 可见
4. 点击编辑 icon → 修改资料弹窗 → 更换头像/昵称 → 保存成功
5. 首页、提醒页、纪念页 → 正常展示数据
6. 设置页 → 退出登录 → 自动跳转首页 → 显示"请先登录"引导
7. 退出后 → 三个数据页面均显示"请先登录"引导
8. 退出后 → 个人页恢复未登录状态
