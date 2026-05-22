<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { formatDate, formatDateTime } from '@/utils/date';
import { CARE_TYPE_LABEL, CARE_TYPE_ICON, EVENT_TYPE_LABEL, CARE_TYPES } from '@/utils/constants';
import type { IPlant, IRoom, ICareConfig, ICareRecord, IGrowthEvent } from '@/interface';

const familyStore = useFamilyStore();
const plantId = ref('');
const plant = ref<IPlant>({} as IPlant);
const configs = ref<ICareConfig[]>([]);
const rooms = ref<IRoom[]>([]);
const recentRecords = ref<ICareRecord[]>([]);
const recentEvents = ref<IGrowthEvent[]>([]);

const roomName = computed(() => {
  const room = rooms.value.find((r) => r._id === plant.value.roomId);
  return room?.name || '未分类';
});

async function loadData() {
  const [plantRes, configRes, recordRes, eventRes, roomRes] = await Promise.all([
    callFunction<IPlant>('plant', { action: 'get', plantId: plantId.value }),
    callFunction<ICareConfig[]>('care', { action: 'getConfigs', plantId: plantId.value }),
    callFunction<ICareRecord[]>('care', { action: 'records', plantId: plantId.value, limit: 1 }),
    callFunction<IGrowthEvent[]>('event', { action: 'list', plantId: plantId.value, limit: 3 }),
    callFunction<IRoom[]>('room', { action: 'list', familyId: familyStore.currentFamilyId }),
  ]);
  if (plantRes.code === 0) plant.value = plantRes.data!;
  if (configRes.code === 0) configs.value = configRes.data!.filter((c) => CARE_TYPES.includes(c.type as any));
  if (recordRes.code === 0) recentRecords.value = recordRes.data!;
  if (eventRes.code === 0) recentEvents.value = eventRes.data!.slice(0, 3);
  if (roomRes.code === 0) rooms.value = roomRes.data!;
}

function toggleConfig(configId: string, e: any) {
  callFunction('care', { action: 'toggleConfig', configId, enabled: e.detail.value });
}

function goTimeline(mode: 'care' | 'event' = 'event') {
  uni.navigateTo({ url: `/pages/timeline/index?plantId=${plantId.value}&mode=${mode}` });
}

function goEdit() {
  uni.navigateTo({ url: `/pages/plant-add/index?id=${plantId.value}` });
}

function moveToMemorial() {
  uni.navigateTo({ url: `/pages/memorial-add/index?plantId=${plantId.value}` });
}

onLoad((opt) => {
  plantId.value = opt!.id as string;
  loadData();
});
</script>

<template>
  <view class="page">
    <!-- 植物信息 -->
    <view class="header card">
      <image v-if="plant.photo" :src="plant.photo" class="cover" mode="aspectFill" />
      <view v-else class="cover placeholder">🌱</view>
      <view class="info">
        <text class="name">{{ plant.nickname || plant.name }}</text>
        <text class="species">{{ plant.species }}</text>
        <text class="meta">📍 {{ roomName }}</text>
        <text class="meta">📅 购入：{{ plant.purchaseDate || '未知' }}</text>
      </view>
    </view>

    <!-- 养护周期 -->
    <view class="section card">
      <text class="section-title">养护周期</text>
      <view v-for="cfg in configs" :key="cfg._id" class="config-item">
        <view class="config-header">
          <text>{{ CARE_TYPE_ICON[cfg.type] }} {{ CARE_TYPE_LABEL[cfg.type] }}</text>
          <switch :checked="cfg.enabled" @change="toggleConfig(cfg._id, $event)" color="#07c160" />
        </view>
        <view class="config-detail">
          每 {{ cfg.intervalDays }} 天
        </view>
        <text class="last-time">
          上次：{{ cfg.lastTime ? formatDate(cfg.lastTime) : '暂无' }}
        </text>
      </view>
      <view v-if="configs.length === 0" class="empty-hint">暂无养护周期设置</view>
    </view>

    <!-- 最近养护 -->
    <view class="section card">
      <view class="section-header">
        <text class="section-title">最近养护</text>
        <text class="section-more" @tap="goTimeline('care')">全部记录 →</text>
      </view>
      <view v-for="r in recentRecords" :key="r._id" class="record-item">
        <text>{{ CARE_TYPE_ICON[r.type] }} {{ CARE_TYPE_LABEL[r.type] }}</text>
        <text class="record-time">{{ formatDateTime(r.createdAt) }}</text>
        <text v-if="r.userName" class="record-who">{{ r.userName }}</text>
      </view>
      <view v-if="recentRecords.length === 0" class="empty-hint">暂无养护记录</view>
    </view>

    <!-- 成长记录 -->
    <view class="section card">
      <view class="section-header">
        <text class="section-title">成长记录</text>
        <text class="section-more" @tap="goTimeline('event')">查看完整时间线 →</text>
      </view>
      <view v-for="e in recentEvents" :key="e._id" class="event-item">
        <image
          v-if="e.photos?.length"
          :src="e.photos[0]"
          class="event-thumb"
          mode="aspectFill"
        />
        <view class="event-info">
          <text>{{ EVENT_TYPE_LABEL[e.type] }}</text>
          <text class="event-date">{{ formatDate(e.eventDate) }}</text>
        </view>
      </view>
      <view v-if="recentEvents.length === 0" class="empty-hint">暂无成长记录</view>
    </view>

    <!-- 操作区 -->
    <view class="actions">
      <button class="action-btn edit-btn" @tap="goEdit">编辑</button>
      <button class="action-btn memorial-btn" @tap="moveToMemorial">移入纪念碑</button>
    </view>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
