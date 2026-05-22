# 家庭管理页：房间管理 + 家庭筛选 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 家庭管理页增加 Tab 家庭切换、房间管理区域，修复 isAdmin 判断，支持管理员修改家庭名。

**Architecture:** 页面顶部新增横向 Tab 栏切换家庭，所有区域数据跟随选中家庭刷新。房间管理区域复用已有 room 云函数 CRUD。云函数 family 新增 rename action。前端使用本地 `activeFamilyId` 状态管理当前选中家庭。

**Tech Stack:** uni-app (Vue 3 + Pinia + TypeScript), uniCloud (wx-server-sdk)

---

### Task 1: family 云函数新增 rename action

**Files:**
- Modify: `cloudfunctions/family/index.js`

- [ ] **Step 1: 在 family 云函数中新增 rename 分支**

在 `return { code: -1, msg: 'unknown action' }` 之前插入：

```js
// 修改家庭名（仅管理员）
if (action === 'rename') {
  const member = await db
    .collection('family_members')
    .where({ familyId, userId: OPENID, role: 'admin' })
    .get();
  if (member.data.length === 0) return { code: 2, msg: '无权限' };
  await db.collection('families').doc(familyId).update({ data: { name } });
  return { code: 0 };
}
```

验证点：
- 仅 `family_members` 中 role 为 admin 的用户可修改
- 更新 `families` 集合中的 `name` 字段

---

### Task 2: family-manage 页面脚本重构

**Files:**
- Modify: `src/pages/family-manage/index.vue` (script 部分)

- [ ] **Step 1: 替换 script setup 内容**

将 `<script setup>` 完整替换为：

```ts
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { formatDateTime } from '@/utils/date';
import { CARE_TYPE_LABEL } from '@/utils/constants';
import type { IFamily, IFamilyMember, IRoom } from '@/interface';

const familyStore = useFamilyStore();
const activeFamilyId = ref('');
const family = ref<IFamily | null>(null);
const members = ref<IFamilyMember[]>([]);
const rooms = ref<IRoom[]>([]);
const recentOps = ref<any[]>([]);

const isAdmin = computed(() => family.value?.role === 'admin');

const families = computed(() => familyStore.families);

async function loadAllData(familyId: string) {
  family.value = families.value.find((f) => f._id === familyId) || null;
  if (!familyId) return;

  const [memberRes, opsRes, roomRes] = await Promise.all([
    callFunction<IFamilyMember[]>('family', { action: 'members', familyId }),
    callFunction<any[]>('family', { action: 'recentOps', familyId }),
    callFunction<IRoom[]>('room', { action: 'list', familyId }),
  ]);
  if (memberRes.code === 0) members.value = memberRes.data!;
  if (opsRes.code === 0) recentOps.value = opsRes.data!;
  if (roomRes.code === 0) rooms.value = roomRes.data!;
}

function switchFamily(id: string) {
  activeFamilyId.value = id;
  loadAllData(id);
}

async function renameFamily() {
  if (!isAdmin.value || !family.value) return;
  uni.showModal({
    title: '修改家庭名',
    editable: true,
    content: family.value.name,
    success: async ({ confirm, content }) => {
      if (confirm && content) {
        const res = await callFunction('family', {
          action: 'rename',
          familyId: activeFamilyId.value,
          name: content,
        });
        if (res.code === 0) {
          uni.showToast({ title: '已修改' });
          await familyStore.loadFamilies();
          family.value = families.value.find((f) => f._id === activeFamilyId.value) || null;
        } else {
          uni.showToast({ title: res.msg || '修改失败', icon: 'none' });
        }
      }
    },
  });
}

function copyCode() {
  if (!family.value) return;
  uni.setClipboardData({ data: family.value.inviteCode });
  uni.showToast({ title: '已复制' });
}

// 房间管理
async function addRoom() {
  uni.showModal({
    title: '添加房间',
    editable: true,
    content: '',
    placeholderText: '输入房间名称',
    success: async ({ confirm, content }) => {
      if (confirm && content) {
        await callFunction('room', {
          action: 'create',
          familyId: activeFamilyId.value,
          name: content,
          sortOrder: rooms.value.length,
        });
        uni.showToast({ title: '已添加' });
        const res = await callFunction<IRoom[]>('room', { action: 'list', familyId: activeFamilyId.value });
        if (res.code === 0) rooms.value = res.data!;
      }
    },
  });
}

async function deleteRoom(room: IRoom) {
  uni.showModal({
    title: '确认删除',
    content: `删除房间「${room.name}」，该房间的植物将移至未分类`,
    success: async ({ confirm }) => {
      if (confirm) {
        await callFunction('room', { action: 'delete', roomId: room._id });
        uni.showToast({ title: '已删除' });
        const res = await callFunction<IRoom[]>('room', { action: 'list', familyId: activeFamilyId.value });
        if (res.code === 0) rooms.value = res.data!;
      }
    },
  });
}

function goMemberDetail(userId: string) {
  uni.navigateTo({
    url: `/pages/member-detail/index?familyId=${activeFamilyId.value}&userId=${userId}`,
  });
}

onLoad((options: any) => {
  const fid = options?.familyId || familyStore.currentFamilyId;
  activeFamilyId.value = fid;
  loadAllData(fid);
});

onShow(async () => {
  await familyStore.loadFamilies();
  // 刷新当前选中家庭在列表中的最新数据
  family.value = families.value.find((f) => f._id === activeFamilyId.value) || null;
  if (activeFamilyId.value) loadAllData(activeFamilyId.value);
});
```

---

### Task 3: family-manage 页面模板重构

**Files:**
- Modify: `src/pages/family-manage/index.vue` (template 部分)

- [ ] **Step 1: 替换 template 内容**

将 `<template>` 完整替换为：

```html
<template>
  <view class="page">
    <!-- 家庭 Tab 切换栏 -->
    <scroll-view v-if="families.length > 1" scroll-x class="family-tabs">
      <view
        v-for="f in families"
        :key="f._id"
        class="tab-item"
        :class="{ active: f._id === activeFamilyId }"
        @tap="switchFamily(f._id)"
      >
        <text class="tab-text">{{ f.name }}</text>
      </view>
    </scroll-view>

    <!-- 家庭信息 -->
    <view class="section card">
      <view class="field">
        <text class="label">家庭名</text>
        <text class="value">{{ family?.name }}</text>
        <text v-if="isAdmin" class="edit-link" @tap="renameFamily">修改</text>
      </view>
      <view class="field">
        <text class="label">邀请码</text>
        <text class="value">{{ family?.inviteCode }}</text>
        <text class="edit-link" @tap="copyCode">复制</text>
      </view>
    </view>

    <!-- 家人 -->
    <view class="section card">
      <text class="section-title">家人 ({{ members.length }})</text>
      <view v-for="m in members" :key="m._id" class="member-item">
        <view class="member-avatar-circle">
          <text class="avatar-text">{{ m.userInfo?.nickName?.[0] || '?' }}</text>
        </view>
        <view class="member-info">
          <text class="member-name">{{ m.userInfo?.nickName || '未知' }}</text>
          <text class="member-role">{{ m.role === 'admin' ? '管理员' : '成员' }}</text>
        </view>
        <text class="view-link" @tap="goMemberDetail(m.userId)">查看→</text>
      </view>
      <view v-if="members.length === 0" class="empty-hint">
        暂无成员
      </view>
    </view>

    <!-- 房间管理 -->
    <view class="section card">
      <text class="section-title">房间管理 ({{ rooms.length }})</text>
      <view v-for="room in rooms" :key="room._id" class="room-item">
        <view class="room-info">
          <text class="room-icon">🏠</text>
          <text class="room-name">{{ room.name }}</text>
          <text v-if="room.isDefault" class="default-tag">默认</text>
        </view>
        <text
          v-if="!room.isDefault"
          class="delete-link"
          @tap="deleteRoom(room)"
        >删除</text>
      </view>
      <view v-if="rooms.length === 0" class="empty-hint">
        暂无房间
      </view>
      <view class="add-room-btn" @tap="addRoom">
        <text>+ 添加房间</text>
      </view>
    </view>

    <!-- 最近操作 -->
    <view class="section card">
      <text class="section-title">最近操作</text>
      <view v-for="op in recentOps" :key="op._id" class="op-item">
        <text class="op-user">{{ op.userInfo?.nickName || '未知' }}</text>
        <text class="op-time">· {{ formatDateTime(op.createdAt) }}</text>
        <text class="op-type">· {{ CARE_TYPE_LABEL[op.type] || op.type }}</text>
        <text class="view-link" @tap="goMemberDetail(op.recordedBy)">[查看→]</text>
      </view>
      <view v-if="recentOps.length === 0" class="empty-hint">
        暂无操作记录
      </view>
    </view>
  </view>
</template>
```

---

### Task 4: family-manage 样式更新

**Files:**
- Modify: `src/pages/family-manage/index.scss`

- [ ] **Step 1: 在现有样式末尾追加新样式**

在文件末尾追加以下内容：

```scss
// 家庭 Tab 切换栏
.family-tabs {
  white-space: nowrap;
  margin-bottom: $spacing-md;
  padding: 0 $spacing-lg;
}

.tab-item {
  display: inline-block;
  padding: $spacing-md $spacing-xl;
  margin-right: $spacing-md;
  border-radius: $radius-round;
  background: $bg-card;

  &.active {
    background: $green-bg;

    .tab-text {
      color: $green-deep;
      font-weight: bold;
    }
  }
}

.tab-text {
  font-size: $font-md;
  color: $text-secondary;
}

// 房间管理
.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md 0;
  border-bottom: 1rpx solid $border-light;

  &:last-of-type {
    border-bottom: none;
  }
}

.room-info {
  display: flex;
  align-items: center;
}

.room-icon {
  margin-right: $spacing-sm;
}

.room-name {
  font-size: $font-base;
  color: $text-primary;
}

.default-tag {
  font-size: $font-xs;
  color: $text-secondary;
  background: $green-bg;
  padding: 2rpx $spacing-sm;
  border-radius: $radius-round;
  margin-left: $spacing-sm;
}

.delete-link {
  font-size: $font-md;
  color: $red;
}

.add-room-btn {
  margin-top: $spacing-md;
  padding: $spacing-md;
  text-align: center;
  border: 2rpx dashed $green;
  border-radius: $radius-md;
  color: $green;
  font-size: $font-md;
}
```

---

## 验证清单

1. 进入家庭管理页 → 顶部 Tab 栏显示所有家庭，当前家庭高亮
2. Tab 切换 → 家人、房间、最近操作全部切换
3. 管理员可见家庭名旁"修改"链接 → 点击弹窗 → 输入新名 → 保存成功
4. 非管理员不显示"修改"链接
5. 房间列表展示，默认房间有「默认」标签且无删除按钮
6. 添加房间 → 弹窗输入 → 列表刷新
7. 删除房间 → 确认 → 列表刷新
8. 切换家庭后房间列表跟随变化
