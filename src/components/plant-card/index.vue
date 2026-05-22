<script setup lang="ts">
import { computed } from 'vue';
import type { IPlant } from '@/interface';
import { PLANT_STATUS_LABEL } from '@/utils/constants';

const props = defineProps<{ plant: IPlant }>();

const statusLabel = computed(() => PLANT_STATUS_LABEL[props.plant.status] || '');

const waterDays = computed(() => {
  const record = props.plant.recentRecords?.find((r) => r.type === 'water');
  if (!record) return null;
  const now = new Date();
  const recordDate = new Date(record.createdAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
  return Math.floor((today.getTime() - recordDay.getTime()) / 86400000);
});
</script>

<template>
  <view class="plant-card">
    <image v-if="plant.photo" :src="plant.photo" class="thumb" mode="aspectFill" />
    <view v-else class="thumb placeholder">🌱</view>
    <view class="info">
      <view class="name-row">
        <text class="name">{{ plant.nickname || plant.name }}</text>
        <text class="status-tag" :class="plant.status">{{ statusLabel }}</text>
      </view>
      <text class="species">{{ plant.species || '' }}</text>
      <text v-if="waterDays !== null" class="water-info">
        💧 {{ waterDays === 0 ? '今天浇过' : waterDays === 1 ? '昨天浇过' : `${waterDays}天前` }}
      </text>
      <text v-else class="water-info">💧 暂无浇水记录</text>
    </view>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
