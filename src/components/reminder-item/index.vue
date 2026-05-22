<script setup lang="ts">
import { computed } from 'vue';
import { isOverdue as checkOverdue } from '@/utils/date';
import { CARE_TYPE_LABEL, CARE_TYPE_ICON } from '@/utils/constants';
import type { IReminder } from '@/interface';

const props = defineProps<{ item: IReminder }>();
const emit = defineEmits<{
  done: [item: IReminder];
  delay: [item: IReminder];
}>();

const isOverdue = computed(() => {
  if (props.item.isDelayed) return checkOverdue(props.item.nextTime);
  return false;
});

const daysSinceLast = computed(() => {
  if (!props.item.lastTime) return '-';
  return Math.floor(
    (Date.now() - new Date(props.item.lastTime).getTime()) / 86400000,
  );
});

const doneLabel = computed(() => {
  const labels: Record<string, string> = {
    water: '已浇',
    fertilize: '已施',
    prune: '已剪',
    pesticide: '已杀虫',
  };
  return labels[props.item.type] || '已完成';
});
</script>

<template>
  <view
    class="reminder-item"
    :class="{ overdue: isOverdue, delayed: item.isDelayed }"
  >
    <view class="info">
      <text class="plant-name">{{ item.plantName }}</text>
      <view class="meta">
        <text>{{ CARE_TYPE_ICON[item.type] }} {{ CARE_TYPE_LABEL[item.type] }}</text>
        <text v-if="item.lastTime" class="last">上次：{{ daysSinceLast }}天前</text>
        <text v-if="item.isDelayed" class="delayed-tag">⏰ 已延后</text>
      </view>
    </view>
    <view class="actions">
      <button class="btn-done" @tap="emit('done', item)">{{ doneLabel }}</button>
      <button class="btn-delay" @tap="emit('delay', item)">延后</button>
    </view>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
