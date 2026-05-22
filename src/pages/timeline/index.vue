<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { formatDate, formatDateTime } from '@/utils/date';
import { EVENT_TYPE_LABEL, CARE_TYPE_LABEL, CARE_TYPE_ICON } from '@/utils/constants';
import type { IGrowthEvent, IPlant, ICareRecord } from '@/interface';

const plantId = ref('');
const plantName = ref('');
const mode = ref<'care' | 'event'>('event');
const events = ref<IGrowthEvent[]>([]);
const records = ref<ICareRecord[]>([]);
const startMonth = ref('');
const endMonth = ref('');

function getNowMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function offsetMonth(base: string, offset: number) {
  const [y, m] = base.split('-').map(Number);
  const total = y * 12 + (m - 1) + offset;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

interface EventGroup {
  [yearMonth: string]: IGrowthEvent[];
}

const filteredEvents = computed(() => {
  if (!startMonth.value || !endMonth.value) return events.value;
  return events.value.filter((e) => {
    const d = new Date(e.eventDate);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return m >= startMonth.value && m <= endMonth.value;
  });
});

const grouped = computed(() => {
  const groups: EventGroup = {};
  filteredEvents.value.forEach((e) => {
    const key = formatDate(e.eventDate).slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
});

interface RecordGroup {
  [yearMonth: string]: ICareRecord[];
}

const filteredRecords = computed(() => {
  if (!startMonth.value || !endMonth.value) return records.value;
  return records.value.filter((r) => {
    const d = new Date(r.createdAt);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return m >= startMonth.value && m <= endMonth.value;
  });
});

const groupedRecords = computed(() => {
  const groups: RecordGroup = {};
  filteredRecords.value.forEach((r) => {
    const key = formatDate(r.createdAt).slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return groups;
});

const isCare = computed(() => mode.value === 'care');

function setDefaultRange() {
  const now = getNowMonth();
  if (mode.value === 'care') {
    startMonth.value = now;
    endMonth.value = now;
  } else {
    startMonth.value = offsetMonth(now, -2);
    endMonth.value = now;
  }
}

function onStartMonthChange(e: any) {
  startMonth.value = e.detail.value;
}

function onEndMonthChange(e: any) {
  endMonth.value = e.detail.value;
}

async function loadData() {
  const plantRes = await callFunction<IPlant>('plant', { action: 'get', plantId: plantId.value });
  if (plantRes.code === 0) {
    plantName.value = plantRes.data!.nickname || plantRes.data!.name;
  }

  if (mode.value === 'care') {
    const recordRes = await callFunction<ICareRecord[]>('care', { action: 'records', plantId: plantId.value });
    if (recordRes.code === 0) records.value = recordRes.data!;
  } else {
    const eventRes = await callFunction<IGrowthEvent[]>('event', { action: 'list', plantId: plantId.value });
    if (eventRes.code === 0) events.value = eventRes.data!;
  }
}

function goAdd() {
  uni.navigateTo({ url: `/pages/event-add/index?plantId=${plantId.value}` });
}

watch(mode, () => {
  setDefaultRange();
});

onLoad((opt) => {
  plantId.value = opt!.plantId as string;
  mode.value = (opt!.mode as 'care' | 'event') || 'event';
  setDefaultRange();
  uni.setNavigationBarTitle({ title: mode.value === 'care' ? '养护记录' : '成长记录' });
});
onShow(() => loadData());
</script>

<template>
  <view class="page">
    <view class="timeline-header">
      <text class="plant-name">{{ plantName || '植物' }}{{ isCare ? ' 的养护记录' : ' 的成长记录' }}</text>
      <text v-if="!isCare" class="add-btn" @tap="goAdd">+ 记录</text>
    </view>

    <view class="filter-bar">
      <view class="filter-item">
        <text class="filter-label">从</text>
        <picker mode="date" fields="month" :value="startMonth" @change="onStartMonthChange">
          <text class="filter-value">{{ startMonth }}</text>
        </picker>
      </view>
      <text class="filter-sep">至</text>
      <view class="filter-item">
        <picker mode="date" fields="month" :value="endMonth" @change="onEndMonthChange">
          <text class="filter-value">{{ endMonth }}</text>
        </picker>
      </view>
    </view>

    <!-- 养护记录模式 -->
    <template v-if="isCare">
      <view v-if="records.length === 0" class="empty-state">
        <text>{{ plantName ? '还没有养护记录' : '加载中...' }}</text>
        <text class="sub">完成养护后会自动记录</text>
      </view>

      <view v-else-if="filteredRecords.length === 0" class="empty-state">
        <text>该时间段暂无养护记录</text>
      </view>

      <view v-else class="timeline">
        <view
          v-for="(group, yearMonth) in groupedRecords"
          :key="yearMonth"
          class="month-group"
        >
          <view class="month-header">
            <text class="month-label">{{ yearMonth }}</text>
            <view class="month-line" />
          </view>

          <view v-for="r in group" :key="r._id" class="event-node">
            <view class="dot" />
            <view class="event-card card">
              <view class="event-info">
                <text class="event-type">{{ CARE_TYPE_ICON[r.type] }} {{ CARE_TYPE_LABEL[r.type] }}</text>
                <text class="event-date-text">{{ formatDateTime(r.createdAt) }}</text>
                <text v-if="r.userName" class="event-desc">操作人：{{ r.userName }}</text>
                <text v-if="r.note" class="event-desc">{{ r.note }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 成长事件模式 -->
    <template v-else>
      <view v-if="events.length === 0" class="empty-state">
        <text>{{ plantName ? '还没有记录' : '加载中...' }}</text>
        <text class="sub">开始记录植物的成长吧</text>
      </view>

      <view v-else-if="filteredEvents.length === 0" class="empty-state">
        <text>该时间段暂无成长记录</text>
      </view>

      <view v-else class="timeline">
        <view
          v-for="(group, yearMonth) in grouped"
          :key="yearMonth"
          class="month-group"
        >
          <view class="month-header">
            <text class="month-label">{{ yearMonth }}</text>
            <view class="month-line" />
          </view>

          <view v-for="e in group" :key="e._id" class="event-node">
            <view class="dot" />
            <view class="event-card card">
              <image
                v-if="e.photos?.length"
                :src="e.photos[0]"
                class="event-photo"
                mode="aspectFill"
              />
              <view class="event-info">
                <text class="event-type">{{ EVENT_TYPE_LABEL[e.type] }}</text>
                <text class="event-date-text">{{ formatDate(e.eventDate) }}</text>
                <text v-if="e.description" class="event-desc">{{
                  e.description
                }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
