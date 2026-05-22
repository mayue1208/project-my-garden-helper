<script setup lang="ts">
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
  if (loggingIn.value || !inviteCode.value) return;
  loggingIn.value = true;
  uni.showLoading({ title: '加入中...', mask: true });
  try {
    const res = await familyStore.joinFamily(inviteCode.value);
    if (res.code === 0) {
      uni.showToast({ title: '加入成功' });
      showJoinPopup.value = false;
      inviteCode.value = '';
    } else {
      uni.showToast({ title: res.msg || '加入失败', icon: 'none' });
    }
  } finally {
    uni.hideLoading();
    loggingIn.value = false;
  }
}

async function createFamily() {
  if (loggingIn.value || !newFamilyName.value) return;
  loggingIn.value = true;
  uni.showLoading({ title: '创建中...', mask: true });
  try {
    await familyStore.createFamily(newFamilyName.value);
    uni.showToast({ title: '创建成功' });
    showCreatePopup.value = false;
    newFamilyName.value = '';
  } finally {
    uni.hideLoading();
    loggingIn.value = false;
  }
}

function goSettings() {
  uni.navigateTo({ url: '/pages/settings/index' });
}

// 点击头像区域：未登录打开授权弹窗，已登录不做操作
function handleAvatarTap() {
  console.log('handleAvatarTap userStore',userStore)
  if (userStore.isLoggedIn) return;
  openAuth();
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
</script>

<template>
  <view class="page">
    <!-- 用户信息区域 -->
    <view class="user-info card">
      <view class="user-main" @tap="handleAvatarTap">
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
        <button class="dialog-confirm" :disabled="loggingIn" @tap="joinFamily">
          {{ loggingIn ? '加入中...' : '确认' }}
        </button>
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
        <button class="dialog-confirm" :disabled="loggingIn" @tap="createFamily">
          {{ loggingIn ? '创建中...' : '创建' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
