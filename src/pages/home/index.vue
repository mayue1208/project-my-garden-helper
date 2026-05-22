<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useFamilyStore } from '@/store/family';
import { useRoomStore } from '@/store/room';
import { callFunction } from '@/utils/cloud';
import FamilySwitcher from '@/components/family-switcher/index.vue';
import PlantCard from '@/components/plant-card/index.vue';
import type { IPlant } from '@/interface';
import { useUserStore } from '@/store/user';

const familyStore = useFamilyStore();
const roomStore = useRoomStore();
const plants = ref<IPlant[]>([]);
const roomIndex = ref(0);
const loading = ref(false);
const page = ref(1);
const pageSize = 10;
const hasMore = ref(true);
const refreshing = ref(false);

interface PlantGroup {
  room: string;
  plants: IPlant[];
}

const groupedPlants = computed(() => {
  const groups: Record<string, PlantGroup> = {};

  if (roomIndex.value === 0) {
    plants.value.forEach((p) => {
      const room = roomStore.roomMap[p.roomId]?.name || '未分类';
      if (!groups[room]) groups[room] = { room, plants: [] };
      groups[room].plants.push(p);
    });
    return Object.values(groups);
  }

  const selectedRoom = roomStore.rooms[roomIndex.value - 1];
  return [
    {
      room: selectedRoom?.name || '',
      plants: plants.value.filter((p) => p.roomId === selectedRoom?._id),
    },
  ];
});

const plantCount = computed(() => plants.value.length);

const needWaterCount = computed(() => {
  return plants.value.filter((p) => {
    const water = p.recentRecords?.find((r) => r.type === 'water');
    if (!water) return true;
    const now = new Date();
    const recordDate = new Date(water.createdAt);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
    const days = Math.floor((today.getTime() - recordDay.getTime()) / 86400000);
    return days >= 7;
  }).length;
});

const userStore = useUserStore();

async function loadData(reset = false) {
  if (!userStore.isLoggedIn) return;
  if (!familyStore.currentFamilyId) return;
  if (reset) {
    page.value = 1;
    hasMore.value = true;
    plants.value = [];
    loading.value = true;
  }
  if (!hasMore.value && !reset) return;

  const plantRes = await callFunction<IPlant[]>('plant', {
    action: 'list',
    familyId: familyStore.currentFamilyId,
    page: page.value,
    pageSize,
  });
  if (plantRes.code === 0) {
    if (reset) {
      plants.value = plantRes.data!;
    } else {
      plants.value = [...plants.value, ...(plantRes.data || [])];
    }
    hasMore.value = plantRes.hasMore ?? false;
  }
  loading.value = false;
  refreshing.value = false;
}

function onRefresh() {
  refreshing.value = true;
  loadData(true).then(() => {
    refreshing.value = false;
  });
}

function onReachBottom() {
  if (!hasMore.value || loading.value) return;
  page.value++;
  loadData();
}

function onRoomChange(e: any) {
  roomIndex.value = Number(e.detail.value);
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/plant-detail/index?id=${id}` });
}

function goAdd() {
  uni.navigateTo({ url: '/pages/plant-add/index' });
}

function goToProfile() {
  uni.switchTab({ url: '/pages/profile/index' });
}

onShow(() => {
  if (userStore.isLoggedIn && familyStore.currentFamilyId) {
    loadData(true);
  }
});
onMounted(() => {
  uni.$on('familyChanged', () => loadData(true));
  uni.$on('appReady', () => loadData(true));
  if (userStore.isLoggedIn && familyStore.currentFamilyId) {
    loadData(true);
  }
});
</script>

<template>
  <view class="page">
    <view class="header-fixed">
      <family-switcher />
      <view class="filter-bar">
        <picker @change="onRoomChange" :value="roomIndex" :range="roomStore.roomOptions">
          <text class="filter-text">{{ roomStore.roomOptions[roomIndex] }} ▼</text>
        </picker>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="scroll-container"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onReachBottom"
    >
      <view v-if="!userStore.isLoggedIn" class="empty-state" @tap="goToProfile">
        <text class="empty-icon">👤</text>
        <text>请先登录</text>
        <text class="sub">点击前往个人页授权登录</text>
      </view>

      <template v-if="userStore.isLoggedIn">
        <view v-if="loading && plants.length === 0" class="loading-state">
          <text class="loading-icon">⏳</text>
          <text>加载中...</text>
        </view>

        <view v-else-if="!loading && plants.length === 0" class="empty-state">
          <text class="empty-icon">🌱</text>
          <text>还没有植物</text>
          <text class="sub">点击 + 添加第一棵吧</text>
        </view>

        <view v-for="group in groupedPlants" :key="group.room" class="room-group">
          <text class="room-title">{{ group.room }}</text>
          <view v-for="p in group.plants" :key="p._id" @tap="goDetail(p._id)">
            <plant-card :plant="p" />
          </view>
        </view>

        <view v-if="plants.length > 0" class="load-more">
          <text v-if="loading" class="load-more-text">加载中...</text>
          <text v-else-if="!hasMore" class="load-more-text">— 没有更多了 —</text>
        </view>
      </template>
    </scroll-view>

    <view class="bottom-bar">
      <text class="stat-item">{{ plantCount }}盆植物</text>
      <text class="divider">|</text>
      <text class="stat-item">今日需浇 {{ needWaterCount }}盆</text>
    </view>

    <view class="fab" @tap="goAdd">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
