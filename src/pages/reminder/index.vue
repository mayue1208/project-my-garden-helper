<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { useFamilyStore } from '@/store/family';
import { formatDate, isToday } from '@/utils/date';
import { DELAY_OPTIONS } from '@/utils/constants';
import FamilySwitcher from '@/components/family-switcher/index.vue';
import ReminderItem from '@/components/reminder-item/index.vue';
import QuickRecord from '@/components/quick-record/index.vue';
import type { IReminder, IRoom } from '@/interface';
import { useUserStore } from '@/store/user';

const familyStore = useFamilyStore();
const submitting = ref(false);
const reminders = ref<IReminder[]>([]);
const rooms = ref<IRoom[]>([]);
const roomIndex = ref(0);
const timeTab = ref<'today' | '2days' | '3days' | '7days'>('today');

const timeTabDays: Record<string, number> = {
  today: 1,
  '2days': 2,
  '3days': 3,
  '7days': 7,
};
const delayTarget = ref<IReminder | null>(null);
const showQuickPanel = ref(false);
const showDelayPanel = ref(false);

const roomOptions = computed(() => [
  '全部房间',
  ...rooms.value.map((r) => r.name),
]);

interface ReminderGroup {
  [date: string]: IReminder[];
}

const groupedReminders = computed(() => {
  const groups: ReminderGroup = {};
  const now = new Date();
  const today = formatDate(now);

  reminders.value.forEach((r) => {
    const key = formatDate(r.nextTime);
    if (timeTab.value === 'today') {
      // 逾期归入今天
      if (key <= today) {
        if (!groups[today]) groups[today] = [];
        groups[today].push(r);
      }
    } else {
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
  });
  return groups;
});

function dateLabel(dateStr: string) {
  if (isToday(dateStr)) return '📅 今日';
  return `📅 ${dateStr}`;
}

const userStore = useUserStore();

async function loadReminders() {
  if (!userStore.isLoggedIn) return;
  if (!familyStore.currentFamilyId) return;
  const selectedRoom =
    roomIndex.value > 0 ? rooms.value[roomIndex.value - 1]._id : null;
  const [remindRes, roomRes] = await Promise.all([
    callFunction<IReminder[]>('care', {
      action: 'reminders',
      familyId: familyStore.currentFamilyId,
      roomId: selectedRoom,
      days: timeTabDays[timeTab.value],
    }),
    callFunction<IRoom[]>('room', {
      action: 'list',
      familyId: familyStore.currentFamilyId,
    }),
  ]);
  if (remindRes.code === 0) reminders.value = remindRes.data!;
  if (roomRes.code === 0) rooms.value = roomRes.data!;
}

async function markDone(item: IReminder) {
  if (submitting.value) return;
  submitting.value = true;
  uni.showLoading({ title: '记录中...', mask: true });
  try {
    await callFunction('care', {
      action: 'record',
      plantId: item.plantId,
      familyId: familyStore.currentFamilyId,
      type: item.type,
    });
    uni.showToast({ title: '已记录', icon: 'success' });
    await loadReminders();
  } finally {
    uni.hideLoading();
    submitting.value = false;
  }
}

function delayReminder(item: IReminder) {
  delayTarget.value = item;
  showDelayPanel.value = true;
}

async function confirmDelay(opt: (typeof DELAY_OPTIONS)[number]) {
  if (submitting.value || !delayTarget.value) return;
  submitting.value = true;
  uni.showLoading({ title: '处理中...', mask: true });
  try {
    await callFunction('delayed_reminders', {
      action: 'create',
      plantId: delayTarget.value.plantId,
      familyId: familyStore.currentFamilyId,
      type: delayTarget.value.type,
      remindAt: new Date(opt.getTime()).toISOString(),
    });
    uni.showToast({ title: '已延后' });
    delayTarget.value = null;
    showDelayPanel.value = false;
    await loadReminders();
  } finally {
    uni.hideLoading();
    submitting.value = false;
  }
}

function showQuickRecord() {
  showQuickPanel.value = true;
}

function onRoomChange(e: any) {
  roomIndex.value = e.detail.value;
  loadReminders();
}

function goToProfile() {
  uni.switchTab({ url: '/pages/profile/index' });
}

onShow(() => loadReminders());
onMounted(() => {
  uni.$on('familyChanged', loadReminders);
});
</script>

<template>
  <view class="page">
    <family-switcher />

    <view v-if="!userStore.isLoggedIn" class="empty-state" @tap="goToProfile">
      <text class="empty-icon">👤</text>
      <text>请先登录</text>
      <text class="sub">点击前往个人页授权登录</text>
    </view>
    <template v-if="userStore.isLoggedIn">
    <view class="filter-bar card">
      <picker @change="onRoomChange" :value="roomIndex" :range="roomOptions">
        <text class="filter-text">{{ roomOptions[roomIndex] }} ▼</text>
      </picker>
      <view class="time-tabs">
        <text
          :class="{ active: timeTab === 'today' }"
          @tap="timeTab = 'today'; loadReminders()"
        >今日</text>
        <text
          :class="{ active: timeTab === '2days' }"
          @tap="timeTab = '2days'; loadReminders()"
        >近2天</text>
        <text
          :class="{ active: timeTab === '3days' }"
          @tap="timeTab = '3days'; loadReminders()"
        >近3天</text>
        <text
          :class="{ active: timeTab === '7days' }"
          @tap="timeTab = '7days'; loadReminders()"
        >7天</text>
      </view>
      <text class="quick-btn" @tap="showQuickRecord">📝+</text>
    </view>

    <view v-if="Object.keys(groupedReminders).length === 0" class="empty-state">
      <text class="empty-icon">🌿</text>
      <text>所有植物都照顾好了，真棒！</text>
    </view>

    <view
      v-for="(group, date) in groupedReminders"
      :key="date"
      class="date-group"
    >
      <text class="date-title">{{ dateLabel(date) }}</text>
      <reminder-item
        v-for="item in group"
        :key="`${item.plantId}_${item.type}`"
        :item="item"
        @done="markDone"
        @delay="delayReminder"
      />
    </view>

    <quick-record v-model:visible="showQuickPanel" />

    <!-- 延迟提醒选择器 -->
    <view v-if="showDelayPanel" class="overlay" @tap="showDelayPanel = false" />
    <view v-if="showDelayPanel" class="delay-panel">
      <text class="delay-title">延后提醒</text>
      <view
        v-for="opt in DELAY_OPTIONS"
        :key="opt.label"
        class="delay-option"
        @tap="confirmDelay(opt)"
      >
        <text>{{ opt.label }}</text>
      </view>
      <button class="cancel-delay" @tap="showDelayPanel = false">取消</button>
    </view>
    </template>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
