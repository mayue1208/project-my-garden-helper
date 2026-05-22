<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { callFunction } from '@/utils/cloud';
import { formatDate } from '@/utils/date';
import { CARE_TYPE_LABEL, CARE_TYPE_ICON } from '@/utils/constants';

interface OpGroup {
  _id: string;
  type: string;
  plants: string[];
  createdAt: string;
}

const ops = ref<OpGroup[]>([]);
const userInfo = ref<{ nickName: string } | null>(null);

interface GroupedOps {
  [date: string]: OpGroup[];
}

const groupedOps = computed(() => {
  const groups: GroupedOps = {};
  ops.value.forEach((op) => {
    const key = formatDate(op.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(op);
  });
  return groups;
});

onLoad(async (opt) => {
  const { familyId, userId } = opt as { familyId: string; userId: string };
  const opRes = await callFunction<OpGroup[]>('family', {
    action: 'memberOps',
    familyId,
    memberId: userId,
  });
  if (opRes.code === 0) ops.value = opRes.data!;
});
</script>

<template>
  <view class="page">
    <view class="header card">
      <text class="user-name">{{ userInfo?.nickName || '家人' }}</text>
      <text class="count">共 {{ ops.length }} 条操作记录</text>
    </view>

    <view v-if="Object.keys(groupedOps).length === 0" class="empty-state">
      <text>暂无操作记录</text>
    </view>

    <view
      v-for="(group, date) in groupedOps"
      :key="date"
      class="date-group"
    >
      <text class="date-label">{{ date }}</text>
      <view v-for="op in group" :key="op._id" class="op-group card">
        <text class="op-type">{{ CARE_TYPE_ICON[op.type] }} {{ CARE_TYPE_LABEL[op.type] || op.type }}</text>
        <text class="op-plants">{{ op.plants?.join('、') || '' }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
@import './index.scss';
</style>
