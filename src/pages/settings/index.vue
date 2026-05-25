<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/store/user';
import { callFunction } from '@/utils/cloud';

const userStore = useUserStore();
const remindTime = ref('09:00');
const remindWater = ref(true);
const remindFertilize = ref(true);
const remindOverdue = ref(true);

function initSettings() {
  const water = uni.getStorageSync('remindWater');
  const fertilize = uni.getStorageSync('remindFertilize');
  const overdue = uni.getStorageSync('remindOverdue');
  const savedTime = uni.getStorageSync('remindTime');
  if (water !== '' && water !== undefined) remindWater.value = !!water;
  if (fertilize !== '' && fertilize !== undefined) remindFertilize.value = !!fertilize;
  if (overdue !== '' && overdue !== undefined) remindOverdue.value = !!overdue;
  if (savedTime) remindTime.value = savedTime;
}

initSettings();

function onTimeChange(e: any) {
  remindTime.value = e.detail.value;
  uni.setStorageSync('remindTime', remindTime.value);
  uni.showToast({ title: '已设置' });
}

function onRemindWaterChange(e: any) {
  remindWater.value = e.detail.value;
  uni.setStorageSync('remindWater', remindWater.value);
}

function onRemindFertilizeChange(e: any) {
  remindFertilize.value = e.detail.value;
  uni.setStorageSync('remindFertilize', remindFertilize.value);
}

function onRemindOverdueChange(e: any) {
  remindOverdue.value = e.detail.value;
  uni.setStorageSync('remindOverdue', remindOverdue.value);
}

function handleClearDB() {
  uni.showModal({
    title: '危险操作',
    content: '确认要清空所有数据库数据吗？此操作不可恢复！',
    success(res1) {
      if (!res1.confirm) return;
      uni.showModal({
        title: '再次确认',
        content: '所有用户、家庭、植物、养护记录等数据将被永久删除，确认继续？',
        success(res2) {
          if (!res2.confirm) return;
          uni.showLoading({ title: '清空中...' });
          callFunction('clearDB').then((res) => {
            uni.hideLoading();
            if (res.code === 0) {
              uni.showToast({ title: '已清空' });
            } else {
              uni.showToast({ title: res.msg || '清空失败', icon: 'none' });
            }
          }).catch(() => {
            uni.hideLoading();
            uni.showToast({ title: '清空失败', icon: 'none' });
          });
        },
      });
    },
  });
}

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
</script>

<template>
  <view class="page">
    <view class="section card">
      <text class="section-title">提醒推送时间</text>
      <picker mode="time" :value="remindTime" @change="onTimeChange">
        <text class="value-text">⏰ 每天 {{ remindTime }}</text>
      </picker>
    </view>

    <view class="section card">
      <view class="switch-item">
        <view class="switch-label">
          <text>💧 浇水提醒</text>
        </view>
        <switch :checked="remindWater" @change="onRemindWaterChange" color="#07c160" />
      </view>
      <view class="switch-item">
        <view class="switch-label">
          <text>🌿 施肥提醒</text>
        </view>
        <switch :checked="remindFertilize" @change="onRemindFertilizeChange" color="#07c160" />
      </view>
      <view class="switch-item">
        <view class="switch-label">
          <text>⚠️ 逾期提醒</text>
        </view>
        <switch :checked="remindOverdue" @change="onRemindOverdueChange" color="#07c160" />
      </view>
    </view>

    <view class="section card">
      <view class="info-row">
        <text>版本</text>
        <text class="value-text">1.0.0</text>
      </view>
    </view>

    <view class="logout-section" @tap="handleLogout">
      <text class="logout-text">退出登录</text>
    </view>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
